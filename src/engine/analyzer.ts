import { EnvDiffConfig } from '../config.js';

export interface DiffIssue {
  type: 'missing_in_example' | 'unused_in_code' | 'missing_in_env' | 'missing_in_example_from_env';
  variable: string;
  locations?: { file: string; line: number }[];
  exampleLine?: number;
  envLine?: number;
}

export interface AnalysisReport {
  isValid: boolean;
  missingInExample: { name: string; locations: { file: string; line: number }[] }[];
  unusedInCode: { name: string; line?: number }[];
  missingInEnv: { name: string; exampleLine?: number }[];
  missingInExampleFromEnv: { name: string; envLine?: number }[];
  warnings: string[];
}

export function analyzeEnvironment(
  codeUsages: Map<string, { file: string; line: number }[]>,
  envExampleVars: Map<string, number>,
  envVars: Map<string, number>,
  config: EnvDiffConfig,
  codeWarnings: string[]
): AnalysisReport {
  const ignoredSet = new Set(config.ignore.map(v => v.toUpperCase()));

  const missingInExample: { name: string; locations: { file: string; line: number }[] }[] = [];
  const unusedInCode: { name: string; line?: number }[] = [];
  const missingInEnv: { name: string; exampleLine?: number }[] = [];
  const missingInExampleFromEnv: { name: string; envLine?: number }[] = [];

  // 1. Check code usages vs .env.example
  for (const [varName, locations] of codeUsages.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;

    if (!envExampleVars.has(varName)) {
      missingInExample.push({ name: varName, locations });
    }
  }

  // 2. Check .env.example vs code usages
  for (const [varName, line] of envExampleVars.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;

    if (!codeUsages.has(varName)) {
      unusedInCode.push({ name: varName, line });
    }
  }

  // 3. Check .env.example vs .env (desync)
  for (const [varName, exampleLine] of envExampleVars.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;

    if (!envVars.has(varName)) {
      missingInEnv.push({ name: varName, exampleLine });
    }
  }

  // 4. Check .env vs .env.example
  for (const [varName, envLine] of envVars.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;

    if (!envExampleVars.has(varName)) {
      missingInExampleFromEnv.push({ name: varName, envLine });
    }
  }

  const hasErrors = missingInExample.length > 0 || missingInEnv.length > 0;
  const isValid = config.strict ? (hasErrors && codeWarnings.length === 0) : !hasErrors;

  return {
    isValid: !hasErrors,
    missingInExample,
    unusedInCode,
    missingInEnv,
    missingInExampleFromEnv,
    warnings: codeWarnings,
  };
}
