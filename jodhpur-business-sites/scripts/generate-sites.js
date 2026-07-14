import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import slugify from "slugify";
import { readFile } from "node:fs/promises";

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

const TEMPLATE_HTML = (business, slug) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business.name} - Demo Website</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Unofficial Demo Disclaimer -->
  <div class="demo-banner">
    <p>Unofficial demo website draft &mdash; Prepared for ${business.name}</p>
  </div>

  <header class="main-header">
    <div class="container header-container">
      <div class="logo-container">
        <!-- Logo Placeholder -->
        <div class="logo-placeholder">
          <span class="placeholder-tag">[OWNER TO PROVIDE LOGO]</span>
        </div>
        <span class="business-title">${business.name}</span>
      </div>
      <nav class="main-nav">
        <ul>
          <li><a href="#about">About</a></li>
          <li><a href="#services">Services & Menu</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-container">
      <span class="category-badge">${business.category}</span>
      <h1>Welcome to ${business.name}</h1>
      <p class="hero-subtext">Experience premium hospitality and service in Jodhpur.</p>
      <div class="cta-buttons">
        <a href="#contact" class="btn btn-primary">Get Directions</a>
        <a href="#services" class="btn btn-secondary">View Offerings</a>
      </div>
    </div>
  </section>

  <main>
    <section id="about" class="about-section">
      <div class="container">
        <div class="about-grid">
          <div class="about-content">
            <h2>About Us</h2>
            <p>We are a proud local business located in the heart of Jodhpur, Rajasthan. We strive to offer top-notch quality and memorable experiences to all our guests and customers.</p>
            
            <div class="hours-box">
              <h3>Opening Hours</h3>
              <div class="hours-placeholder">
                <p><strong>[OWNER TO PROVIDE OPENING HOURS]</strong></p>
                <p class="placeholder-desc">Please supply your weekly schedule, standard timings, and special holiday hours.</p>
              </div>
            </div>
          </div>
          
          <div class="about-media">
            <!-- Media/Photos Placeholder -->
            <div class="media-placeholder">
              <span class="placeholder-tag">[OWNER TO PROVIDE PHOTOS]</span>
              <p class="placeholder-desc">Space for high-quality photos of your venue, dishes, interior, and staff.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="services-section">
      <div class="container">
        <h2 class="section-title">Menu & Services</h2>
        <p class="section-subtitle">Discover what we have to offer.</p>
        
        <!-- Menu/Services Placeholder -->
        <div class="menu-placeholder-box">
          <div class="placeholder-header">
            <span class="placeholder-tag">[OWNER TO PROVIDE MENU/SERVICES & PRICING]</span>
          </div>
          <p class="placeholder-desc">Upload your current menu card, service list, catalog, packages, and seasonal prices here.</p>
          <div class="menu-skeletons">
            <div class="menu-item-skeleton"></div>
            <div class="menu-item-skeleton"></div>
            <div class="menu-item-skeleton"></div>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact-section">
      <div class="container">
        <h2>Contact & Location</h2>
        <p class="section-subtitle">Reach out or visit us in Jodhpur.</p>
        
        <div class="contact-grid">
          <div class="contact-info">
            <div class="info-card">
              <div class="info-icon">📍</div>
              <div>
                <h3>Address</h3>
                <p>${business.address}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-icon">📞</div>
              <div>
                <h3>Phone</h3>
                <p>${business.phone ? business.phone : "[OWNER TO PROVIDE PHONE NUMBER]"}</p>
              </div>
            </div>

            <div class="info-card">
              <div class="info-icon">🌐</div>
              <div>
                <h3>Website</h3>
                <p><em>[OWNER TO PROVIDE OFFICIAL DOMAIN]</em></p>
              </div>
            </div>
          </div>
          
          <div class="map-container">
            <a href="https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}" target="_blank" rel="noopener noreferrer" class="map-link-card">
              <div class="map-preview-placeholder">
                <span class="map-icon">🗺️</span>
                <h3>Interactive Map</h3>
                <p>Click to open exact location in Google Maps</p>
                <span class="coordinates">Coordinates: ${business.latitude}, ${business.longitude}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="main-footer">
    <div class="container footer-container">
      <p>&copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
      <p class="footer-draft-note">This is an unofficial demo draft. All branding, logos, and specific details are placeholders for the business owner to claim.</p>
    </div>
  </footer>
</body>
</html>
`;

const TEMPLATE_CSS = (business) => {
  // Select color scheme based on category
  let primaryHue = 210; // Default blue
  let primarySaturation = "80%";
  let primaryLightness = "50%";
  let themeName = "Sleek Modern";

  if (business.category.startsWith("catering.restaurant")) {
    primaryHue = 24; // Terracotta / warm orange-red
    primarySaturation = "75%";
    primaryLightness = "45%";
    themeName = "Warm Restaurant";
  } else if (business.category.startsWith("catering.cafe")) {
    primaryHue = 35; // Cozy Warm Brown / Amber
    primarySaturation = "60%";
    primaryLightness = "40%";
    themeName = "Cozy Cafe";
  } else if (business.category.startsWith("commercial.health_and_beauty")) {
    primaryHue = 325; // Rose / Magenta
    primarySaturation = "70%";
    primaryLightness = "55%";
    themeName = "Beauty/Saloon";
  }

  return `:root {
  --primary-color: hsl(${primaryHue}, ${primarySaturation}, ${primaryLightness});
  --primary-hover: hsl(${primaryHue}, ${primarySaturation}, calc(${primaryLightness} - 10%));
  --primary-light: hsl(${primaryHue}, ${primarySaturation}, 95%);
  --dark-bg: #0f172a;
  --dark-surface: #1e293b;
  --light-bg: #f8fafc;
  --light-surface: #ffffff;
  --text-dark: #0f172a;
  --text-light: #f8fafc;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --radius-lg: 16px;
  --radius-md: 8px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Outfit', sans-serif;
  background-color: var(--light-bg);
  color: var(--text-dark);
  line-height: 1.6;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Banner */
.demo-banner {
  background-color: #f59e0b;
  color: #000;
  text-align: center;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 2px solid #d97706;
}

/* Header */
.main-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 0;
  position: sticky;
  top: 40px;
  z-index: 999;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-placeholder {
  width: 40px;
  height: 40px;
  background-color: var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--text-muted);
}

