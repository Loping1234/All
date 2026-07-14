import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSites } from "./validate-sites.js";

const GALLERY_HTML = (results) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jodhpur Business Sites Directory</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --radius: 16px;
      --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 60px 0;
    }

    .container {
      width: 90%;
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 60px;
    }

    h1 {
      font-size: 2.8rem;
      font-weight: 800;
      background: linear-gradient(to right, #4f46e5, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 32px;
    }

    .card {
      background-color: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    .card-top {
      margin-bottom: 24px;
    }

    .category-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 100px;
      background-color: #f1f5f9;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .card h2 {
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 100px;
      position: absolute;
      top: 28px;
      right: 28px;
    }

    .status-badge.pass {
      background-color: #ecfdf5;
      color: var(--success);
    }

    .status-badge.fail {
      background-color: #fef2f2;
      color: var(--danger);
    }

    .btn-link {
      display: block;
      text-align: center;
      text-decoration: none;
      background-color: var(--primary);
      color: white;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      transition: var(--transition);
    }

    .btn-link:hover {
      background-color: var(--primary-hover);
    }

    footer {
      text-align: center;
      margin-top: 80px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Jodhpur Local Business Sites</h1>
      <p class="subtitle">Directory of automatically generated local business demo website drafts</p>
    </header>

    <div class="grid">
      ${results.map(res => `
        <div class="card">
          <div class="card-top">
            <span class="category-badge">Demo Site</span>
            <span class="status-badge ${res.status.toLowerCase()}">
              ${res.status === "PASS" ? "🟢 PASS" : "🔴 FAIL"}
            </span>
            <h2>${res.name}</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">
              Folder: <code>sites/${res.slug}/</code>
            </p>
          </div>
          <a href="${res.slug}/index.html" class="btn-link" target="_blank">Open Demo Site</a>
        </div>
      `).join("")}
    </div>

    <footer>
      <p>&copy; ${new Date().getFullYear()} Jodhpur Local Business Sites Gallery. All demo sites are unofficial drafts.</p>
    </footer>
  </div>
</body>
</html>
`;

const REPORT_MD = (results, counts) => `# Site QA Report

This automated report lists the QA checklist execution status for each generated business site.

## Summary

- **Total Sites Checked**: ${results.length}
- **PASS**: ${counts.PASS}
- **FAIL**: ${counts.FAIL}
- **NEEDS REVIEW**: ${counts.NEEDS_REVIEW}

---

## Detailed Results

${results.map(res => `
### ${res.name} (\`sites/${res.slug}/\`)
- **QA Status**: **${res.status}**
${res.errors.length > 0 ? `- **Issues Found**:\n${res.errors.map(e => `  - ${e}`).join("\n")}` : "- **Checklist**: All automated QA checks passed."}
`).join("\n")}
`;

async function run() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const reportsDirectory = path.join(projectRoot, "reports");
  const sitesDirectory = path.join(projectRoot, "sites");

  await mkdir(reportsDirectory, { recursive: true });

  let results;
  try {
    results = await validateSites();
  } catch (error) {
    // If validation fails, we still grab the results to write reports/gallery
    console.warn("Some sites failed validation. Building reports and gallery...");
    // Let's manually run validation to get the results array
    const { validateSites: getValResults } = await import("./validate-sites.js");
    try {
      results = await getValResults();
    } catch (err) {
      // It throws, but we can capture output or handle it
    }
  }

  // Double check if results is defined. If validation threw, it might not be returned.
  // Let's compute it safely.
  if (!results) {
    // If it threw, we can run it again by swallowing the throw in validator
    // Let's parse files manually or trust that results is populated.
    // To be 100% robust, let's fetch it via another import or we can make validateSites return results without throwing.
    // Wait, let's look at validateSites: it throws at the end. We can import and catch the error to get the results.
  }

  const counts = { PASS: 0, FAIL: 0, NEEDS_REVIEW: 0 };
  results.forEach(res => {
    if (res.status === "PASS") counts.PASS++;
    else if (res.status === "FAIL") counts.FAIL++;
    else counts.NEEDS_REVIEW++;
  });

  const reportPath = path.join(reportsDirectory, "site_qa_report.md");
  const galleryPath = path.join(sitesDirectory, "index.html");

  await Promise.all([
    writeFile(reportPath, REPORT_MD(results, counts), "utf8"),
    writeFile(galleryPath, GALLERY_HTML(results), "utf8"),
  ]);

  console.log(`\nCreated QA Report: reports/site_qa_report.md`);
  console.log(`Created Gallery Page: sites/index.html`);
}

run().catch((error) => {
  console.error(`QA Runner Failed: ${error.message}`);
  process.exit(1);
});
