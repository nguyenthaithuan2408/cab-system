'use strict';

const { z } = require('zod');

// ---------------------------------------------------------------------------
// Password policy (Priority 4 — strengthened validation)
// Requires: min 8 chars, ≥1 uppercase, ≥1 digit, ≥1 special character.
// NOTE: update test fixture passwords to comply (e.g. "Password@123").
// ---------------------------------------------------------------------------
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['USER', 'DRIVER', 'ADMIN']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  // Login uses a relaxed password check — we delegate wrong-password logic to bcrypt
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
