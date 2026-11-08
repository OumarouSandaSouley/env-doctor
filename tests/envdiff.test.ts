import { describe, it, expect } from 'vitest';
import { loadEnvFile } from '../src/env/loader.js';
import { analyzeEnvironment } from '../src/engine/analyzer.js';
import { fixEnvExample } from '../src/engine/fixer.js';
import { validateEnvSecurity } from '../src/engine/validator.js';
import { reportMarkdown } from '../src/reporters/markdown.js';
import { defaultConfig } from '../src/config.js';
import fs from 'node:fs';
import path from 'node:path';

describe('envdiff core tests', () => {
  it('should load env file variables correctly', () => {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-env-'));
    const envPath = path.join(tempDir, '.env');
    fs.writeFileSync(envPath, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\n# Comment line\n');

    const result = loadEnvFile(envPath);
    expect(result.exists).toBe(true);
    expect(result.variables.get('DATABASE_URL')).toBe(1);
    expect(result.variables.get('API_KEY')).toBe(2);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should detect missing variables in example', () => {
    const usages = new Map<string, { file: string; line: number }[]>();
    usages.set('STRIPE_KEY', [{ file: 'src/index.ts', line: 10 }]);

    const envExampleVars = new Map<string, number>();
    const envVars = new Map<string, number>();

    const report = analyzeEnvironment(usages, envExampleVars, envVars, defaultConfig, []);

    expect(report.isValid).toBe(false);
    expect(report.missingInExample.length).toBe(1);
    expect(report.missingInExample[0].name).toBe('STRIPE_KEY');
  });

  it('should auto-fix missing variables in .env.example', () => {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-fix-'));
    const envExamplePath = path.join(tempDir, '.env.example');
    fs.writeFileSync(envExamplePath, 'PORT=3000\n');

    const missing = [{ name: 'NEW_API_KEY', locations: [{ file: 'src/app.ts', line: 5 }] }];
    const added = fixEnvExample(envExamplePath, missing);

    expect(added).toContain('NEW_API_KEY');
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    expect(content).toContain('NEW_API_KEY=');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should validate security and format issues', () => {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-sec-'));
    const envPath = path.join(tempDir, '.env');
    fs.writeFileSync(envPath, 'api_key=123\nDATABASE_URL=not-a-url\n');

    const issues = validateEnvSecurity(envPath);
    expect(issues.length).toBeGreaterThan(0);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate markdown report for PR comments', () => {
    const report = {
      isValid: true,
      missingInExample: [],
      unusedInCode: [],
      missingInEnv: [],
      missingInExampleFromEnv: [],
      warnings: [],
    };
    const md = reportMarkdown(report, []);
    expect(md).toContain('envdiff');
  });
});
