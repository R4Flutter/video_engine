import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { Script, ScriptBeat } from "./types.ts";
import registry from "../assets.json";

export type AssetKind = "video" | "image" | "audio" | "document" | "ui" | "graphic";

export type AssetRecord = {
  id: string;
  path: string;
  type: AssetKind;
  required?: boolean;
  notes?: string;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TABLE = registry as Record<string, Omit<AssetRecord, "id">>;
const REQUIRED_MODULES = new Set(["footage", "quote"]);

type AssetFields = ScriptBeat & { assetId?: string; assetPath?: string };

const normalizePath = (value: string) => value.replaceAll("\\", "/").replace(/^\.\//, "");
const resolveFile = (value: string) => {
  const normalized = normalizePath(value);
  const absolute = isAbsolute(normalized) ? normalized : normalize(join(ROOT, normalized));
  return { path: normalized, absolute };
};

export const assetForBeat = (beat: ScriptBeat): AssetRecord | undefined => {
  const authored = beat as AssetFields;
  const id = authored.assetId?.trim();
  if (id && TABLE[id]) {
    const row = TABLE[id];
    const { path } = resolveFile(row.path);
    return { id, path, type: row.type, required: row.required ?? true, notes: row.notes };
  }

  const direct = authored.assetPath?.trim() || beat.footage?.trim();
  if (direct) {
    const { path } = resolveFile(direct);
    const type: AssetKind = /\.(mp4|mov|m4v|webm)$/i.test(path) ? "video" : "image";
    return { id: id || `beat-${beat.n}`, path, type, required: true };
  }
  return undefined;
};

export const assetIssuesForScript = (script: Script) => {
  const issues: string[] = [];
  for (const beat of script.beats) {
    const authored = beat as AssetFields;
    const needsPhysicalAsset = REQUIRED_MODULES.has(beat.module ?? "") || Boolean(authored.assetId || authored.assetPath || beat.footage);
    if (!needsPhysicalAsset) continue;
    const asset = assetForBeat(beat);
    if (!asset) {
      issues.push(`beat ${beat.n} (${beat.name}) requires an asset but has no assetId/assetPath/footage mapping`);
      continue;
    }
    if (!existsSync(asset.absolute)) issues.push(`beat ${beat.n} (${beat.name}) asset not found: ${asset.path}`);
  }
  return issues;
};

export const assetRegistry = TABLE;
