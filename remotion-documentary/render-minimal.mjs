import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const composition = await selectComposition({
    serveUrl: "http://localhost:3001",
    id: "TestRender",
  });

  await renderMedia({
    composition,
    serveUrl: "http://localhost:3001",
    codec: "h264",
    outputLocation: path.join(__dirname, "out", "test-renderer.mp4"),
    inputProps: {},
  });

  console.log("Render complete!");
}

main().catch(console.error);