import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const research = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    ticker: z.string().optional(),
    sector: z.string().optional(),
    rating: z.string().optional(),
    priceTarget: z.string().optional(),
    takeaway: z.string().optional(),
    order: z.number().optional(),
    updated: z.boolean().optional(),
    draft: z.boolean().default(true),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    order: z.number().optional(),
    draft: z.boolean().default(true),
  }),
});

const venture = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/venture' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    sector: z.string().optional(),
    takeaway: z.string().optional(),
    stage: z.string().optional(),
    order: z.number().optional(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { research, writing, venture };
