import fs from "fs";
import { parse } from "@babel/parser";
import { getAllFiles, extractEnvVarsFromAST } from "./utils.js";
import ignore from "ignore";
import path from "path";

export function checkEnvVars(projectPath) {
  // Load .gitignore patterns if present
  const ig = ignore();
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    ig.add(gitignoreContent);
  }

  const files = getAllFiles(projectPath, projectPath, ig);
  const missingVars = new Set();
  const allVars = new Set();

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const ast = parse(content, { sourceType: "module" });
    const envVars = extractEnvVarsFromAST(ast);
    envVars.forEach((envVar) => {
      allVars.add(envVar);
      if (!process.env[envVar]) {
        missingVars.add(envVar);
      }
    });
  });

  const result = {
    found: Array.from(allVars),
    missing: Array.from(missingVars),
    isComplete: missingVars.size === 0,
  };

  if (result.missing.length > 0) {
    console.error("Missing Environment Variables:", result.missing);
  } else {
    console.log("All environment variables are properly set.");
  }

  return result;
}
