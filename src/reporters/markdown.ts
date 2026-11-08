import { AnalysisReport } from '../engine/analyzer.js';
import { SecurityIssue } from '../engine/validator.js';

export function reportMarkdown(report: AnalysisReport, securityIssues: SecurityIssue[] = []): string {
  let md = `### 🔍 \`envdiff\` Environment Consistency Report\n\n`;

  let hasIssues = false;

  if (report.missingInExample.length > 0) {
    hasIssues = true;
    md += `#### ❌ Missing in \`.env.example\` (${report.missingInExample.length})\n`;
    md += `| Variable | Referenced In |\n|---|---|\n`;
    for (const item of report.missingInExample) {
      const locs = item.locations.map(l => `\`${l.file}:${l.line}\``).join(', ');
      md += `| \`${item.name}\` | ${locs} |\n`;
    }
    md += `\n`;
  }

  if (report.missingInEnv.length > 0) {
    hasIssues = true;
    md += `#### ❌ Missing in local \`.env\` (${report.missingInEnv.length})\n`;
    md += `| Variable | .env.example Line |\n|---|---|\n`;
    for (const item of report.missingInEnv) {
      md += `| \`${item.name}\` | line ${item.exampleLine} |\n`;
    }
    md += `\n`;
  }

  if (securityIssues.length > 0) {
    hasIssues = true;
    md += `#### 🔒 Security & Format Warnings (${securityIssues.length})\n`;
    md += `| Variable | Issue | Line |\n|---|---|---|\n`;
    for (const issue of securityIssues) {
      md += `| \`${issue.variable}\` | ${issue.message} | line ${issue.line} |\n`;
    }
    md += `\n`;
  }

  if (report.unusedInCode.length > 0) {
    md += `#### ⚠️ Unused Variables in Code (${report.unusedInCode.length})\n`;
    md += `| Variable | .env.example Line |\n|---|---|\n`;
    for (const item of report.unusedInCode) {
      md += `| \`${item.name}\` | line ${item.line} |\n`;
    }
    md += `\n`;
  }

  if (!hasIssues && report.unusedInCode.length === 0 && securityIssues.length === 0) {
    md += `✨ **All environment variables are consistent, secure, and synchronized!** 🎉\n`;
  } else if (!hasIssues) {
    md += `✅ **No critical errors found.** Some warnings or unused variables detected.\n`;
  } else {
    md += `💥 **Consistency check failed.** Please update your environment files before merging.\n`;
  }

  return md;
}
