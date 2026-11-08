import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

export interface EnvFileResult {
  path: string;
  exists: boolean;
  variables: Map<string, number>; // varName -> line number
}

export function loadEnvFile(filePath: string): EnvFileResult {
  const absolutePath = path.resolve(filePath);
  const result: EnvFileResult = {
    path: filePath,
    exists: false,
    variables: new Map(),
  };

  if (!fs.existsSync(absolutePath)) {
    return result;
  }

  result.exists = true;
  try {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      // Match KEY=value or export KEY=value
      const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) {
        const varName = match[1];
        result.variables.set(varName, index + 1);
      }
    });
  } catch (e) {
    // error reading file
  }

  return result;
}
