import * as coreSdk from "openclaw/plugin-sdk/core";
import type {
  ChannelPlugin as CoreChannelPlugin,
  OpenClawConfig as CoreOpenClawConfig,
  OpenClawPluginApi as CoreOpenClawPluginApi,
  PluginRuntime as CorePluginRuntime,
} from "openclaw/plugin-sdk/core";
import type {
  ChannelDirectoryEntry,
  ChannelMessageActionAdapter as LegacyChannelMessageActionAdapter,
  ChannelMessageActionName,
  WizardPrompter,
} from "openclaw/plugin-sdk/matrix";
import {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  formatDocsLink,
  jsonResult,
  normalizeAccountId,
  readStringParam,
} from "openclaw/plugin-sdk/matrix";
import { extractToolSend } from "openclaw/plugin-sdk/googlechat";
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk";

type ChannelMessageCapability = "interactive" | "buttons" | "cards" | "components" | "blocks";

type ChannelMessageToolSchemaContribution = {
  properties: Record<string, unknown>;
  visibility?: "current-channel" | "all-configured";
};

type ChannelMessageToolDiscovery = {
  actions?: readonly ChannelMessageActionName[] | null;
  capabilities?: readonly ChannelMessageCapability[] | null;
  schema?:
    | ChannelMessageToolSchemaContribution
    | ChannelMessageToolSchemaContribution[]
    | null
    | undefined;
};

type CompatDescribeMessageTool = (params: {
  cfg: CoreOpenClawConfig;
  accountId?: string | null;
  currentChannelId?: string | null;
  currentChannelProvider?: string | null;
  currentThreadTs?: string | null;
  currentMessageId?: string | number | null;
  requesterSenderId?: string | null;
  sessionKey?: string | null;
  sessionId?: string | null;
  agentId?: string | null;
}) => ChannelMessageToolDiscovery | null | undefined;

export type ChannelMessageActionAdapter = {
  listActions?: (params: {
    cfg: CoreOpenClawConfig;
  }) => ChannelMessageActionName[];
  supportsAction?: LegacyChannelMessageActionAdapter["supportsAction"];
  supportsButtons?: (params: {
    cfg: CoreOpenClawConfig;
  }) => boolean;
  supportsCards?: (params: {
    cfg: CoreOpenClawConfig;
  }) => boolean;
  describeMessageTool: CompatDescribeMessageTool;
  requiresTrustedRequesterSender?: (params: {
    action: ChannelMessageActionName;
    toolContext?: unknown;
  }) => boolean;
  extractToolSend?: LegacyChannelMessageActionAdapter["extractToolSend"];
  handleAction?: LegacyChannelMessageActionAdapter["handleAction"];
};

export type ChannelPlugin<TResolvedAccount = unknown> = Omit<
  CoreChannelPlugin<TResolvedAccount>,
  "actions"
> & {
  actions?: ChannelMessageActionAdapter;
};

export type DingTalkChannelPluginBase<TResolvedAccount = unknown> = ChannelPlugin<TResolvedAccount> & {
  setupWizard?: unknown;
};

type DefineChannelPluginEntryOptions<TPlugin> = {
  id: string;
  name: string;
  description: string;
  plugin: TPlugin;
  configSchema?: ReturnType<typeof coreSdk.emptyPluginConfigSchema>;
  setRuntime?: (runtime: CorePluginRuntime) => void;
  registerFull?: (api: CoreOpenClawPluginApi) => void;
};

type RuntimeDefineChannelPluginEntry = (options: {
  id: string;
  name: string;
  description: string;
  plugin: CoreChannelPlugin;
  configSchema?: ReturnType<typeof coreSdk.emptyPluginConfigSchema>;
  setRuntime?: (runtime: CorePluginRuntime) => void;
  registerFull?: (api: CoreOpenClawPluginApi) => void;
}) => unknown;

export function defineChannelPluginEntry<TPlugin>({
  id,
  name,
  description,
  plugin,
  configSchema = coreSdk.emptyPluginConfigSchema(),
  setRuntime,
  registerFull,
}: DefineChannelPluginEntryOptions<TPlugin>) {
  const defineEntry = (coreSdk as { defineChannelPluginEntry?: RuntimeDefineChannelPluginEntry })
    .defineChannelPluginEntry;
  if (typeof defineEntry === "function") {
    return defineEntry({
      id,
      name,
      description,
      plugin: plugin as unknown as CoreChannelPlugin,
      configSchema,
      setRuntime,
      registerFull,
    });
  }

  return {
    id,
    name,
    description,
    configSchema,
    register(api: CoreOpenClawPluginApi) {
      setRuntime?.(api.runtime);
      api.registerChannel({ plugin: plugin as unknown as CoreChannelPlugin });
      const registrationMode =
        "registrationMode" in api ? (api as { registrationMode?: string }).registrationMode : undefined;
      if (registrationMode && registrationMode !== "full") {
        return;
      }
      registerFull?.(api);
    },
  };
}

export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  extractToolSend,
  formatDocsLink,
  jsonResult,
  normalizeAccountId,
  readStringParam,
};

export type OpenClawConfig = CoreOpenClawConfig;
export type OpenClawPluginApi = CoreOpenClawPluginApi;
export type PluginRuntime = CorePluginRuntime;
export type {
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGatewayContext,
  WizardPrompter,
};

export type ChannelLogSink = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  debug?: (msg: string) => void;
};
