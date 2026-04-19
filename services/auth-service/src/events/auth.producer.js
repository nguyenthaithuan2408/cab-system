'use strict';

const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');
const { KAFKA_TOPICS, AUTH_EVENTS } = require('../models/auth.model');

let producer = null;
let isConnected = false;

/**
 * Lazily initialize and return the Kafka producer.
 * On connection failure the function resolves to null;
 * callers must handle the null case.
 */
const _getProducer = async () => {
  if (producer && isConnected) return producer;

  const kafka = new Kafka({
    clientId: 'auth-service-producer',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
      initialRetryTime: 200,
      retries: 3,
    },
  });

  producer = kafka.producer();

  try {
    await producer.connect();
    isConnected = true;
    logger.info('[auth-service] Kafka producer connected');
  } catch (err) {
    logger.error({ err }, '[auth-service] Kafka producer connection failed — events will be skipped');
    isConnected = false;
    producer = null;
  }

  return producer;
};

/**
 * Publish a `user.registered` event to Kafka.
 * IMPORTANT: This is a side-effect — failure must NOT crash the auth flow.
 * Always call without await at the controller level, or wrap in try/catch.
 *
 * @param {{ id: string, email: string, role: string }} user
 */
const publishUserRegistered = async (user) => {
  try {
    const prod = await _getProducer();
    if (!prod) return; // Kafka unavailable — skip silently

    await prod.send({
      topic: KAFKA_TOPICS.USER_EVENTS,
      messages: [
        {
          key: user.id,
          value: JSON.stringify({
            event: AUTH_EVENTS.USER_REGISTERED,
            timestamp: new Date().toISOString(),
            data: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
          }),
        },
      ],
    });

    logger.info({ userId: user.id }, '[auth-service] Published user.registered event');
  } catch (err) {
    // Log but do NOT rethrow — registration response must succeed even if Kafka is down
    logger.error({ err }, '[auth-service] Failed to publish user.registered event');
  }
};

module.exports = { publishUserRegistered };
