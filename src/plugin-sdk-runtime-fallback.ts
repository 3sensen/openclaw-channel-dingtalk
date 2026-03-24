import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function tryLoadModule(id: string): Record<string, unknown> | null {
    try {
        return require(id) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function loadPluginSdkRuntimeValue<T>(params: {
    exportName: string;
    scopedModuleId: string;
}): T {
    const scopedModule = tryLoadModule(params.scopedModuleId);
    const scopedValue = scopedModule?.[params.exportName];
    if (scopedValue !== undefined) {
        return scopedValue as T;
    }

    const baseModule = tryLoadModule("openclaw/plugin-sdk");
    const baseValue = baseModule?.[params.exportName];
    if (baseValue !== undefined) {
        return baseValue as T;
    }

    throw new Error(
        `[DingTalk][plugin-sdk-runtime] Failed to resolve ${params.exportName} from ${params.scopedModuleId} or openclaw/plugin-sdk`,
    );
}
