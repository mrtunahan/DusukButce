const { z } = require('zod');

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ReceiptItemSchema = z.object({
  raw_name: z.string().min(1),
  unit_price: z.number().nonnegative(),
  quantity: z.number().positive(),
  line_total: z.number().nonnegative(),
  kdv_rate: z.union([z.literal(1), z.literal(10), z.literal(20)]),
});

const LLMReceiptSchema = z.object({
  market_name: z.string().nullable(),
  vkn: z.string().regex(/^\d{10,11}$/).nullable().optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  total_amount: z.number().positive().nullable(),
  items: z.array(ReceiptItemSchema),
});

module.exports = { RegisterSchema, LoginSchema, LLMReceiptSchema };
