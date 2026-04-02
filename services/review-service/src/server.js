require('dotenv').config();
const app = require('./app');
const { connectDatabase, initSchema, closeDatabase } = require('./config/database');
const { startReviewConsumers } = require('./events/review.consumer');

const port = Number(process.env.PORT || 3008);

let server;

async function bootstrap() {
  await connectDatabase();
  await initSchema();
  startReviewConsumers();

  server = app.listen(port, () => {
    console.info(`[review-service] listening on port ${port}`);
  });
}

async function shutdown(signal) {
  console.info(`[review-service] received ${signal}, shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((error) => {
  console.error('[review-service] failed to start:', error);
  process.exit(1);
});
