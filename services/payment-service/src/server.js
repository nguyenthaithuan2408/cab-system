require('dotenv').config();
const app = require('./app');
const { connectDatabase, initSchema, closeDatabase } = require('./config/database');
const { startPaymentConsumers } = require('./events/payment.consumer');

const port = Number(process.env.PORT || 3005);

let server;

async function bootstrap() {
  await connectDatabase();
  await initSchema();
  startPaymentConsumers();

  server = app.listen(port, () => {
    console.info(`[payment-service] listening on port ${port}`);
  });
}

async function shutdown(signal) {
  console.info(`[payment-service] received ${signal}, shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((error) => {
  console.error('[payment-service] failed to start:', error);
  process.exit(1);
});
