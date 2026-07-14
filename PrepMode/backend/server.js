require('dotenv').config();

const { connectDb } = require('./src/config/db');
const { env } = require('./src/config/env');
const app = require('./src/app');

async function main() {
  await connectDb();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`PrepMode API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start PrepMode API:', err.message);
  process.exit(1);
});
