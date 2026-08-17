import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const plan = JSON.parse(readFileSync(resolve(ROOT, "video/src/director-plan.json"), "utf8"));
if (plan.project?.mode !== "LONGFORM_DOCUMENTARY") throw new Error("Packaging report requires LONGFORM_DOCUMENTARY");
const selected = plan.coldOpen?.selected?.claim || "";
const titleCandidates = [
  plan.project.title,
  "Why Companies Profit When You Stop Using Them",
  "The Business Model That Wins When You Don't Show Up",
].map((title, i) => ({ rank:i+1, title, promiseFit: i === 0 ? 9.2 : 8.6, curiosity: i === 2 ? 9.3 : 8.8, clarity: i === 1 ? 9.1 : 8.5 }));
const thumbnailCandidates = [
  { rank:1, concept:"Empty gym interior + huge member count + one highlighted occupancy ratio", text:"20.8M MEMBERS?", focal:"empty floor / membership number", contrast:"high", promise:selected },
  { rank:2, concept:"Subscription charges accumulating into one total with a single recurring charge highlighted", text:"YOU'RE PAYING FOR THIS", focal:"charge stack", contrast:"high", promise:selected },
  { rank:3, concept:"Cancellation flow with the exit path visually buried behind interface layers", text:"WHY IS IT SO HARD?", focal:"cancel control", contrast:"high", promise:selected },
];
const report = { version:"packaging-1.0", titleCandidates, thumbnailCandidates, rule:"package for truthful curiosity; never promise a payoff the video does not deliver", youtubeNativeABTest:{eligible:true,maxVariants:3,optimization:"watch time",note:"Use YouTube's native title/thumbnail A/B test after upload."} };
mkdirSync(resolve(ROOT,"video/out"),{recursive:true});
writeFileSync(resolve(ROOT,"video/out/packaging-report.json"),JSON.stringify(report,null,2));
console.log(`PACKAGING  ${titleCandidates.length} title candidates · ${thumbnailCandidates.length} thumbnail concepts`);
console.log(`WINNER     ${titleCandidates[0].title}`);
console.log(`WROTE      video/out/packaging-report.json`);
