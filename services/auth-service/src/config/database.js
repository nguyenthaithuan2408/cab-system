'use strict';

const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client singleton.
 * Prevents multiple instances during hot-reload in development,
 * and avoids connection pool exhaustion when multiple modules import this.
 */
const globalWithPrisma = global;

const prisma =
  globalWithPrisma.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.__prisma = prisma;
}

module.exports = prisma;
