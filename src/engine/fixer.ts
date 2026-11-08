import fs from 'node:fs';
import path from 'node:path';

export function fixEnvExample(
  envExamplePath: string,
  missingVariables: { name: string; locations: { file: string; line: number }[] }[]
): string[] {
  if (missingVariables.length === 0) return [];

  const absolutePath = path.resolve(envExamplePath);
  let existingContent = '';

  if (fs.existsSync(absolutePath)) {
    existingContent = fs.readFileSync(absolutePath, 'utf-8');
  }

  // Ensure trailing newline
  if (existingContent && !existingContent.endsWith('\n')) {
    existingContent += '\n';
  }

  const addedVars: string[] = [];
  let newContent = existingContent;

  if (!existingContent && missingVariables.length > 0) {
    newContent += `# Added automatically by envdiff --fix\n`;
  }

  for (const item of missingVariables) {
    const varName = item.name;
    // Check if it's already in content (just in case)
    const regex = new RegExp(`^\\s*(?:export\\s+)?${varName}\\s*=`, 'm');
    if (!regex.test(newContent)) {
      newContent += `${varName}=\n`;
      addedVars.push(varName);
    }
  }

  fs.writeFileSync(absolutePath, newContent, 'utf-8');
  return addedVars;
}
