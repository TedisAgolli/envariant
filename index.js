#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { checkEnvVars } from "./src/envChecker.js";

// Load environment variables from .env
dotenv.config();

const projectPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

console.log("Scanning directory:", projectPath);
const result = checkEnvVars(projectPath);

if (result.missing.length > 0) {
  process.exit(1);
}
