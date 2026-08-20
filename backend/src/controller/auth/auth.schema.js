const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email().min(6),
  password: z.string().min(6),
  name: z.string().min(2),
  profile: z.record(z.any()).optional(),
  privacy: z.record(z.any()).optional(),
});

const loginSchema = z.object({
  email: z.string().email().min(6),
  password: z.string().min(6),
  twoFactorCode: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
};
