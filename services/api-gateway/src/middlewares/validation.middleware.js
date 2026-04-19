const { ZodError } = require('zod');

/**
 * Validation Middleware wrapper
 * Dropping requests at Gateway level if schema validation fails
 */
const validateResult = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation Failed',
        errors: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(500).json({ message: 'Internal Validation Error' });
  }
};

module.exports = {
  validateResult
};
