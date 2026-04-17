import { QuotedRef } from "../types";

type PendingCardContext = {
  accountId?: string;
  conversationId: string;
  quotedRef?: QuotedRef;
  createdAt: number;
  fullText: string;

  messageId?: string;
  processQueryKey?: string;
  outTrackId?: string;
  cardInstanceId?: string;
};

const pendingCardContexts = new Map<string, PendingCardContext>();

function buildPendingCardKey(params: {
  conversationId: string;
  messageId?: string;
  processQueryKey?: string;
  outTrackId?: string;
  cardInstanceId?: string;
}): string {
  return (
    params.processQueryKey ||
    params.messageId ||
    params.outTrackId ||
    params.cardInstanceId ||
    `conv:${params.conversationId}`
  );
}

export function upsertPendingCardContext(params: {
  accountId?: string;
  conversationId: string;
  quotedRef?: QuotedRef;
  createdAt?: number;
  fullText: string;
  messageId?: string;
  processQueryKey?: string;
  outTrackId?: string;
  cardInstanceId?: string;
}, cardState: string): string {
  const key = buildPendingCardKey({
    conversationId: params.conversationId,
    messageId: params.messageId,
    processQueryKey: params.processQueryKey,
    outTrackId: params.outTrackId,
    cardInstanceId: params.cardInstanceId,
  });

  const prev = pendingCardContexts.get(key);

  pendingCardContexts.set(key, {
    accountId: params.accountId ?? prev?.accountId,
    conversationId: params.conversationId,
    quotedRef: params.quotedRef ?? prev?.quotedRef,
    createdAt: params.createdAt ?? prev?.createdAt ?? Date.now(),
    fullText: params.fullText,
    messageId: params.messageId ?? prev?.messageId,
    processQueryKey: params.processQueryKey ?? prev?.processQueryKey,
    outTrackId: params.outTrackId ?? prev?.outTrackId,
    cardInstanceId: params.cardInstanceId ?? prev?.cardInstanceId,
  });

  console.log(`[DingTalk] card stream[${cardState ?? ""}] -> pending.text[${params.fullText?.length}] = ${params.fullText.slice(0, 100)}...`);

  return key;
}

export function getPendingCardContext(params: {
  conversationId: string;
  messageId?: string;
  processQueryKey?: string;
  outTrackId?: string;
  cardInstanceId?: string;
}): PendingCardContext | undefined {
  const key = buildPendingCardKey(params);
  return pendingCardContexts.get(key);
}

export function deletePendingCardContext(params: {
  conversationId: string;
  messageId?: string;
  processQueryKey?: string;
  outTrackId?: string;
  cardInstanceId?: string;
}): void {
  const key = buildPendingCardKey(params);
  pendingCardContexts.delete(key);
}