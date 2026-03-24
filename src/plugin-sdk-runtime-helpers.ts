import { loadPluginSdkRuntimeValue } from "./plugin-sdk-runtime-fallback";

export const readStringParam: typeof import("openclaw/plugin-sdk/param-readers").readStringParam = loadPluginSdkRuntimeValue({
    exportName: "readStringParam",
    scopedModuleId: "openclaw/plugin-sdk/param-readers",
});

export const jsonResult: typeof import("openclaw/plugin-sdk/telegram-core").jsonResult = loadPluginSdkRuntimeValue({
    exportName: "jsonResult",
    scopedModuleId: "openclaw/plugin-sdk/telegram-core",
});

export const extractToolSend: typeof import("openclaw/plugin-sdk/tool-send").extractToolSend = loadPluginSdkRuntimeValue({
    exportName: "extractToolSend",
    scopedModuleId: "openclaw/plugin-sdk/tool-send",
});

export const DEFAULT_ACCOUNT_ID: typeof import("openclaw/plugin-sdk/setup").DEFAULT_ACCOUNT_ID = loadPluginSdkRuntimeValue({
    exportName: "DEFAULT_ACCOUNT_ID",
    scopedModuleId: "openclaw/plugin-sdk/setup",
});

export const formatDocsLink: typeof import("openclaw/plugin-sdk/setup").formatDocsLink = loadPluginSdkRuntimeValue({
    exportName: "formatDocsLink",
    scopedModuleId: "openclaw/plugin-sdk/setup",
});

export const normalizeAccountId: typeof import("openclaw/plugin-sdk/setup").normalizeAccountId = loadPluginSdkRuntimeValue({
    exportName: "normalizeAccountId",
    scopedModuleId: "openclaw/plugin-sdk/setup",
});
