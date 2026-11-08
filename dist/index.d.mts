interface EnvDiffConfig {
    envPath: string;
    envExamplePath: string;
    ignore: string[];
    excludeDirs: string[];
    strict: boolean;
}
declare function loadConfig(cwd?: string, customConfigPath?: string): EnvDiffConfig;
declare function loadIgnoreRules(cwd: string): (filePath: string) => boolean;

interface EnvFileResult {
    path: string;
    exists: boolean;
    variables: Map<string, number>;
}
declare function loadEnvFile(filePath: string): EnvFileResult;

interface ScanResult {
    usages: Map<string, {
        file: string;
        line: number;
    }[]>;
    warnings: string[];
}
declare function scanCodebase(cwd?: string): ScanResult;

interface DiffIssue {
    type: 'missing_in_example' | 'unused_in_code' | 'missing_in_env' | 'missing_in_example_from_env';
    variable: string;
    locations?: {
        file: string;
        line: number;
    }[];
    exampleLine?: number;
    envLine?: number;
}
interface AnalysisReport {
    isValid: boolean;
    missingInExample: {
        name: string;
        locations: {
            file: string;
            line: number;
        }[];
    }[];
    unusedInCode: {
        name: string;
        line?: number;
    }[];
    missingInEnv: {
        name: string;
        exampleLine?: number;
    }[];
    missingInExampleFromEnv: {
        name: string;
        envLine?: number;
    }[];
    warnings: string[];
}
declare function analyzeEnvironment(codeUsages: Map<string, {
    file: string;
    line: number;
}[]>, envExampleVars: Map<string, number>, envVars: Map<string, number>, config: EnvDiffConfig, codeWarnings: string[]): AnalysisReport;

declare function fixEnvExample(envExamplePath: string, missingVariables: {
    name: string;
    locations: {
        file: string;
        line: number;
    }[];
}[]): string[];

declare function reportConsole(report: AnalysisReport): void;

declare function reportJson(report: AnalysisReport): string;

export { type AnalysisReport, type DiffIssue, type EnvDiffConfig, type EnvFileResult, type ScanResult, analyzeEnvironment, fixEnvExample, loadConfig, loadEnvFile, loadIgnoreRules, reportConsole, reportJson, scanCodebase };
