import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  buildSummaryNarrativePrompt,
  formatSummaryReply,
  formatSummaryCommandHelp,
  generateSummaryNarrative,
  isSummaryCommandText,
  parseSummaryCommand,
  resolveSummaryMentionNames,
} from "../../src/commands/summary-command-service";
import { upsertInboundMessageContext } from "../../src/message-context-store";

describe("summary-command-service", () => {
  it("parses summary mention and here scopes", () => {
    expect(parseSummaryCommand("/summary mention @Alice,me 1d", 2000)).toEqual({
      scope: "summary",
      mentionNames: ["Alice", "me"],
      sinceTs: 2000 - 24 * 60 * 60 * 1000,
      windowLabel: "最近 1 天",
    });

    const parsedToday = parseSummaryCommand("/summary here today", 2000);
    expect(parsedToday).toEqual(expect.objectContaining({
      scope: "summary",
      useCurrentConversation: true,
      windowLabel: "今天",
    }));
    expect(typeof parsedToday.sinceTs).toBe("number");
  });

  it("resolves mention self alias and formats help", () => {
    expect(resolveSummaryMentionNames(["me", "Alice"], "Bob")).toEqual(["Bob", "Alice"]);
    expect(formatSummaryCommandHelp()).toContain("/summary mention");
  });

  it("parses conversations and sender scopes, and rejects invalid windows", () => {
    expect(parseSummaryCommand("/summary conversations cid1,cid2 3d", 10_000)).toEqual({
      scope: "summary",
      conversationIds: ["cid1", "cid2"],
      sinceTs: 10_000 - 3 * 24 * 60 * 60 * 1000,
      windowLabel: "最近 3 天",
    });
    expect(parseSummaryCommand("/summary sender u1,u2 12h", 10_000)).toEqual({
      scope: "summary",
      senderIds: ["u1", "u2"],
      sinceTs: 10_000 - 12 * 60 * 60 * 1000,
      windowLabel: "最近 12 小时",
    });
    expect(parseSummaryCommand("/summary group abc")).toEqual({
      scope: "unknown",
      windowLabel: "最近 1 天",
    });
    expect(parseSummaryCommand("/summary group 0d")).toEqual({
      scope: "unknown",
      windowLabel: "最近 1 天",
    });
  });

  it("matches only the summary command word boundary", () => {
    expect(isSummaryCommandText("/summary")).toBe(true);
    expect(isSummaryCommandText("/summary group 1d")).toBe(true);
    expect(isSummaryCommandText("/summaryXYZ")).toBe(false);
  });

  it("formats empty history replies", () => {
    expect(formatSummaryReply({
      slices: [],
      windowLabel: "最近 1 天",
      chatType: "group",
      senderIds: ["u1"],
    })).toContain("未找到可总结的消息。");
  });

  it("uses history segment wording in prompts", () => {
    const prompt = buildSummaryNarrativePrompt({
      accountId: "main",
      windowLabel: "最近 1 天",
      slices: [{
        conversation: {
          conversationId: "cid_a",
          chatType: "group",
          title: "研发群",
          updatedAt: 1,
        },
        recentEntries: [],
        summarySegments: [{
          id: "seg",
          fromTs: 1,
          toTs: 2,
          createdAt: 3,
          messageCount: 2,
          summary: "line1\nline2",
        }],
      }],
    });

    expect(prompt.userPrompt).toContain("历史消息片段");
    expect(prompt.userPrompt).not.toContain("历史摘要段");
  });

  it("falls back and logs when narrative dispatch fails", async () => {
    const warn = vi.fn();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "summary-command-service-"));
    const storePath = path.join(tempDir, "session-store.json");

    upsertInboundMessageContext({
      storePath,
      accountId: "main",
      conversationId: "cid_group",
      msgId: "m1",
      createdAt: 1000,
      messageType: "text",
      text: "hello",
      senderId: "owner",
      senderName: "Owner",
      chatType: "group",
      ttlMs: 60_000,
      topic: null,
    });

    const reply = await generateSummaryNarrative({
      rt: {
        channel: {
          reply: {
            finalizeInboundContext: vi.fn().mockReturnValue({ SessionKey: "ctx" }),
            dispatchReplyWithBufferedBlockDispatcher: vi.fn().mockRejectedValue(new Error("dispatch crash")),
          },
        },
      } as any,
      cfg: {},
      log: { warn } as any,
      accountId: "main",
      senderId: "owner",
      senderName: "Owner",
      to: "cid_group",
      routeSessionKey: "s1",
      conversationLabel: "研发群 - Owner",
      chatType: "group",
      windowLabel: "最近 1 天",
      conversationIds: ["cid_group"],
      storePath,
    });

    expect(reply).toContain("hello");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Narrative generation failed"));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
