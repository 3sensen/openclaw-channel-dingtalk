import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

const directSdkFiles = [
    "index.ts",
    "src/channel.ts",
    "src/config.ts",
    "src/onboarding.ts",
    "src/runtime.ts",
    "src/types.ts",
    "src/targeting/agent-name-matcher.ts",
    "src/targeting/agent-routing.ts",
    "src/targeting/target-directory-adapter.ts",
];

describe("plugin-sdk import structure", () => {
    it("does not keep the local sdk-compat bridge once minimum openclaw is 2026.3.14+", () => {
        expect(existsSync(resolve(repoRoot, "src/sdk-compat.ts"))).toBe(false);
    });

    it("uses direct plugin-sdk imports instead of the local sdk-compat bridge", () => {
        for (const relativePath of directSdkFiles) {
            const content = readFileSync(resolve(repoRoot, relativePath), "utf8");
            expect(content).not.toMatch(/from\s+["'](?:\.\.\/|\.\/)*sdk-compat["']/);
        }
    });
});
