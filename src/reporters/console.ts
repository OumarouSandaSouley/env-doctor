import pc from 'picocolors';
import { AnalysisReport } from '../engine/analyzer.js';

export function reportConsole(report: AnalysisReport): void {
  console.log(pc.bold(pc.cyan('\n🔍 envdiff - Environment Consistency Report\n')));

  let hasIssues = false;

  // 1. Missing in .env.example
  if (report.missingInExample.length > 0) {
    hasIssues = true;
    console.log(pc.red(pc.bold(`❌ Missing in .env.example (${report.missingInExample.length}):`)));
    console.log(pc.dim('   These variables are used in your code but are missing from .env.example:\n'));
    for (const item of report.missingInExample) {
      console.log(`   • ${pc.yellow(pc.bold(item.name))}`);
      for (const loc of item.locations) {
        console.log(pc.dim(`     ↳ referenced in ${loc.file}:${loc.line}`));
      }
    }
    console.log('');
  }

  // 2. Missing in .env (local desync)
  if (report.missingInEnv.length > 0) {
    hasIssues = true;
    console.log(pc.red(pc.bold(`❌ Missing in local .env (${report.missingInEnv.length}):`)));
    console.log(pc.dim('   These variables are in .env.example but missing from your local .env:\n'));
    for (const item of report.missingInEnv) {
      console.log(`   • ${pc.yellow(pc.bold(item.name))} ${pc.dim(`(line ${item.exampleLine} in .env.example)`)}`);
    }
    console.log('');
  }

  // 3. Present in .env but missing in .env.example
  if (report.missingInExampleFromEnv.length > 0) {
    console.log(pc.yellow(pc.bold(`⚠️  Extra in local .env (${report.missingInExampleFromEnv.length}):`)));
    console.log(pc.dim('   These variables are in .env but missing from .env.example:\n'));
    for (const item of report.missingInExampleFromEnv) {
      console.log(`   • ${pc.yellow(pc.bold(item.name))} ${pc.dim(`(line ${item.envLine} in .env)`)}`);
    }
    console.log('');
  }

  // 4. Unused in code
  if (report.unusedInCode.length > 0) {
    console.log(pc.yellow(pc.bold(`⚠️  Unused variables in code (${report.unusedInCode.length}):`)));
    console.log(pc.dim('   These variables are declared in .env.example but never read in the code:\n'));
    for (const item of report.unusedInCode) {
      console.log(`   • ${pc.yellow(pc.bold(item.name))} ${pc.dim(`(line ${item.line} in .env.example)`)}`);
    }
    console.log('');
  }

  // 5. Warnings (dynamic access)
  if (report.warnings.length > 0) {
    console.log(pc.yellow(pc.bold(`⚠️  Warnings (${report.warnings.length}):`)));
    for (const warning of report.warnings) {
      console.log(`   • ${warning}`);
    }
    console.log('');
  }

  if (!hasIssues && report.missingInExampleFromEnv.length === 0 && report.unusedInCode.length === 0 && report.warnings.length === 0) {
    console.log(pc.green(pc.bold('✨ All environment variables are consistent and synchronized!\n')));
  } else if (!hasIssues) {
    console.log(pc.green(pc.bold('✅ No critical errors found. Some warnings or extra variables detected.\n')));
  } else {
    console.log(pc.red(pc.bold('💥 Consistency check failed. Please fix the missing environment variables.\n')));
  }
}
