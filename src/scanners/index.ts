import fs from 'node:fs';
import path from 'node:path';
import { EnvUsage, scanJsTsFile } from './js-ts.js';
import { scanPythonFile } from './python.js';
import { loadIgnoreRules } from '../config.js';

export interface ScanResult {
  usages: Map<string, { file: string; line: number }[]>; // varName -> locations
  warnings: string[];
}

function walkDir(dir: string, baseDir: string, isIgnored: (p: string) => boolean, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (isIgnored(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, isIgnored, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

export function scanCodebase(cwd: string = process.cwd()): ScanResult {
  const isIgnored = loadIgnoreRules(cwd);
  const files = walkDir(cwd, cwd, isIgnored);

  const usageMap = new Map<string, { file: string; line: number }[]>();
  const allWarnings: string[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    let result: { usages: EnvUsage[]; warnings: string[] };

    if (['.py'].includes(ext)) {
      result = scanPythonFile(file);
    } else {
      result = scanJsTsFile(file);
    }

    for (const usage of result.usages) {
      if (!usageMap.has(usage.name)) {
        usageMap.set(usage.name, []);
      }
      usageMap.get(usage.name)!.push({ file: path.relative(cwd, usage.file), line: usage.line });
    }

    allWarnings.push(...result.warnings);
  }

  return {
    usages: usageMap,
    warnings: allWarnings,
  };
}
