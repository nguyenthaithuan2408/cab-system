const { z } = require('zod');

// Schema for Login Request
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  })
});

// Schema for Register Request
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['CUSTOMER', 'DRIVER']).optional(), // Disallow registering as ADMIN via public API
    name: z.string().min(2, 'Name must be at least 2 characters long')
  })
});

module.exports = {
  loginSchema,
  registerSchema
};
