'use strict';

const prisma = require('../config/database');

/**
 * Data access layer for auth entities.
 * Keeps all Prisma calls out of the service layer → easier to unit-test (mock this module).
 */

/**
 * Find a user by email address.
 * @param {string} email
 * @returns {Promise<import('@prisma/client').User | null>}
 */
const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

/**
 * Find a user by primary key (UUID).
 * @param {string} id
 * @returns {Promise<import('@prisma/client').User | null>}
 */
const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

/**
 * Create a new user record.
 * @param {{ email: string, password_hash: string, name: string, role?: string }} data
 * @returns {Promise<import('@prisma/client').User>}
 */
const createUser = async (data) => {
  return prisma.user.create({ data });
};

module.exports = { findUserByEmail, findUserById, createUser };
