import "dotenv/config";

const key = process.env.GEOAPIFY_API_KEY;

if (!key) {
  console.error("GEOAPIFY_API_KEY is missing.");
  process.exit(1);
}

if (key.length < 20) {
  console.error("GEOAPIFY_API_KEY looks invalid.");
  process.exit(1);
}

console.log("GEOAPIFY_API_KEY loaded.");
