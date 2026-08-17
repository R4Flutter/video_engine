// Vidosy-inspired deterministic render contract for FinanceLong.
// It converts editorial decisions into a renderer-safe scene specification.
const MEDIA = new Set(["footage", "evidence", "stat", "compare", "chart", "investChart", "timeline", "icon", "payoff"]);
const inferRenderKind = (module) => {
  if (module === "footage") return "MEDIA";
  if (module === "evidence") return "EVIDENCE";
  if (module === "stat" || module === "chart" || module === "investChart") return "DATA";
  if (module === "compare") return "COMPARISON";
  if (module === "timeline") return "TIMELINE";
  if (module === "payoff") return "PAYOFF";
  return "GRAPHIC";
};
const normalizeAsset = (value) => value ? String(value).replace(/\\/g, "/").replace(/^assets\//, "assets/") : "";

export function buildLongformRenderContract(plan, references = []) {
  if (plan?.project?.mode !== "LONGFORM_DOCUMENTARY") return plan;
  const beats = (plan.beats ?? []).map((beat, index) => {
    const start = Number(beat.start) || 0;
    const end = Math.max(start + 1, Number(beat.end) || start + 1);
    const module = String(beat?.visual?.module || "");
    const asset = normalizeAsset(beat?.visual?.assetPath || beat?.visual?.asset || beat?.visual?.footage || "");
    const caption = beat?.typography?.text || beat?.visual?.reveal || beat?.narrative?.reveal || "";
    const camera = beat?.motion?.camera || beat?.visual?.camera || "hold";
    return {
      ...beat,
      render: {
        schema: "vidosy-inspired-1",
        sequence: { index, fromSeconds: start, durationSeconds: end - start },
        scene: { kind: inferRenderKind(module), module: MEDIA.has(module) ? module : "icon", strict: true },
        media: { src: asset || null, fit: "cover", muted: true, loop: true },
        typography: { text: caption, enabled: Boolean(caption) },
        motion: { camera, reveal: beat?.motion?.reveal || {}, deterministic: true },
        audio: { music: beat?.audio?.music || beat?.music || "hold", silenceBeforeReveal: Number(beat?.audio?.silenceBeforeReveal || 0), accents: beat?.audio?.accents || [] },
        transition: beat?.transition || "cut",
        referencesApplied: references.length,
      },
    };
  });
  return {
    ...plan,
    renderContract: { schema: "vidosy-inspired-1", renderer: "Remotion/FinanceLong", deterministic: true, sourceOfTruth: "director-plan.json", referencePatternCount: references.length, sceneCount: beats.length, rule: "director decides; render contract executes; renderer does not invent editorial decisions" },
    beats,
  };
}
