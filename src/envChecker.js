import { checkFileEnvVars, getAllFiles } from "./utils.js";
import fs from "fs";
import ignore from "ignore";
import path from "path";

export const checkEnvVars = (projectPath, options = {}) => {
  // Load .gitignore patterns if present
  const ig = ignore();
  const gitignorePath = path.join(projectPath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    ig.add(gitignoreContent);
  }
  const files = getAllFiles(projectPath, projectPath, ig);
  const results = files.map((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    return checkFileEnvVars({ path: filePath, content }, options);
  });

  const found = [...new Set(results.flatMap((r) => r.found))];
  const missing = [...new Set(results.flatMap((r) => r.missing))];

  return {
    found,
    missing,
    isComplete: missing.length === 0,
  };
};
