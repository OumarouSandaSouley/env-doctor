import { Command } from 'commander';
import path from 'node:path';
import { loadConfig } from './config.js';
import { loadEnvFile } from './env/loader.js';
import { scanCodebase } from './scanners/index.js';
import { analyzeEnvironment } from './engine/analyzer.js';
import { reportConsole } from './reporters/console.js';
import { reportJson } from './reporters/json.js';
import { fixEnvExample } from './engine/fixer.js';
import pc from 'picocolors';

const program = new Command();

program
  .name('envdiff')
  .description('Verify environment variables consistency across code, .env, and .env.example')
  .version('1.0.0')
  .option('-d, --dir <path>', 'Directory to scan', process.cwd())
  .option('-c, --config <path>', 'Path to custom config file (.envdiffrc)')
  .option('--ci', 'Run in CI mode (exits with code 1 on errors)')
  .option('--json', 'Output report in JSON format')
  .option('--fix', 'Automatically add missing variables to .env.example')
  .action((options) => {
    const cwd = path.resolve(options.dir);
    const config = loadConfig(cwd, options.config);

    const envPath = path.resolve(cwd, config.envPath);
    const envExamplePath = path.resolve(cwd, config.envExamplePath);

    const envResult = loadEnvFile(envPath);
    const envExampleResult = loadEnvFile(envExamplePath);

    const scanResult = scanCodebase(cwd);

    let report = analyzeEnvironment(
      scanResult.usages,
      envExampleResult.variables,
      envResult.variables,
      config,
      scanResult.warnings
    );

    if (options.fix && report.missingInExample.length > 0) {
      const added = fixEnvExample(envExamplePath, report.missingInExample);
      if (!options.json) {
        console.log(pc.green(`✨ Successfully added ${added.length} missing variable(s) to ${config.envExamplePath}\n`));
      }
      // Re-load and re-analyze after fix
      const updatedEnvExampleResult = loadEnvFile(envExamplePath);
      report = analyzeEnvironment(
        scanResult.usages,
        updatedEnvExampleResult.variables,
        envResult.variables,
        config,
        scanResult.warnings
      );
    }

    if (options.json) {
      console.log(reportJson(report));
    } else {
      reportConsole(report);
    }

    if (options.ci && !report.isValid) {
      process.exit(1);
    }
  });

program.parse();
