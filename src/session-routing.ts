import type { DingTalkConfig, DingTalkGroupSessionScope } from "./types";

export interface ResolveDingTalkSessionPeerParams {
  isDirect: boolean;
  senderId: string;
  conversationId: string;
  peerIdOverride?: string;
  config: Pick<DingTalkConfig, "groupSessionScope">;
}

export interface ResolvedDingTalkSessionPeer {
  kind: "direct" | "group";
  peerId: string;
  groupSessionScope?: DingTalkGroupSessionScope;
}

// Keep DingTalk aligned with Feishu's explicit peerId -> sessionKey model:
// resolve a stable peer identity first, then let OpenClaw build the final session key.
export function resolveDingTalkSessionPeer(
  params: ResolveDingTalkSessionPeerParams,
): ResolvedDingTalkSessionPeer {
  if (params.isDirect) {
    return {
      kind: "direct",
      peerId: params.senderId,
    };
  }

  const groupSessionScope: DingTalkGroupSessionScope = params.config.groupSessionScope ?? "group";
  const normalizedPeerIdOverride = params.peerIdOverride?.trim();

  switch (groupSessionScope) {
    case "group":
    default:
      return {
        kind: "group",
        peerId: normalizedPeerIdOverride || params.conversationId,
        groupSessionScope,
      };
  }
}
