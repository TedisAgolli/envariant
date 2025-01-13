import { expect, describe, it, beforeEach } from "vitest";
import { parse } from "@babel/parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { extractEnvVarsFromAST } from "src/utils";
import { checkEnvVars } from "./src/envChecker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Environment Variables Checker", () => {
  beforeEach(() => {
    // Reset process.env for each test
    process.env = {};
  });

  describe("extractEnvVarsFromAST", () => {
    it("should extract environment variables from code", () => {
      const code = `
        const apiKey = process.env.API_KEY;
        const url = process.env.BASE_URL;
      `;
      const ast = parse(code, { sourceType: "module" });
      const envVars = extractEnvVarsFromAST(ast);

      expect(envVars).toContain("API_KEY");
      expect(envVars).toContain("BASE_URL");
      expect(envVars).toHaveLength(2);
    });

    it("should not extract non-environment variables", () => {
      const code = `
        const regular = 'variable';
        const obj = { env: 'test' };
      `;
      const ast = parse(code, { sourceType: "module" });
      const envVars = extractEnvVarsFromAST(ast);

      expect(envVars).toHaveLength(0);
    });
  });

  describe("checkEnvVars", () => {
    const testProjectPath = path.resolve(__dirname, "test");
    const testOptions = { exitOnMissing: false };

    it("should detect environment variables loaded from .env file", () => {
      // Load the test .env file
      dotenv.config({ path: ".env.test" });

      const result = checkEnvVars(testProjectPath);

      expect(result.found).toEqual([
        "DOTENV_VAR",
        "ANOTHER_VAR",
        "NOT_IN_DOTENV",
      ]);
      expect(result.missing).toEqual(["NOT_IN_DOTENV"]);
      expect(result.isComplete).toBe(false);

      // Verify the actual values from .env.test
      expect(process.env.DOTENV_VAR).toBe("loaded-from-dotenv");
      expect(process.env.ANOTHER_VAR).toBe("also-from-dotenv");
    });

    it("should identify missing environment variables", () => {
      const result = checkEnvVars(testProjectPath);

      expect(result.missing).toEqual([
        "DOTENV_VAR",
        "ANOTHER_VAR",
        "NOT_IN_DOTENV",
      ]);
      expect(result.found).toEqual([
        "DOTENV_VAR",
        "ANOTHER_VAR",
        "NOT_IN_DOTENV",
      ]);
      expect(result.isComplete).toBe(false);
    });

    it("should report when all environment variables are set", () => {
      // Set environment variables
      process.env.DOTENV_VAR = "test-value";
      process.env.ANOTHER_VAR = "test-value";
      process.env.NOT_IN_DOTENV = "test-value";

      const result = checkEnvVars(testProjectPath);

      expect(result.missing).toEqual([]);
      expect(result.found).toEqual([
        "DOTENV_VAR",
        "ANOTHER_VAR",
        "NOT_IN_DOTENV",
      ]);
      expect(result.isComplete).toBe(true);
    });
  });
});
