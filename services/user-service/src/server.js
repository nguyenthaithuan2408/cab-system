require('dotenv').config();
const app = require('./app');
const { connectDatabase, initSchema, closeDatabase } = require('./config/database');
const { startUserConsumers } = require('./events/user.consumer');

const port = Number(process.env.PORT || 3002);

let server;

async function bootstrap() {
  await connectDatabase();
  await initSchema();
  startUserConsumers();

  server = app.listen(port, () => {
    console.info(`[user-service] listening on port ${port}`);
  });
}

async function shutdown(signal) {
  console.info(`[user-service] received ${signal}, shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((error) => {
  console.error('[user-service] failed to start:', error);
  process.exit(1);
});
