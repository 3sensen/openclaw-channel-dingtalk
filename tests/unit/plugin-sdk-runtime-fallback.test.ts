import { beforeEach, describe, expect, it, vi } from "vitest";

type MockModuleMap = Record<string, Record<string, unknown>>;

const shared = vi.hoisted(() => {
    let modules: MockModuleMap = {};

    const requireMock = vi.fn((id: string) => {
        const mod = modules[id];
        if (!mod) {
            throw new Error(`Cannot find module '${id}'`);
        }
        return mod;
    });

    return {
        setModules(next: MockModuleMap) {
            modules = next;
            requireMock.mockClear();
        },
        requireMock,
    };
});

vi.mock("node:module", () => ({
    createRequire: vi.fn(() => shared.requireMock),
}));

describe("plugin-sdk runtime fallback", () => {
    beforeEach(() => {
        vi.resetModules();
        shared.setModules({});
    });

    it("prefers the scoped runtime module when available", async () => {
        shared.setModules({
            "openclaw/plugin-sdk/core": {
                defineChannelPluginEntry: vi.fn(() => "scoped"),
                buildChannelConfigSchema: vi.fn(() => "schema"),
            },
            "openclaw/plugin-sdk/runtime-store": {
                createPluginRuntimeStore: vi.fn(() => "store"),
            },
            "openclaw/plugin-sdk": {
                defineChannelPluginEntry: vi.fn(() => "root"),
                buildChannelConfigSchema: vi.fn(() => "root-schema"),
                createPluginRuntimeStore: vi.fn(() => "root-store"),
            },
        });

        const mod = await import("../../src/plugin-sdk-runtime-core");

        expect(mod.defineChannelPluginEntry()).toBe("scoped");
        expect(shared.requireMock).toHaveBeenCalledWith("openclaw/plugin-sdk/core");
    });

    it("falls back to the base plugin-sdk barrel when the scoped module cannot be resolved", async () => {
        shared.setModules({
            "openclaw/plugin-sdk": {
                defineChannelPluginEntry: vi.fn(() => "root"),
                buildChannelConfigSchema: vi.fn(() => "root-schema"),
                createPluginRuntimeStore: vi.fn(() => "root-store"),
            },
        });

        const mod = await import("../../src/plugin-sdk-runtime-core");

        expect(mod.defineChannelPluginEntry()).toBe("root");
        expect(shared.requireMock).toHaveBeenCalledWith("openclaw/plugin-sdk/core");
        expect(shared.requireMock).toHaveBeenCalledWith("openclaw/plugin-sdk");
    });

    it("throws a descriptive error when neither scoped nor base export is available", async () => {
        shared.setModules({
            "openclaw/plugin-sdk": {},
        });

        await expect(import("../../src/plugin-sdk-runtime-helpers")).rejects.toThrow(
            /readStringParam/,
        );
    });
});
