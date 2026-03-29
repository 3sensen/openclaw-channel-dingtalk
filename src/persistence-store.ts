import * as fs from "node:fs";
import * as path from "node:path";
import type { Logger } from "./types";

type NamespaceFormat = "json";

export interface PersistenceScope {
  accountId?: string;
  agentId?: string;
  conversationId?: string;
  groupId?: string;
  targetId?: string;
}

export interface ResolveNamespacePathOptions {
  storePath: string;
  scope?: PersistenceScope;
  format?: NamespaceFormat;
}

export interface ReadNamespaceJsonOptions<T> extends ResolveNamespacePathOptions {
  fallback: T;
  log?: Logger;
}

export interface WriteNamespaceJsonOptions<T> extends ResolveNamespacePathOptions {
  data: T;
  log?: Logger;
}

export interface ListNamespaceScopesOptions {
  storePath: string;
}

const NAMESPACE_ROOT_DIR = "dingtalk-state";

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function encodeScopeValue(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeScopeValue(value: string): string | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8").trim();
    return decoded || null;
  } catch {
    return null;
  }
}

function buildScopeSuffix(scope?: PersistenceScope): string {
  if (!scope) {
    return "";
  }
  const ordered: Array<[keyof PersistenceScope, string | undefined]> = [
    ["accountId", scope.accountId],
    ["agentId", scope.agentId],
    ["conversationId", scope.conversationId],
    ["groupId", scope.groupId],
    ["targetId", scope.targetId],
  ];

  const segments = ordered
    .filter(([, value]) => Boolean(value && value.trim()))
    .map(([key, value]) => `${key.replace(/Id$/, "")}-${encodeScopeValue((value || "").trim())}`);

  if (segments.length === 0) {
    return "";
  }
  return `.${segments.join(".")}`;
}

export function resolveNamespacePath(namespace: string, options: ResolveNamespacePathOptions): string {
  const format = options.format || "json";
  const baseDir = path.join(path.dirname(options.storePath), NAMESPACE_ROOT_DIR);
  const safeNamespace = sanitizeSegment(namespace.trim());
  const suffix = buildScopeSuffix(options.scope);
  return path.join(baseDir, `${safeNamespace}${suffix}.${format}`);
}

export function readNamespaceJson<T>(
  namespace: string,
  options: ReadNamespaceJsonOptions<T>,
): T {
  const filePath = resolveNamespacePath(namespace, options);
  try {
    if (!fs.existsSync(filePath)) {
      return options.fallback;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) {
      return options.fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    options.log?.warn?.(
      `[DingTalk][Persistence] Failed to read namespace=${namespace} path=${filePath}: ${toErrorMessage(err)}`,
    );
    return options.fallback;
  }
}

export function writeNamespaceJsonAtomic<T>(
  namespace: string,
  options: WriteNamespaceJsonOptions<T>,
): void {
  const filePath = resolveNamespacePath(namespace, options);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify(options.data, null, 2));
    try {
      fs.renameSync(tempPath, filePath);
    } catch (err: unknown) {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
        fs.renameSync(tempPath, filePath);
      } else {
        throw err;
      }
    }
  } catch (err: unknown) {
    options.log?.warn?.(
      `[DingTalk][Persistence] Failed to write namespace=${namespace} path=${filePath}: ${toErrorMessage(err)}`,
    );
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }
  }
}

export function listNamespaceScopes(namespace: string, options: ListNamespaceScopesOptions): PersistenceScope[] {
  const baseDir = path.join(path.dirname(options.storePath), NAMESPACE_ROOT_DIR);
  const safeNamespace = sanitizeSegment(namespace.trim());
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: PersistenceScope[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (entry.name === `${safeNamespace}.json`) {
      results.push({});
      continue;
    }
    if (!entry.name.startsWith(`${safeNamespace}.`) || !entry.name.endsWith(".json")) {
      continue;
    }
    const rawSuffix = entry.name.slice(`${safeNamespace}.`.length, -".json".length);
    const scope: PersistenceScope = {};
    let valid = true;
    for (const segment of rawSuffix.split(".")) {
      const dashIndex = segment.indexOf("-");
      if (dashIndex <= 0) {
        valid = false;
        break;
      }
      const key = segment.slice(0, dashIndex);
      const value = decodeScopeValue(segment.slice(dashIndex + 1));
      if (!value) {
        valid = false;
        break;
      }
      if (key === "account") {
        scope.accountId = value;
      } else if (key === "agent") {
        scope.agentId = value;
      } else if (key === "conversation") {
        scope.conversationId = value;
      } else if (key === "group") {
        scope.groupId = value;
      } else if (key === "target") {
        scope.targetId = value;
      } else {
        valid = false;
        break;
      }
    }
    if (valid) {
      results.push(scope);
    }
  }

  return results;
}
