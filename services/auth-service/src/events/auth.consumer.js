'use strict';

const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { AUTH_EVENTS, REDIS_KEYS } = require('../models/auth.model');

/**
 * Start the Kafka consumer for auth-service.
 * Currently subscribed to:
 *   - user.events → user.deleted: revoke all tokens for the deleted user
 *
 * Consumer startup failure is non-fatal — the service continues without it.
 */
const startConsumer = async () => {
  const kafka = new Kafka({
    clientId: 'auth-service-consumer',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
      initialRetryTime: 200,
      retries: 3,
    },
  });

  const consumer = kafka.consumer({ groupId: 'auth-service-group' });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'user.events', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const payload = JSON.parse(message.value.toString());

          if (payload.event === AUTH_EVENTS.USER_DELETED) {
            const userId = payload.data?.id;
            if (!userId) {
              logger.warn({ payload }, '[auth-service] user.deleted event missing data.id');
              return;
            }
            // Revoke refresh token so the deleted user cannot obtain new access tokens
            const deleted = await redisClient.del(REDIS_KEYS.REFRESH_TOKEN(userId));
            logger.info({ userId, deleted }, '[auth-service] Revoked refresh token for deleted user');
          }
        } catch (err) {
          logger.error({ err }, '[auth-service] Error processing consumer message');
        }
      },
    });

    logger.info('[auth-service] Kafka consumer started — subscribed to user.events');
  } catch (err) {
    logger.error({ err }, '[auth-service] Kafka consumer failed to start — continuing without consumer');
    // Non-fatal: core auth flows are unaffected
  }
};

module.exports = { startConsumer };
