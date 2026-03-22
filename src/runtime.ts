import { createPluginRuntimeStore, type PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const runtimeStore = createPluginRuntimeStore<PluginRuntime>("DingTalk runtime not initialized");

export function setDingTalkRuntime(next: PluginRuntime): void {
  runtimeStore.setRuntime(next);
}

export function getDingTalkRuntime(): PluginRuntime {
  return runtimeStore.getRuntime();
}
