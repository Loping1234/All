import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import slugify from "slugify";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function validateSites() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const csvPath = path.join(projectRoot, "data", "processed", "jodhpur_no_website.csv");
  const sitesDirectory = path.join(projectRoot, "sites");

  console.log("Validating generated demo websites...");

  const csvContent = await readFile(csvPath, "utf8");
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  const header = parseCsvLine(lines[0]);
  const businesses = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const business = {};
    header.forEach((col, idx) => {
      business[col] = row[idx];
    });
    businesses.push(business);
  }

  const limit = Math.min(5, businesses.length);
  const results = [];
  let overallPass = true;

  for (let i = 0; i < limit; i++) {
    const business = businesses[i];
    const slug = slugify(business.name, { lower: true, strict: true });
    const indexPath = path.join(sitesDirectory, slug, "index.html");
    const cssPath = path.join(sitesDirectory, slug, "style.css");

    console.log(`Checking sites/${slug}...`);

    let html;
    let css;
    try {
      html = await readFile(indexPath, "utf8");
      css = await readFile(cssPath, "utf8");
    } catch (error) {
      console.error(`Error: Missing files for ${business.name} (slug: ${slug}) - ${error.message}`);
      overallPass = false;
      results.push({ slug, name: business.name, status: "FAIL", errors: ["Missing index.html or style.css"] });
      continue;
    }

    const errors = [];
    const lowerHtml = html.toLowerCase();

    // 1. Business name check
    if (!html.includes(business.name)) {
      errors.push(`Business name "${business.name}" not found in HTML.`);
    }

    // 2. Category check
    if (!html.includes(business.category)) {
      errors.push(`Category "${business.category}" not found in HTML.`);
    }

    // 3. Address check
    const normalizedAddress = business.address.split(",")[0].trim();
    if (!html.includes(normalizedAddress)) {
      errors.push(`Address line not found in HTML. Expected to match at least: "${normalizedAddress}"`);
    }

    // 4. Phone check
    if (business.phone) {
      const phones = business.phone.split(";").map(p => p.trim());
      const hasPhone = phones.some(p => html.includes(p));
      if (!hasPhone) {
        errors.push(`Phone number "${business.phone}" not found in HTML.`);
      }
    }

    // 5. Map coordinates check
    const expectedCoords = `${business.latitude},${business.longitude}`;
    if (!html.includes(expectedCoords) && !html.includes(`${business.latitude}`) && !html.includes(`${business.longitude}`)) {
      errors.push(`Coordinates (${expectedCoords}) not found in map link.`);
    }

    // 6. Disclaimer check
    if (!lowerHtml.includes("unofficial demo website draft")) {
      errors.push("Missing visible disclaimer: 'Unofficial demo website draft'.");
    }

    // 7. Placeholders check
    const requiredPlaceholders = [
      "[OWNER TO PROVIDE LOGO]",
      "[OWNER TO PROVIDE PHOTOS]",
      "[OWNER TO PROVIDE MENU/SERVICES",
      "[OWNER TO PROVIDE OPENING HOURS]"
    ];

    for (const ph of requiredPlaceholders) {
      if (!html.includes(ph)) {
        errors.push(`Missing required placeholder: "${ph}"`);
      }
    }

    // 8. Fabrication check - menu items/prices
    // Search for currency symbols or menu details that do not have OWNER TO PROVIDE
    const priceRegex = /(?:rs\.?|\brup|inr|\$)\s*\d+/i;
    if (priceRegex.test(html)) {
      // Allow only if it is commented out or part of explanation, but warn
      errors.push("Possible fabricated price detected in HTML (e.g. Rs. XX, INR XX, $XX).");
    }

    // 9. Review fabrication check
    if (lowerHtml.includes("★★★★★") || /rating|review/i.test(html) && !lowerHtml.includes("placeholder") && !lowerHtml.includes("owner to provide")) {
      // If we see rating/review without placeholder text
      const lines = html.split("\n");
      const reviewLine = lines.find(l => /rating|review/i.test(l) && !l.toLowerCase().includes("placeholder") && !l.toLowerCase().includes("owner to provide"));
      if (reviewLine) {
        errors.push(`Possible fabricated review/rating detected: "${reviewLine.trim()}"`);
      }
    }

    // 10. Official claim check
    if (lowerHtml.includes("official website") && !lowerHtml.includes("unofficial")) {
      errors.push("Site claims to be official.");
    }

    const status = errors.length === 0 ? "PASS" : "FAIL";
    if (status === "FAIL") {
      overallPass = false;
    }

    results.push({
      slug,
      name: business.name,
      status,
      errors
    });
  }

  console.log("\nValidation Summary:");
  for (const res of results) {
    console.log(`- ${res.name} (${res.slug}): ${res.status}`);
    if (res.errors.length > 0) {
      res.errors.forEach(e => console.log(`  * ${e}`));
    }
  }

  if (!overallPass) {
    throw new Error("One or more generated websites failed the QA checks.");
  }

  console.log("\nAll sites passed QA checks.");
  return results;
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  validateSites().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
