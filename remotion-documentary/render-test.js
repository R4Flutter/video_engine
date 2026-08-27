const { renderMedia, selectComposition } = require("@remotion/renderer");
const path = require("path");

async function main() {
  const composition = await selectComposition({
    serveUrl: "http://localhost:3000",
    id: "TestRender",
  });

  await renderMedia({
    composition,
    serveUrl: "http://localhost:3000",
    codec: "h264",
    outputLocation: path.join(__dirname, "out", "test-renderer.mp4"),
    inputProps: {},
  });

  console.log("Render complete!");
}

main().catch(console.error);