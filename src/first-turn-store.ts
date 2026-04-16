import { readNamespaceJson, writeNamespaceJsonAtomic } from "./persistence-store";

const FIRST_TURN_REASONING_NAMESPACE = "first-turn";

interface FirstTurnReasoningBucket {
  sessions: Record<
    string,
    {
      enabled: boolean;
      updatedAt: number;
    }
  >;
}

function normalizeSessionKey(sessionKey: string): string {
  return (sessionKey || "").trim().toLowerCase();
}

function readBucket(storePath: string, accountId: string, agentId: string): FirstTurnReasoningBucket {
  return readNamespaceJson(FIRST_TURN_REASONING_NAMESPACE, {
    storePath,
    scope: { accountId, agentId },
    fallback: { sessions: {} },
  });
}

function writeBucket(
  storePath: string,
  accountId: string,
  agentId: string,
  bucket: FirstTurnReasoningBucket,
): void {
  writeNamespaceJsonAtomic(FIRST_TURN_REASONING_NAMESPACE, {
    storePath,
    scope: { accountId, agentId },
    data: bucket,
  });
}

export function hasInjectedFirstTurnOn(params: {
  storePath: string;
  accountId: string;
  agentId: string;
  sessionKey: string;
}): boolean {
  const bucket = readBucket(params.storePath, params.accountId, params.agentId);
  const key = normalizeSessionKey(params.sessionKey);
  return bucket.sessions[key]?.enabled === true;
}

export function markInjectedReasoningOn(params: {
  storePath: string;
  accountId: string;
  agentId: string;
  sessionKey: string;
}): void {
  const bucket = readBucket(params.storePath, params.accountId, params.agentId);
  const key = normalizeSessionKey(params.sessionKey);

  bucket.sessions[key] = {
    enabled: true,
    updatedAt: Date.now(),
  };

  writeBucket(params.storePath, params.accountId, params.agentId, bucket);
}