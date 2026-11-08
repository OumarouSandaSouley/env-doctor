import fs from 'node:fs';
import path from 'node:path';

export interface SecurityIssue {
  variable: string;
  type: 'weak_value' | 'invalid_url' | 'naming_convention';
  message: string;
  line?: number;
}

export function validateEnvSecurity(envPath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const absolutePath = path.resolve(envPath);

  if (!fs.existsSync(absolutePath)) {
    return issues;
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    const weakValues = ['password', 'secret', '12345', 'changeme', 'admin', 'test', 'foo', 'bar', '123456', 'qwerty'];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['"]?)(.*?)\2\s*$/);
      if (match) {
        const varName = match[1];
        const val = match[3].trim().toLowerCase();

        // 1. Naming convention (should be UPPER_SNAKE_CASE)
        if (varName !== varName.toUpperCase()) {
          issues.push({
            variable: varName,
            type: 'naming_convention',
            message: `Variable '${varName}' should be in UPPER_SNAKE_CASE`,
            line: lineNum,
          });
        }

        // 2. Weak values
        if (weakValues.includes(val) || val.length < 3) {
          issues.push({
            variable: varName,
            type: 'weak_value',
            message: `Variable '${varName}' has a weak or default value ('${match[3]}')`,
            line: lineNum,
          });
        }

        // 3. URL format validation for _URL or _URI
        if ((varName.endsWith('_URL') || varName.endsWith('_URI')) && val.length > 0) {
          try {
            new URL(match[3].trim());
          } catch (e) {
            issues.push({
              variable: varName,
              type: 'invalid_url',
              message: `Variable '${varName}' does not contain a valid URL format ('${match[3]}')`,
              line: lineNum,
            });
          }
        }
      }
    });
  } catch (e) {
    // error reading file
  }

  return issues;
}
