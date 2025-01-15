import { expect, describe, it, beforeEach } from "vitest";
import dotenv from "dotenv";
import { checkFileEnvVars } from "./src/utils";

// Mock file contents
const mockFiles = {
  basic: {
    path: "test/basic/config.js",
    content: `
      const apiKey = process.env.API_KEY;
      const url = process.env.BASE_URL;
      
      export const getConfig = () => ({
        apiKey,
        url
      });
    `,
  },
  dotenv: {
    path: "test/basic/dotenv.js",
    content: `
      const config = {
        var1: process.env.DOTENV_VAR,
        var2: process.env.ANOTHER_VAR,
        var3: process.env.NOT_IN_DOTENV
      };
      export default config;
    `,
  },
  noEnv: {
    path: "test/no-env/config.js",
    content: `
      const regular = "variable";
      const obj = { env: "test" };
      
      export const getConfig = () => ({
        regular,
        obj
      });
    `,
  },
  typescript: {
    path: "test/ts/config.ts",
    content: `
      interface Config {
        url: string;
        port: number;
      }
      
      const apiKey: string = process.env.TS_API_KEY;
      const config: Config = {
        url: process.env.TS_BASE_URL,
        port: parseInt(process.env.TS_PORT || "3000")
      };
      
      export const getConfig = () => ({
        apiKey,
        ...config
      });
    `,
  },
  jsx: {
    path: "test/react/component.jsx",
    content: `
      import React from 'react';
      
      const Component = () => {
        const apiUrl = process.env.REACT_API_URL;
        const mode = process.env.REACT_APP_MODE;
        
        return (
          <div>
            <p>API URL: {apiUrl}</p>
            <p>Mode: {mode}</p>
          </div>
        );
      };
      
      export default Component;
    `,
  },
  tsx: {
    path: "test/react/typed-component.tsx",
    content: `
      import React from 'react';
      
      interface Props {
        title: string;
      }
      
      const TypedComponent: React.FC<Props> = ({ title }) => {
        const apiKey: string = process.env.REACT_APP_API_KEY;
        const debug: boolean = process.env.REACT_APP_DEBUG === 'true';
        
        return (
          <div>
            <h1>{title}</h1>
            <p>API Key: {apiKey}</p>
            <p>Debug: {debug.toString()}</p>
          </div>
        );
      };
      
      export default TypedComponent;
    `,
  },
};

describe("Environment Variables Checker", () => {
  beforeEach(() => {
    process.env = {};
  });

  it("should check variables in a single file", () => {
    process.env.API_KEY = "test-key";
    const result = checkFileEnvVars(mockFiles.basic);

    expect(result.found).toContain("API_KEY");
    expect(result.found).toContain("BASE_URL");
    expect(result.missing).toContain("BASE_URL");
    expect(result.missing).not.toContain("API_KEY");
  });

  it("should handle TypeScript files", () => {
    process.env.TS_API_KEY = "test-key";
    const result = checkFileEnvVars(mockFiles.typescript);

    expect(result.found).toContain("TS_API_KEY");
    expect(result.found).toContain("TS_BASE_URL");
    expect(result.found).toContain("TS_PORT");
    expect(result.missing).toContain("TS_BASE_URL");
    expect(result.missing).not.toContain("TS_API_KEY");
  });

  it("should not detect non-environment variables", () => {
    const result = checkFileEnvVars(mockFiles.noEnv);

    expect(result.found).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it("should detect environment variables loaded from .env file", () => {
    dotenv.config({ path: ".env.test" });
    const result = checkFileEnvVars(mockFiles.dotenv);

    expect(result.found).toContain("DOTENV_VAR");
    expect(result.found).toContain("ANOTHER_VAR");
    expect(result.found).toContain("NOT_IN_DOTENV");
    expect(result.missing).toContain("NOT_IN_DOTENV");

    expect(process.env.DOTENV_VAR).toBe("loaded-from-dotenv");
    expect(process.env.ANOTHER_VAR).toBe("also-from-dotenv");
  });

  it("should identify missing environment variables", () => {
    const result = checkFileEnvVars(mockFiles.basic);

    expect(result.missing).toContain("API_KEY");
    expect(result.missing).toContain("BASE_URL");
  });

  it("should report when all environment variables are set", () => {
    process.env.API_KEY = "test-value";
    process.env.BASE_URL = "test-value";

    const result = checkFileEnvVars(mockFiles.basic);

    expect(result.missing).toEqual([]);
    expect(result.found).toContain("API_KEY");
    expect(result.found).toContain("BASE_URL");
  });

  it("should handle JSX files", () => {
    process.env.REACT_API_URL = "http://api.example.com";
    const result = checkFileEnvVars(mockFiles.jsx);

    expect(result.found).toContain("REACT_API_URL");
    expect(result.found).toContain("REACT_APP_MODE");
    expect(result.missing).toContain("REACT_APP_MODE");
    expect(result.missing).not.toContain("REACT_API_URL");
  });

  it("should handle TSX files", () => {
    process.env.REACT_APP_API_KEY = "secret-key";
    const result = checkFileEnvVars(mockFiles.tsx);

    expect(result.found).toContain("REACT_APP_API_KEY");
    expect(result.found).toContain("REACT_APP_DEBUG");
    expect(result.missing).toContain("REACT_APP_DEBUG");
    expect(result.missing).not.toContain("REACT_APP_API_KEY");
  });
});
