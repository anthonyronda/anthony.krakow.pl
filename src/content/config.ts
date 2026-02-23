import { defineCollection, z } from 'astro:content';

const noteSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  related: z.array(z.string()).default([]),
});

export const collections = {
  en: defineCollection({ type: 'content', schema: noteSchema }),
  pl: defineCollection({ type: 'content', schema: noteSchema }),
};
