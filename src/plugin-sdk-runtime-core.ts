import { loadPluginSdkRuntimeValue } from "./plugin-sdk-runtime-fallback";

export const defineChannelPluginEntry: typeof import("openclaw/plugin-sdk/core").defineChannelPluginEntry = loadPluginSdkRuntimeValue({
    exportName: "defineChannelPluginEntry",
    scopedModuleId: "openclaw/plugin-sdk/core",
});

export const buildChannelConfigSchema: typeof import("openclaw/plugin-sdk/core").buildChannelConfigSchema = loadPluginSdkRuntimeValue({
    exportName: "buildChannelConfigSchema",
    scopedModuleId: "openclaw/plugin-sdk/core",
});

export const createPluginRuntimeStore: typeof import("openclaw/plugin-sdk/runtime-store").createPluginRuntimeStore = loadPluginSdkRuntimeValue({
    exportName: "createPluginRuntimeStore",
    scopedModuleId: "openclaw/plugin-sdk/runtime-store",
});
