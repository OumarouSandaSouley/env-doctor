// src/config.ts
import fs from "fs";
import path from "path";
import ignore from "ignore";
var defaultConfig = {
  envPath: ".env",
  envExamplePath: ".env.example",
  ignore: ["NODE_ENV", "PORT", "PATH", "PWD", "HOME", "USER", "TZ"],
  excludeDirs: ["node_modules", ".git", "dist", "build", "coverage"],
  strict: false
};
function loadConfig(cwd = process.cwd(), customConfigPath) {
  let userConfig = {};
  const configPath = customConfigPath || path.join(cwd, ".envdiffrc");
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      userConfig = JSON.parse(content);
    } catch (e) {
      console.warn(`Warning: Could not parse config file at ${configPath}`);
    }
  }
  return {
    ...defaultConfig,
    ...userConfig,
    ignore: [...defaultConfig.ignore, ...userConfig.ignore || []],
    excludeDirs: [...defaultConfig.excludeDirs, ...userConfig.excludeDirs || []]
  };
}
function loadIgnoreRules(cwd) {
  const ig = ignore();
  ig.add(["node_modules", ".git", "dist", "build", "coverage", ".next", ".expo"]);
  const gitignorePath = path.join(cwd, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, "utf-8");
      ig.add(content);
    } catch (e) {
    }
  }
  const envdiffignorePath = path.join(cwd, ".envdiffignore");
  if (fs.existsSync(envdiffignorePath)) {
    try {
      const content = fs.readFileSync(envdiffignorePath, "utf-8");
      ig.add(content);
    } catch (e) {
    }
  }
  return (relativePath) => ig.ignores(relativePath);
}

// src/env/loader.ts
import fs2 from "fs";
import path2 from "path";
function loadEnvFile(filePath) {
  const absolutePath = path2.resolve(filePath);
  const result = {
    path: filePath,
    exists: false,
    variables: /* @__PURE__ */ new Map()
  };
  if (!fs2.existsSync(absolutePath)) {
    return result;
  }
  result.exists = true;
  try {
    const content = fs2.readFileSync(absolutePath, "utf-8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) {
        const varName = match[1];
        result.variables.set(varName, index + 1);
      }
    });
  } catch (e) {
  }
  return result;
}

// src/scanners/index.ts
import fs5 from "fs";
import path3 from "path";

