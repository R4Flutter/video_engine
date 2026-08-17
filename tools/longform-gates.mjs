// longform-gates.mjs — the production gate, shared by the beam search
// (tools/engine/search.mjs) and the editorial gate CLI (tools/qc.mjs).
// The gate is the arbiter of the whole loop: a variant that fails any gate
// never ships, and the final plan file is gate-checked before render.
export const GATES = {
  hook: 8.5,
  narrative: 8.0,
  curiosity: 8.0,
  pacing: 7.0,
  visualHierarchy: 8.0,
  visualVariety: 8.0,
  evidence: 8.0,
  broll: 7.0,
  audio: 7.0,
  transitions: 7.0,
  payoff: 8.0,
  continuity: 8.0,
  retention: 8.0,
};

export const gateFailures = (scores, metrics) => {
  const out = [];
  for (const [key, threshold] of Object.entries(GATES)) {
    const value = Number(scores?.[key]);
    if (!Number.isFinite(value)) {
      out.push({ severity: "FATAL", rule: `missing_score_${key}`, message: `Missing ${key} score.`, fix: "Regenerate the long-form QC data." });
    } else if (value < threshold) {
      out.push({ severity: "HIGH", rule: `score_${key}`, message: `${key}=${value.toFixed(1)} below ${threshold.toFixed(1)} gate.`, fix: `Repair ${key} weaknesses before render.` });
    }
  }
  if (Number(metrics?.visualChangesPerMinute || 0) < 5) {
    out.push({ severity: "HIGH", rule: "visual_change_rate", message: `Only ${Number(metrics.visualChangesPerMinute || 0).toFixed(1)} semantic visual changes/minute.`, fix: "Increase meaningful visual state changes, not decorative transitions." });
  }
  if (Number(metrics?.evidenceEventsPerMinute || 0) < 1.5) {
    out.push({ severity: "MED", rule: "evidence_density", message: `Only ${Number(metrics.evidenceEventsPerMinute || 0).toFixed(1)} evidence events/minute.`, fix: "Add documents, UI, numbers, archival evidence or concrete physical proof where claims are made." });
  }
  return out;
};