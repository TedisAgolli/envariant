import fs from "fs";
import path from "path";
import { createRequire } from "module";

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
    } else if (fullPath.endsWith(".js")) {
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
