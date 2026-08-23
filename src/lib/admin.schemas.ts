// Client-safe validation schemas for the admin server functions.
import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  care_instructions: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  base_price: z.number().nonnegative(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  variants: z.array(z.object({
    id: z.string().uuid().optional(),
    label: z.string().min(1),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    sort_order: z.number().int().default(0),
  })).default([]),
});

export const discountSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  kind: z.enum(["percent", "fixed"]),
  amount: z.number().positive(),
  max_uses: z.number().int().positive().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  accent: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
});
