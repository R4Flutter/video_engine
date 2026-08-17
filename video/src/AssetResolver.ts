import manifest from "./asset-manifest.json";

type Asset = { id: string; path: string; kind: "video" | "image" | "graphic" | "evidence"; tags: string[] };
type Beat = any;

const assets = manifest.assets as Asset[];
const norm = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const kindOrder: Record<string, Asset["kind"][]> = {
  footage: ["video", "image"],
  evidence: ["evidence", "graphic", "image", "video"],
  archive: ["video", "evidence", "image"],
  stat: ["graphic", "evidence", "video"],
  chart: ["graphic", "evidence", "video"],
  investChart: ["graphic", "evidence", "video"],
  compare: ["graphic", "evidence", "video", "image"],
  timeline: ["graphic", "evidence", "image", "video"],
  icon: ["graphic", "image", "evidence"],
  quote: ["evidence", "image", "video"],
  callout: ["evidence", "graphic", "video", "image"],
  payoff: ["video", "evidence", "graphic", "image"],
  outro: ["video", "image", "graphic"],
};

const expansions: Record<string, string[]> = {
  adobe: ["software", "ownership", "creative cloud", "subscription"],
  amazon: ["prime", "cancel", "cancellation", "dark pattern"],
  bally: ["gym", "contract", "history"],
  gym: ["attendance", "capacity", "members"],
  streaming: ["services", "subscription", "cable"],
  breakage: ["recurring", "inertia", "loop"],
  subscription: ["recurring", "spending", "charges"],
};

export const resolveAsset = (beat: Beat): Asset | null => {
  const explicit = beat?.visual?.assetPath || beat?.visual?.asset || beat?.visual?.footage;
  if (explicit) {
    const e = String(explicit).replace(/\\/g, "/");
    const found = assets.find((a) => a.path === e || a.path.endsWith(e.replace(/^assets\//, "")));
    if (found) return found;
  }

  const module = String(beat?.visual?.module || "evidence");
  const query = norm([
    beat?.name,
    beat?.visual?.module,
    beat?.visual?.source,
    beat?.typography?.text,
    beat?.narrative?.purpose,
    beat?.narrative?.question,
    beat?.narrative?.reveal,
  ].filter(Boolean).join(" "));

  const tokens = new Set<string>(query.split(/\s+/).filter((x: string) => x.length > 2));
  for (const [key, values] of Object.entries(expansions)) if (query.includes(key)) values.flatMap(norm).forEach((x) => tokens.add(x));

  const kinds = kindOrder[module] ?? ["video", "evidence", "graphic", "image"];
  let best: { asset: Asset; score: number } | null = null;

  for (const asset of assets) {
    const hay = norm(`${asset.id} ${asset.tags.join(" ")} ${asset.path}`);
    let score = kinds.includes(asset.kind) ? (kinds.length - kinds.indexOf(asset.kind)) * 4 : 0;
    for (const token of tokens) if (hay.includes(token)) score += token.length >= 6 ? 5 : 2;
    if (module === "footage" && asset.kind === "video") score += 8;
    if (["stat", "chart", "investChart"].includes(module) && asset.kind === "graphic") score += 10;
    if (["evidence", "quote", "callout", "archive"].includes(module) && asset.kind === "evidence") score += 10;
    if (!best || score > best.score) best = { asset, score };
  }

  return best && best.score >= 10 ? best.asset : null;
};

export const mediaUrl = (asset: Asset | null) => asset?.path.replace(/\\/g, "/") ?? "";
