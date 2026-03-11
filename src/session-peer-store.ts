import { readNamespaceJson, writeNamespaceJsonAtomic } from "./persistence-store";

const SESSION_PEER_OVERRIDE_NAMESPACE = "session-peer-overrides";

interface SessionPeerOverrideBucket {
  peers: Record<string, string>;
}

function readBucket(storePath: string, accountId: string): SessionPeerOverrideBucket {
  return readNamespaceJson<SessionPeerOverrideBucket>(SESSION_PEER_OVERRIDE_NAMESPACE, {
    storePath,
    scope: { accountId },
    fallback: { peers: {} },
  });
}

function writeBucket(storePath: string, accountId: string, bucket: SessionPeerOverrideBucket): void {
  writeNamespaceJsonAtomic(SESSION_PEER_OVERRIDE_NAMESPACE, {
    storePath,
    scope: { accountId },
    data: bucket,
  });
}

export function getSessionPeerOverride(params: {
  storePath: string;
  accountId: string;
  conversationId: string;
}): string | undefined {
  const bucket = readBucket(params.storePath, params.accountId);
  const value = bucket.peers[params.conversationId];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function setSessionPeerOverride(params: {
  storePath: string;
  accountId: string;
  conversationId: string;
  peerId: string;
}): void {
  const bucket = readBucket(params.storePath, params.accountId);
  bucket.peers[params.conversationId] = params.peerId.trim();
  writeBucket(params.storePath, params.accountId, bucket);
}

export function clearSessionPeerOverride(params: {
  storePath: string;
  accountId: string;
  conversationId: string;
}): boolean {
  const bucket = readBucket(params.storePath, params.accountId);
  if (!Object.prototype.hasOwnProperty.call(bucket.peers, params.conversationId)) {
    return false;
  }
  delete bucket.peers[params.conversationId];
  writeBucket(params.storePath, params.accountId, bucket);
  return true;
}
