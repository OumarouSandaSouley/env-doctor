import fs from 'node:fs';
import { EnvUsage } from './js-ts.js';

export function scanPythonFile(filePath: string): { usages: EnvUsage[]; warnings: string[] } {
  const usages: EnvUsage[] = [];
  const warnings: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. os.environ.get('VAR') or os.environ["VAR"]
      const environRegex = /os\.environ(?:\.get)?\s*[\(\[]\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g;
      let match;
      while ((match = environRegex.exec(line)) !== null) {
        usages.push({
          name: match[2],
          file: filePath,
          line: lineNum,
          type: 'static',
        });
      }

      // 2. os.getenv('VAR')
      const getenvRegex = /os\.getenv\s*\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g;
      while ((match = getenvRegex.exec(line)) !== null) {
        usages.push({
          name: match[2],
          file: filePath,
          line: lineNum,
          type: 'static',
        });
      }
    });
  } catch (e) {
    // Error reading file
  }

  return { usages, warnings };
}
