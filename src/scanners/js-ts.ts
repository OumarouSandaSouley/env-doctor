import fs from 'node:fs';

export interface EnvUsage {
  name: string;
  file: string;
  line: number;
  type: 'static' | 'dynamic';
}

export function scanJsTsFile(filePath: string): { usages: EnvUsage[]; warnings: string[] } {
  const usages: EnvUsage[] = [];
  const warnings: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. process.env.PROP or import.meta.env.PROP
      const staticPropRegex = /(?:process\.env|import\.meta\.env)\.([A-Za-z_][A-Za-z0-9_]*)/g;
      let match;
      while ((match = staticPropRegex.exec(line)) !== null) {
        usages.push({
          name: match[1],
          file: filePath,
          line: lineNum,
          type: 'static',
        });
      }

      // 2. process.env['PROP'] or process.env["PROP"]
      const bracketRegex = /(?:process\.env|import\.meta\.env)\s*\[\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1\s*\]/g;
      while ((match = bracketRegex.exec(line)) !== null) {
        usages.push({
          name: match[2],
          file: filePath,
          line: lineNum,
          type: 'static',
        });
      }

      // 3. Destructuring: const { A, B } = process.env;
      const destructuringRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*(?:process\.env|import\.meta\.env)/g;
      while ((match = destructuringRegex.exec(line)) !== null) {
        const varsStr = match[1];
        const varNames = varsStr.split(',').map(v => v.trim().split(':')[0].trim());
        for (const v of varNames) {
          if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
            usages.push({
              name: v,
              file: filePath,
              line: lineNum,
              type: 'static',
            });
          }
        }
      }

      // 4. Dynamic access: process.env[dynamicName] (without string literal)
      const dynamicRegex = /(?:process\.env|import\.meta\.env)\s*\[\s*(?![(['"])([A-Za-z_][A-Za-z0-9_.-]*)\s*\]/g;
      while ((match = dynamicRegex.exec(line)) !== null) {
        warnings.push(`Dynamic environment variable access detected in ${filePath}:${lineNum} -> ${match[0]}`);
      }
    });
  } catch (e) {
    // Error reading file
  }

  return { usages, warnings };
}
