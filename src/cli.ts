import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { loadConfig } from './config.js';
import { loadEnvFile } from './env/loader.js';
import { scanCodebase } from './scanners/index.js';
import { analyzeEnvironment } from './engine/analyzer.js';
import { validateEnvSecurity } from './engine/validator.js';
import { reportConsole } from './reporters/console.js';
import { reportJson } from './reporters/json.js';
import { reportMarkdown } from './reporters/markdown.js';
import { fixEnvExample } from './engine/fixer.js';
import pc from 'picocolors';

const program = new Command();

program
  .name('envdiff')
  .description('Verify environment variables consistency across code, .env, and .env.example')
  .version('1.0.0')
  .option('-d, --dir <path>', 'Directory to scan', process.cwd())
  .option('-c, --config <path>', 'Path to custom config file (.envdiffrc)')
  .option('--env-file <path>', 'Path to local .env file')
  .option('--env-example <path>', 'Path to .env.example file')
  .option('--ci', 'Run in CI mode (exits with code 1 on errors)')
  .option('--json', 'Output report in JSON format')
  .option('--markdown [path]', 'Generate Markdown report file (default: envdiff-report.md)')
  .option('--fix', 'Automatically add missing variables to .env.example')
  .option('--security', 'Enable security and format validation for .env values')
  .action((options) => {
    const cwd = path.resolve(options.dir);
    const config = loadConfig(cwd, options.config);

    const envPath = path.resolve(cwd, options.envFile || config.envPath);
    const envExamplePath = path.resolve(cwd, options.envExample || config.envExamplePath);

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

    const securityIssues = options.security ? validateEnvSecurity(envPath) : [];

    if (options.fix && report.missingInExample.length > 0) {
      const added = fixEnvExample(envExamplePath, report.missingInExample);
      if (!options.json && options.markdown === undefined) {
        console.log(pc.green(`✨ Successfully added ${added.length} missing variable(s) to ${envExamplePath}\n`));
      }
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
      console.log(reportJson({ ...report, securityIssues }));
    } else if (options.markdown !== undefined) {
      const mdContent = reportMarkdown(report, securityIssues);
      const mdFilePath = path.resolve(cwd, typeof options.markdown === 'string' ? options.markdown : 'envdiff-report.md');
      fs.writeFileSync(mdFilePath, mdContent, 'utf-8');
      console.log(pc.green(`✨ Markdown report successfully generated at ${mdFilePath}\n`));
    } else {
      reportConsole(report);
      if (securityIssues.length > 0) {
        console.log(pc.yellow(pc.bold(`🔒 Security & Format Warnings (${securityIssues.length}):`)));
        for (const issue of securityIssues) {
          console.log(`   • [${issue.variable}] ${issue.message} ${issue.line ? `(line ${issue.line})` : ''}`);
        }
        console.log('');
      }
    }

    const hasSecurityErrors = securityIssues.length > 0 && options.security;
    if (options.ci && (!report.isValid || hasSecurityErrors)) {
      process.exit(1);
    }
  });

program.parse();
