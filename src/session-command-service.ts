export interface ParsedSessionCommand {
  scope: "session-alias-show" | "session-alias-set" | "session-alias-clear" | "unknown";
  peerId?: string;
}

const SESSION_ALIAS_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function parseSessionCommand(text: string | undefined): ParsedSessionCommand {
  const raw = String(text || "").trim();
  if (!raw) {
    return { scope: "unknown" };
  }
  const sessionAliasMatch = raw.match(/^\/session-alias\s+(show|clear|set)(?:\s+(.+))?$/i);
  if (!sessionAliasMatch) {
    return { scope: "unknown" };
  }
  const action = sessionAliasMatch[1]?.toLowerCase();
  const rawPeerId = sessionAliasMatch[2]?.trim();
  if (action === "show") {
    return { scope: "session-alias-show" };
  }
  if (action === "clear") {
    return { scope: "session-alias-clear" };
  }
  if (action === "set") {
    return rawPeerId ? { scope: "session-alias-set", peerId: rawPeerId } : { scope: "unknown" };
  }
  return { scope: "unknown" };
}

export function validateSessionAlias(peerId: string | undefined): string | null {
  const value = String(peerId || "").trim();
  if (!value) {
    return "共享会话别名不能为空。";
  }
  if (!SESSION_ALIAS_PATTERN.test(value)) {
    return "共享会话别名仅允许 [a-zA-Z0-9_-]{1,64}。";
  }
  return null;
}

export function formatSessionAliasReply(params: {
  conversationId: string;
  peerId: string;
  aliasSource: "default" | "override";
}): string {
  return [
    "当前群会话别名：",
    "",
    `- conversationId: \`${params.conversationId}\``,
    `- peerId: \`${params.peerId}\``,
    `- mode: \`${params.aliasSource}\``,
  ].join("\n");
}

export function formatSessionAliasSetReply(params: {
  conversationId: string;
  peerId: string;
}): string {
  return [
    "已更新当前群共享会话别名。",
    "",
    `- conversationId: \`${params.conversationId}\``,
    `- peerId: \`${params.peerId}\``,
    "",
    "将其他群也设置为同一个 peerId 后，这些群会共用同一条会话。",
  ].join("\n");
}

export function formatSessionAliasValidationErrorReply(error: string): string {
  return [
    "共享会话别名不合法。",
    "",
    `- 原因：${error}`,
    "- 允许规则：`[a-zA-Z0-9_-]{1,64}`",
    "- 示例：`shared-dev`、`ops_shared`",
  ].join("\n");
}

export function formatSessionAliasClearedReply(params: {
  conversationId: string;
}): string {
  return [
    "已清除当前群共享会话别名。",
    "",
    `- conversationId: \`${params.conversationId}\``,
    "- peerId: 恢复为当前 conversationId",
  ].join("\n");
}