// src/scanners/js-ts.ts
import fs3 from "fs";
function scanJsTsFile(filePath) {
  const usages = [];
  const warnings = [];
  try {
    const content = fs3.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const staticPropRegex = /(?:process\.env|import\.meta\.env)\.([A-Za-z_][A-Za-z0-9_]*)/g;
      let match;
      while ((match = staticPropRegex.exec(line)) !== null) {
        usages.push({
          name: match[1],
          file: filePath,
          line: lineNum,
          type: "static"
        });
      }
      const bracketRegex = /(?:process\.env|import\.meta\.env)\s*\[\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1\s*\]/g;
      while ((match = bracketRegex.exec(line)) !== null) {
        usages.push({
          name: match[2],
          file: filePath,
          line: lineNum,
          type: "static"
        });
      }
      const destructuringRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*(?:process\.env|import\.meta\.env)/g;
      while ((match = destructuringRegex.exec(line)) !== null) {
        const varsStr = match[1];
        const varNames = varsStr.split(",").map((v) => v.trim().split(":")[0].trim());
        for (const v of varNames) {
          if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
            usages.push({
              name: v,
              file: filePath,
              line: lineNum,
              type: "static"
            });
          }
        }
      }
      const dynamicRegex = /(?:process\.env|import\.meta\.env)\s*\[\s*(?![(['"])([A-Za-z_][A-Za-z0-9_.-]*)\s*\]/g;
      while ((match = dynamicRegex.exec(line)) !== null) {
        warnings.push(`Dynamic environment variable access detected in ${filePath}:${lineNum} -> ${match[0]}`);
      }
    });
  } catch (e) {
  }
  return { usages, warnings };
}

// src/scanners/python.ts
import fs4 from "fs";
function scanPythonFile(filePath) {
  const usages = [];
  const warnings = [];
  try {
    const content = fs4.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const environRegex = /os\.environ(?:\.get)?\s*[\(\[]\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g;
      let match;
      while ((match = environRegex.exec(line)) !== null) {
        usages.push({
          name: match[2],
          file: filePath,
          line: lineNum,
          type: "static"
        });
      }
      const getenvRegex = /os\.getenv\s*\(\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1/g;
      while ((match = getenvRegex.exec(line)) !== null) {
        usages.push({
          name: match[2],
          file: filePath,
          line: lineNum,
          type: "static"
        });
      }
    });
  } catch (e) {
  }
  return { usages, warnings };
}

// src/scanners/index.ts
function walkDir(dir, baseDir, isIgnored, fileList = []) {
  if (!fs5.existsSync(dir)) return fileList;
  const entries = fs5.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path3.join(dir, entry.name);
    const relativePath = path3.relative(baseDir, fullPath);
    if (isIgnored(relativePath)) {
      continue;
    }
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, isIgnored, fileList);
    } else if (entry.isFile()) {
      const ext = path3.extname(entry.name).toLowerCase();
      if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py"].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}
function scanCodebase(cwd = process.cwd()) {
  const isIgnored = loadIgnoreRules(cwd);
  const files = walkDir(cwd, cwd, isIgnored);
  const usageMap = /* @__PURE__ */ new Map();
  const allWarnings = [];
  for (const file of files) {
    const ext = path3.extname(file).toLowerCase();
    let result;
    if ([".py"].includes(ext)) {
      result = scanPythonFile(file);
    } else {
      result = scanJsTsFile(file);
    }
    for (const usage of result.usages) {
      if (!usageMap.has(usage.name)) {
        usageMap.set(usage.name, []);
      }
      usageMap.get(usage.name).push({ file: path3.relative(cwd, usage.file), line: usage.line });
    }
    allWarnings.push(...result.warnings);
  }
  return {
    usages: usageMap,
    warnings: allWarnings
  };
}

// src/engine/analyzer.ts
function analyzeEnvironment(codeUsages, envExampleVars, envVars, config, codeWarnings) {
  const ignoredSet = new Set(config.ignore.map((v) => v.toUpperCase()));
  const missingInExample = [];
  const unusedInCode = [];
  const missingInEnv = [];
  const missingInExampleFromEnv = [];
  for (const [varName, locations] of codeUsages.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;
    if (!envExampleVars.has(varName)) {
      missingInExample.push({ name: varName, locations });
    }
  }
  for (const [varName, line] of envExampleVars.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;
    if (!codeUsages.has(varName)) {
      unusedInCode.push({ name: varName, line });
    }
  }
  for (const [varName, exampleLine] of envExampleVars.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;
    if (!envVars.has(varName)) {
      missingInEnv.push({ name: varName, exampleLine });
    }
  }
  for (const [varName, envLine] of envVars.entries()) {
    if (ignoredSet.has(varName.toUpperCase())) continue;
    if (!envExampleVars.has(varName)) {
      missingInExampleFromEnv.push({ name: varName, envLine });
    }
  }
  const hasErrors = missingInExample.length > 0 || missingInEnv.length > 0;
  const isValid = config.strict ? hasErrors && codeWarnings.length === 0 : !hasErrors;
  return {
    isValid: !hasErrors,
    missingInExample,
    unusedInCode,
    missingInEnv,
    missingInExampleFromEnv,
    warnings: codeWarnings
  };
}

// src/engine/fixer.ts
import fs6 from "fs";
import path4 from "path";
function fixEnvExample(envExamplePath, missingVariables) {
  if (missingVariables.length === 0) return [];
  const absolutePath = path4.resolve(envExamplePath);
  let existingContent = "";
  if (fs6.existsSync(absolutePath)) {
    existingContent = fs6.readFileSync(absolutePath, "utf-8");
  }
  if (existingContent && !existingContent.endsWith("\n")) {
    existingContent += "\n";
  }
  const addedVars = [];
  let newContent = existingContent;
  if (!existingContent && missingVariables.length > 0) {
    newContent += `# Added automatically by envdiff --fix
`;
  }
  for (const item of missingVariables) {
    const varName = item.name;
    const regex = new RegExp(`^\\s*(?:export\\s+)?${varName}\\s*=`, "m");
    if (!regex.test(newContent)) {
      newContent += `${varName}=
`;
      addedVars.push(varName);
    }
  }
  fs6.writeFileSync(absolutePath, newContent, "utf-8");
  return addedVars;
}

// src/reporters/console.ts
import pc from "picocolors";
function reportConsole(report) {
  console.log(pc.bold(pc.cyan("\n\u{1F50D} envdiff - Environment Consistency Report\n")));
  let hasIssues = false;
  if (report.missingInExample.length > 0) {
    hasIssues = true;
    console.log(pc.red(pc.bold(`\u274C Missing in .env.example (${report.missingInExample.length}):`)));
    console.log(pc.dim("   These variables are used in your code but are missing from .env.example:\n"));
    for (const item of report.missingInExample) {
      console.log(`   \u2022 ${pc.yellow(pc.bold(item.name))}`);
      for (const loc of item.locations) {
        console.log(pc.dim(`     \u21B3 referenced in ${loc.file}:${loc.line}`));
      }
    }
    console.log("");
  }
  if (report.missingInEnv.length > 0) {
    hasIssues = true;
    console.log(pc.red(pc.bold(`\u274C Missing in local .env (${report.missingInEnv.length}):`)));
    console.log(pc.dim("   These variables are in .env.example but missing from your local .env:\n"));
    for (const item of report.missingInEnv) {
      console.log(`   \u2022 ${pc.yellow(pc.bold(item.name))} ${pc.dim(`(line ${item.exampleLine} in .env.example)`)}`);
    }
    console.log("");
  }
  if (report.missingInExampleFromEnv.length > 0) {
    console.log(pc.yellow(pc.bold(`\u26A0\uFE0F  Extra in local .env (${report.missingInExampleFromEnv.length}):`)));
    console.log(pc.dim("   These variables are in .env but missing from .env.example:\n"));
    for (const item of report.missingInExampleFromEnv) {
      console.log(`   \u2022 ${pc.yellow(pc.bold(item.name))} ${pc.dim(`(line ${item.envLine} in .env)`)}`);
    }
    console.log("");
  }
  if (report.unusedInCode.length > 0) {
    console.log(pc.yellow(pc.bold(`\u26A0\uFE0F  Unused variables in code (${report.unusedInCode.length}):`)));
    console.log(pc.dim("   These variables are declared in .env.example but never read in the code:\n"));
    for (const item of report.unusedInCode) {
      console.log(`   \u2022 ${pc.yellow(pc.bold(item.name))} ${pc.dim(`(line ${item.line} in .env.example)`)}`);
    }
    console.log("");
  }
  if (report.warnings.length > 0) {
    console.log(pc.yellow(pc.bold(`\u26A0\uFE0F  Warnings (${report.warnings.length}):`)));
    for (const warning of report.warnings) {
      console.log(`   \u2022 ${warning}`);
    }
    console.log("");
  }
  if (!hasIssues && report.missingInExampleFromEnv.length === 0 && report.unusedInCode.length === 0 && report.warnings.length === 0) {
    console.log(pc.green(pc.bold("\u2728 All environment variables are consistent and synchronized!\n")));
  } else if (!hasIssues) {
    console.log(pc.green(pc.bold("\u2705 No critical errors found. Some warnings or extra variables detected.\n")));
  } else {
    console.log(pc.red(pc.bold("\u{1F4A5} Consistency check failed. Please fix the missing environment variables.\n")));
  }
}

// src/reporters/json.ts
function reportJson(report) {
  return JSON.stringify(report, null, 2);
}
export {
  analyzeEnvironment,
  fixEnvExample,
  loadConfig,
  loadEnvFile,
  loadIgnoreRules,
  reportConsole,
  reportJson,
  scanCodebase
};
//# sourceMappingURL=index.mjs.map