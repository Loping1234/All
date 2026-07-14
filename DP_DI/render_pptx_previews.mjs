import fs from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";

const requireFromRuntime = createRequire(
  "C:/Users/PRANAY/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json",
);
const artifactToolUrl = pathToFileURL(requireFromRuntime.resolve("@oai/artifact-tool")).href;
const { PresentationFile, FileBlob } = await import(artifactToolUrl);

const input =
  "C:/Users/PRANAY/OneDrive/Documents/Task_App/DP_DI/output/A149_PranayKumar_Final_Presentation_Revora.pptx";
const outDir = "C:/Users/PRANAY/OneDrive/Documents/Task_App/DP_DI/output/previews";

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const bytes = await fs.readFile(input);
const blob = new FileBlob(
  bytes,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
);
const presentation = await PresentationFile.importPptx(blob);

for (let index = 0; index < presentation.slides.count; index += 1) {
  const png = await presentation.slides.getItem(index).export({ format: "png" });
  const fileName = `slide_${String(index + 1).padStart(2, "0")}.png`;
  await fs.writeFile(path.join(outDir, fileName), Buffer.from(await png.arrayBuffer()));
}

console.log(`Rendered ${presentation.slides.count} slide previews to ${outDir}`);
process.exit(0);
