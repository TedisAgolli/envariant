import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { parse } from "@babel/parser";

const require = createRequire(import.meta.url);
const traverse = require("@babel/traverse").default;

// Helper to recursively get all JS files in a directory
export function getAllFiles(dirPath, rootDir, ig, files = []) {
  const entries = fs.readdirSync(dirPath);
  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry);
    // Skip ignored directories and files
    if (ig.ignores(path.relative(rootDir, fullPath))) {
      return;
    }
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, rootDir, ig, files);
    } else if (
      fullPath.endsWith(".js") ||
      fullPath.endsWith(".ts") ||
      fullPath.endsWith(".jsx") ||
      fullPath.endsWith(".tsx")
    ) {
      files.push(fullPath);
    }
  });
  return files;
}

// Extract environment variables from AST
export function extractEnvVarsFromAST(ast) {
  const envVars = new Set();
  traverse(ast, {
    MemberExpression(path) {
      if (
        path.node.object.type === "MemberExpression" &&
        path.node.object.object.name === "process" &&
        path.node.object.property.name === "env"
      ) {
        envVars.add(path.node.property.name);
      }
    },
  });
  return Array.from(envVars);
}

/**
 * Checks environment variables in a single file and returns found/missing variables
 * @param {Object} file - File object containing content and path
 * @param {string} file.content - The content of the file
 * @param {string} file.path - Path to the file (used to determine file type)
 * @param {Object} options - Options for checking
 * @returns {{ found: string[], missing: string[] }} Object containing found and missing env vars
 */
export const checkFileEnvVars = (file, options = {}) => {
  const plugins = [];
  if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) {
    plugins.push("typescript");
  }
  if (file.path.endsWith(".jsx") || file.path.endsWith(".tsx")) {
    plugins.push("jsx");
  }
  const ast = parse(file.content, {
    sourceType: "module",
    plugins,
  });

  const envVars = extractEnvVarsFromAST(ast);
  const missing = envVars.filter((varName) => !process.env[varName]);

  return {
    found: envVars,
    missing,
  };
};
