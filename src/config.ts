import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';

export interface EnvDiffConfig {
  envPath: string;
  envExamplePath: string;
  ignore: string[];
  excludeDirs: string[];
  strict: boolean;
}

export const defaultConfig: EnvDiffConfig = {
  envPath: '.env',
  envExamplePath: '.env.example',
  ignore: ['NODE_ENV', 'PORT', 'PATH', 'PWD', 'HOME', 'USER', 'TZ'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage'],
  strict: false,
};

export function loadConfig(cwd: string = process.cwd(), customConfigPath?: string): EnvDiffConfig {
  let userConfig: Partial<EnvDiffConfig> = {};
  const configPath = customConfigPath || path.join(cwd, '.envdiffrc');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      userConfig = JSON.parse(content);
    } catch (e) {
      console.warn(`Warning: Could not parse config file at ${configPath}`);
    }
  }

  return {
    ...defaultConfig,
    ...userConfig,
    ignore: [...defaultConfig.ignore, ...(userConfig.ignore || [])],
    excludeDirs: [...defaultConfig.excludeDirs, ...(userConfig.excludeDirs || [])],
  };
}

export function loadIgnoreRules(cwd: string): (filePath: string) => boolean {
  const ig = ignore();
  
  // Default exclusions
  ig.add(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.expo']);

  // Load .gitignore if present
  const gitignorePath = path.join(cwd, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      ig.add(content);
    } catch (e) {
      // ignore
    }
  }

  // Load .envdiffignore if present
  const envdiffignorePath = path.join(cwd, '.envdiffignore');
  if (fs.existsSync(envdiffignorePath)) {
    try {
      const content = fs.readFileSync(envdiffignorePath, 'utf-8');
      ig.add(content);
    } catch (e) {
      // ignore
    }
  }

  return (relativePath: string) => ig.ignores(relativePath);
}
