import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const scriptPath = join(root, "video/src/script.json");
const script = JSON.parse(readFileSync(scriptPath, "utf8"));

if (script.engine === "finance" && Number(script.durationInSeconds) >= 120) {
  script.width = 1920;
  script.height = 1080;
  writeFileSync(scriptPath, JSON.stringify(script, null, 2) + "\n");
  console.log("LONG-FORM FORMAT: normalized finance documentary to 1920x1080");
}
