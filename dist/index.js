"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  analyzeEnvironment: () => analyzeEnvironment,
  fixEnvExample: () => fixEnvExample,
  loadConfig: () => loadConfig,
  loadEnvFile: () => loadEnvFile,
  loadIgnoreRules: () => loadIgnoreRules,
  reportConsole: () => reportConsole,
  reportJson: () => reportJson,
  scanCodebase: () => scanCodebase
});
module.exports = __toCommonJS(index_exports);

// src/config.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var import_ignore = __toESM(require("ignore"));
var defaultConfig = {
  envPath: ".env",
  envExamplePath: ".env.example",
  ignore: ["NODE_ENV", "PORT", "PATH", "PWD", "HOME", "USER", "TZ"],
  excludeDirs: ["node_modules", ".git", "dist", "build", "coverage"],
  strict: false
};
function loadConfig(cwd = process.cwd(), customConfigPath) {
  let userConfig = {};
  const configPath = customConfigPath || import_node_path.default.join(cwd, ".envdiffrc");
  if (import_node_fs.default.existsSync(configPath)) {
    try {
      const content = import_node_fs.default.readFileSync(configPath, "utf-8");
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
  const ig = (0, import_ignore.default)();
  ig.add(["node_modules", ".git", "dist", "build", "coverage", ".next", ".expo"]);
  const gitignorePath = import_node_path.default.join(cwd, ".gitignore");
  if (import_node_fs.default.existsSync(gitignorePath)) {
    try {
      const content = import_node_fs.default.readFileSync(gitignorePath, "utf-8");
      ig.add(content);
    } catch (e) {
    }
  }
  const envdiffignorePath = import_node_path.default.join(cwd, ".envdiffignore");
  if (import_node_fs.default.existsSync(envdiffignorePath)) {
    try {
      const content = import_node_fs.default.readFileSync(envdiffignorePath, "utf-8");
      ig.add(content);
    } catch (e) {
    }
  }
  return (relativePath) => ig.ignores(relativePath);
}

// src/env/loader.ts
var import_node_fs2 = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));
function loadEnvFile(filePath) {
  const absolutePath = import_node_path2.default.resolve(filePath);
  const result = {
    path: filePath,
    exists: false,
    variables: /* @__PURE__ */ new Map()
  };
  if (!import_node_fs2.default.existsSync(absolutePath)) {
    return result;
  }
  result.exists = true;
  try {
    const content = import_node_fs2.default.readFileSync(absolutePath, "utf-8");
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
var import_node_fs5 = __toESM(require("fs"));
var import_node_path3 = __toESM(require("path"));

// src/scanners/js-ts.ts
var import_node_fs3 = __toESM(require("fs"));
function scanJsTsFile(filePath) {
  const usages = [];
  const warnings = [];
  try {
    const content = import_node_fs3.default.readFileSync(filePath, "utf-8");
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
var import_node_fs4 = __toESM(require("fs"));
function scanPythonFile(filePath) {
  const usages = [];
  const warnings = [];
  try {
    const content = import_node_fs4.default.readFileSync(filePath, "utf-8");
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
  if (!import_node_fs5.default.existsSync(dir)) return fileList;
  const entries = import_node_fs5.default.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = import_node_path3.default.join(dir, entry.name);
    const relativePath = import_node_path3.default.relative(baseDir, fullPath);
    if (isIgnored(relativePath)) {
      continue;
    }
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, isIgnored, fileList);
    } else if (entry.isFile()) {
      const ext = import_node_path3.default.extname(entry.name).toLowerCase();
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
    const ext = import_node_path3.default.extname(file).toLowerCase();
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
      usageMap.get(usage.name).push({ file: import_node_path3.default.relative(cwd, usage.file), line: usage.line });
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
var import_node_fs6 = __toESM(require("fs"));
var import_node_path4 = __toESM(require("path"));
function fixEnvExample(envExamplePath, missingVariables) {
  if (missingVariables.length === 0) return [];
  const absolutePath = import_node_path4.default.resolve(envExamplePath);
  let existingContent = "";
  if (import_node_fs6.default.existsSync(absolutePath)) {
    existingContent = import_node_fs6.default.readFileSync(absolutePath, "utf-8");
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
  import_node_fs6.default.writeFileSync(absolutePath, newContent, "utf-8");
  return addedVars;
}

// src/reporters/console.ts
var import_picocolors = __toESM(require("picocolors"));
function reportConsole(report) {
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan("\n\u{1F50D} envdiff - Environment Consistency Report\n")));
  let hasIssues = false;
  if (report.missingInExample.length > 0) {
    hasIssues = true;
    console.log(import_picocolors.default.red(import_picocolors.default.bold(`\u274C Missing in .env.example (${report.missingInExample.length}):`)));
    console.log(import_picocolors.default.dim("   These variables are used in your code but are missing from .env.example:\n"));
    for (const item of report.missingInExample) {
      console.log(`   \u2022 ${import_picocolors.default.yellow(import_picocolors.default.bold(item.name))}`);
      for (const loc of item.locations) {
        console.log(import_picocolors.default.dim(`     \u21B3 referenced in ${loc.file}:${loc.line}`));
      }
    }
    console.log("");
  }
  if (report.missingInEnv.length > 0) {
    hasIssues = true;
    console.log(import_picocolors.default.red(import_picocolors.default.bold(`\u274C Missing in local .env (${report.missingInEnv.length}):`)));
    console.log(import_picocolors.default.dim("   These variables are in .env.example but missing from your local .env:\n"));
    for (const item of report.missingInEnv) {
      console.log(`   \u2022 ${import_picocolors.default.yellow(import_picocolors.default.bold(item.name))} ${import_picocolors.default.dim(`(line ${item.exampleLine} in .env.example)`)}`);
    }
    console.log("");
  }
  if (report.missingInExampleFromEnv.length > 0) {
    console.log(import_picocolors.default.yellow(import_picocolors.default.bold(`\u26A0\uFE0F  Extra in local .env (${report.missingInExampleFromEnv.length}):`)));
    console.log(import_picocolors.default.dim("   These variables are in .env but missing from .env.example:\n"));
    for (const item of report.missingInExampleFromEnv) {
      console.log(`   \u2022 ${import_picocolors.default.yellow(import_picocolors.default.bold(item.name))} ${import_picocolors.default.dim(`(line ${item.envLine} in .env)`)}`);
    }
    console.log("");
  }
  if (report.unusedInCode.length > 0) {
    console.log(import_picocolors.default.yellow(import_picocolors.default.bold(`\u26A0\uFE0F  Unused variables in code (${report.unusedInCode.length}):`)));
    console.log(import_picocolors.default.dim("   These variables are declared in .env.example but never read in the code:\n"));
    for (const item of report.unusedInCode) {
      console.log(`   \u2022 ${import_picocolors.default.yellow(import_picocolors.default.bold(item.name))} ${import_picocolors.default.dim(`(line ${item.line} in .env.example)`)}`);
    }
    console.log("");
  }
  if (report.warnings.length > 0) {
    console.log(import_picocolors.default.yellow(import_picocolors.default.bold(`\u26A0\uFE0F  Warnings (${report.warnings.length}):`)));
    for (const warning of report.warnings) {
      console.log(`   \u2022 ${warning}`);
    }
    console.log("");
  }
  if (!hasIssues && report.missingInExampleFromEnv.length === 0 && report.unusedInCode.length === 0 && report.warnings.length === 0) {
    console.log(import_picocolors.default.green(import_picocolors.default.bold("\u2728 All environment variables are consistent and synchronized!\n")));
  } else if (!hasIssues) {
    console.log(import_picocolors.default.green(import_picocolors.default.bold("\u2705 No critical errors found. Some warnings or extra variables detected.\n")));
  } else {
    console.log(import_picocolors.default.red(import_picocolors.default.bold("\u{1F4A5} Consistency check failed. Please fix the missing environment variables.\n")));
  }
}

// src/reporters/json.ts
function reportJson(report) {
  return JSON.stringify(report, null, 2);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyzeEnvironment,
  fixEnvExample,
  loadConfig,
  loadEnvFile,
  loadIgnoreRules,
  reportConsole,
  reportJson,
  scanCodebase
});
//# sourceMappingURL=index.js.map