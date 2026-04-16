import fs from "node:fs/promises";
import path from "node:path";

type SessionEntry = Record<string, unknown>;
type SessionStore = Record<string, SessionEntry>;

type LoggerLike = {
  debug?: (msg: string) => void;
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
};

type EnsureParams = {
  storePath: string;
  sessionKey: string;
  reasoning?: "off" | "on" | "stream";
  thinking?: "off" | "low" | "medium";
  onlyWhenMissing?: boolean;
  log?: LoggerLike;
};

const LOCK_RETRY_MS = 50;
const LOCK_TIMEOUT_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireFileLock(lockDir: string): Promise<() => Promise<void>> {
  const startedAt = Date.now();

  while (true) {
    try {
      await fs.mkdir(lockDir);
      return async () => {
        await fs.rm(lockDir, { recursive: true, force: true }).catch(() => { });
      };
    } catch (err: any) {
      if (err?.code !== "EEXIST") {
        throw err;
      }
      if (Date.now() - startedAt > LOCK_TIMEOUT_MS) {
        throw new Error(`Acquire lock timeout: ${lockDir}`);
      }
      await sleep(LOCK_RETRY_MS);
    }
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return fallback;
    }
    throw err;
  }
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(
    dir,
    `.${base}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

export async function ensureSessionDefault(params: EnsureParams): Promise<boolean> {
  const {
    storePath,
    sessionKey,
    reasoning = "off",
    thinking,
    onlyWhenMissing = true,
    log,
  } = params;

  console.log(`rewrite ${storePath} for first session`);

  const release = await acquireFileLock(`${storePath}.lock`);

  try {
    const store = await readJson<SessionStore>(storePath, {});
    const entry = store[sessionKey];

    if (!entry || typeof entry !== "object") {
      log?.debug?.(
        `[DingTalk] session not found, skip reasoning init. sessionKey=${sessionKey}`,
      );
      return false;
    }

    const chg = setSessionDefault(sessionKey, entry, [
      { onlyWhenMissing, attr: "reasoningLevel", val: reasoning },
      { onlyWhenMissing, attr: "thinkingLevel", val: thinking }
    ]);

    if (chg) {
      store[sessionKey] = {
        ...entry
      };
      await writeJsonAtomic(storePath, store);
      log?.info?.(
        `[DingTalk] initialized /reasoning ${reasoning}, /think:${thinking} for session ${sessionKey}`,
      );
    }

    return true;
  } finally {
    await release();
  }
}

function setSessionDefault(sessionKey: string, session: SessionEntry, defaults: { 
  onlyWhenMissing: boolean, 
  attr: "reasoningLevel" | "thinkingLevel", 
  val: any 
}[], log?: LoggerLike): boolean {
  let ret: boolean = false;

  for (const def of defaults) {
    const current = session[def.attr];

    if (def.onlyWhenMissing && current != null && current !== "") {
      log?.info?.(
        `[DingTalk] ${def.attr} already exists, skip. sessionKey=${sessionKey} current=${String(current)}`,
      );
      continue;
    }
    session[def.attr] = def.val;
    log?.info?.(`[DingTalk] set ${def.attr} = ${def.val} to session[${sessionKey}]`);
    ret = true;
  }

  return ret;
}