.logo-placeholder .placeholder-tag {
  font-size: 0.4rem;
  text-align: center;
  font-weight: bold;
  color: var(--text-muted);
}

.business-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--primary-color);
}

.main-nav ul {
  list-style: none;
  display: flex;
  gap: 24px;
}

.main-nav a {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 600;
  transition: var(--transition);
}

.main-nav a:hover {
  color: var(--primary-color);
}

/* Hero */
.hero {
  background: radial-gradient(circle at top right, var(--primary-light), transparent), var(--light-surface);
  padding: 100px 0 80px 0;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.hero-container {
  max-width: 800px;
}

.category-badge {
  display: inline-block;
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: 6px 16px;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  margin-bottom: 16px;
  border: 1px solid var(--primary-color);
}

.hero h1 {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--text-dark);
}

.hero-subtext {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-bottom: 32px;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  display: inline-block;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: var(--transition);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-secondary:hover {
  background-color: var(--primary-light);
  transform: translateY(-2px);
}

/* Common Section Styles */
section {
  padding: 80px 0;
}

.section-title {
  text-align: center;
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.section-subtitle {
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 48px;
}

/* About Section */
.about-section {
  background-color: var(--light-surface);
}

.about-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  align-items: center;
}

.hours-box {
  margin-top: 32px;
  background-color: var(--light-bg);
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.hours-box h3 {
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.hours-placeholder {
  border: 2px dashed #cbd5e1;
  padding: 16px;
  border-radius: var(--radius-md);
  text-align: center;
}

.placeholder-tag {
  display: inline-block;
  background-color: #fef3c7;
  color: #d97706;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.placeholder-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.media-placeholder {
  background-color: #f1f5f9;
  border: 3px dashed #cbd5e1;
  aspect-ratio: 4/3;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

/* Services/Menu Section */
.services-section {
  background-color: var(--light-bg);
}

.menu-placeholder-box {
  background-color: var(--light-surface);
  border: 3px dashed #cbd5e1;
  padding: 40px;
  border-radius: var(--radius-lg);
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.menu-skeletons {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu-item-skeleton {
  height: 48px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Contact Section */
.contact-section {
  background-color: var(--light-surface);
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 40px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  display: flex;
  gap: 16px;
  background-color: var(--light-bg);
  padding: 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.info-icon {
  font-size: 1.5rem;
}

.info-card h3 {
  font-size: 1rem;
  margin-bottom: 4px;
}

.info-card p {
  color: var(--text-muted);
}

.map-container {
  display: block;
  text-decoration: none;
}

.map-link-card {
  text-decoration: none;
  color: inherit;
  display: block;
}

.map-preview-placeholder {
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  aspect-ratio: 16/10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  transition: var(--transition);
  cursor: pointer;
}

.map-preview-placeholder:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow);
}

.map-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.coordinates {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Footer */
.main-footer {
  background-color: var(--dark-bg);
  color: var(--text-light);
  padding: 40px 0;
  text-align: center;
  font-size: 0.9rem;
}

.footer-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-draft-note {
  color: #94a3b8;
  font-size: 0.8rem;
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .about-grid, .contact-grid {
    grid-template-columns: 1fr;
  }
  
  .hero h1 {
    font-size: 2.2rem;
  }
}
`;
};

async function run() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const csvPath = path.join(projectRoot, "data", "processed", "jodhpur_no_website.csv");
  const sitesDirectory = path.join(projectRoot, "sites");

  console.log(`Reading source CSV: ${csvPath}`);
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

  // Generate demo sites for only the first 5 businesses
  const limit = Math.min(5, businesses.length);
  console.log(`Generating demo sites for first ${limit} businesses...`);

  for (let i = 0; i < limit; i++) {
    const business = businesses[i];
    const slug = slugify(business.name, { lower: true, strict: true });
    const businessDirectory = path.join(sitesDirectory, slug);

    console.log(`Creating demo site directory: sites/${slug}...`);
    await mkdir(businessDirectory, { recursive: true });

    const htmlContent = TEMPLATE_HTML(business, slug);
    const cssContent = TEMPLATE_CSS(business);

    await writeFile(path.join(businessDirectory, "index.html"), htmlContent, "utf8");
    await writeFile(path.join(businessDirectory, "style.css"), cssContent, "utf8");

    console.log(`Completed sites/${slug}/index.html and style.css`);
  }

  console.log("Site generation phase completed.");
}

run().catch((error) => {
  console.error(`Generation Failed: ${error.message}`);
  process.exit(1);
});
