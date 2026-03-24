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

const scopedSdkTestFiles = [
    "tests/integration/status-probe.test.ts",
    "tests/unit/agent-name-matcher.test.ts",
];

const runtimeFallbackFiles = [
    "src/plugin-sdk-runtime-core.ts",
    "src/plugin-sdk-runtime-helpers.ts",
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

    it("keeps tests on scoped plugin-sdk subpaths instead of the root barrel", () => {
        for (const relativePath of scopedSdkTestFiles) {
            const content = readFileSync(resolve(repoRoot, relativePath), "utf8");
            expect(content).not.toMatch(/from\s+["']openclaw\/plugin-sdk["']/);
        }
    });

    it("pins the local dev dependency to the stable openclaw 2026.3.22 release", () => {
        const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")) as {
            devDependencies?: Record<string, string>;
        };
        expect(packageJson.devDependencies?.openclaw).toBe("2026.3.22");
    });

    it("adds local runtime fallback shims for plugin-sdk value imports", () => {
        for (const relativePath of runtimeFallbackFiles) {
            expect(existsSync(resolve(repoRoot, relativePath))).toBe(true);
        }
    });

    it("routes key runtime value imports through local runtime fallback shims", () => {
        const indexContent = readFileSync(resolve(repoRoot, "index.ts"), "utf8");
        const channelContent = readFileSync(resolve(repoRoot, "src/channel.ts"), "utf8");
        const onboardingContent = readFileSync(resolve(repoRoot, "src/onboarding.ts"), "utf8");
        const runtimeContent = readFileSync(resolve(repoRoot, "src/runtime.ts"), "utf8");

        expect(indexContent).toMatch(/from\s+["']\.\/src\/plugin-sdk-runtime-(?:core|helpers)["']/);
        expect(channelContent).toMatch(/from\s+["']\.\/plugin-sdk-runtime-(?:core|helpers)["']/);
        expect(onboardingContent).toMatch(/from\s+["']\.\/plugin-sdk-runtime-helpers["']/);
        expect(runtimeContent).toMatch(/from\s+["']openclaw\/plugin-sdk\/core["']/);
        expect(runtimeContent).toMatch(/from\s+["']\.\/plugin-sdk-runtime-core["']/);

        expect(indexContent).not.toMatch(/import\s+\{[^}]*\}\s+from\s+["']openclaw\/plugin-sdk\/core["']/);
        expect(indexContent).not.toMatch(/from\s+["']openclaw\/plugin-sdk\/param-readers["']/);
        expect(channelContent).not.toMatch(/import\s+\{[^}]*\}\s+from\s+["']openclaw\/plugin-sdk\/core["']/);
        expect(channelContent).not.toMatch(/from\s+["']openclaw\/plugin-sdk\/telegram-core["']/);
        expect(channelContent).not.toMatch(/from\s+["']openclaw\/plugin-sdk\/param-readers["']/);
        expect(channelContent).not.toMatch(/from\s+["']openclaw\/plugin-sdk\/tool-send["']/);
        expect(onboardingContent).not.toMatch(/import\s+\{[^}]*\}\s+from\s+["']openclaw\/plugin-sdk\/setup["']/);
        expect(runtimeContent).not.toMatch(/from\s+["']openclaw\/plugin-sdk\/runtime-store["']/);
    });
});
