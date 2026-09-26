import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Tutti i testi del sito vivono in src/content/ come file Markdown.
 * - sito.md          → impostazioni globali (nome, SEO, contatti)
 * - sezioni/*.md     → le sezioni della home, una per file (ordine con `order`)
 * - progetti/*.md    → i casi di lavoro mostrati nella sezione `projects`
 */

const link = z.object({ label: z.string(), href: z.string() });

const base = {
  order: z.number(),
  enabled: z.boolean().default(true),
  /** Etichetta nel menu: se assente la sezione non compare nella navigazione */
  navLabel: z.string().optional(),
  /** Piccola etichetta sopra il titolo, es. "Chi sono" */
  kicker: z.string().optional(),
  title: z.string().optional(),
  /** "light" inverte i colori della pagina quando la sezione è in vista */
  theme: z.enum(['dark', 'light']).default('dark'),
};

const sezioni = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/sezioni' }),
  schema: z.discriminatedUnion('layout', [
    z.object({
      ...base,
      layout: z.literal('hero'),
      headline: z.array(z.string()),
      intro: z.string(),
      meta: z.array(z.string()).default([]),
      cta: link.optional(),
    }),
    z.object({
      ...base,
      layout: z.literal('marquee'),
      items: z.array(z.string()),
    }),
    z.object({
      ...base,
      layout: z.literal('about'),
      stats: z.array(z.object({ value: z.coerce.string(), label: z.string() })).default([]),
      interestsTitle: z.string().default('Fuori orario'),
      interests: z.array(z.string()).default([]),
    }),
    z.object({
      ...base,
      layout: z.literal('timeline'),
      items: z.array(
        z.object({ period: z.coerce.string(), company: z.string(), role: z.string(), note: z.string().optional() }),
      ),
    }),
    z.object({
      ...base,
      layout: z.literal('principles'),
      quotes: z.array(z.object({ text: z.string(), note: z.string().optional() })),
    }),
    z.object({
      ...base,
      layout: z.literal('projects'),
      stackTitle: z.string().optional(),
      stack: z.array(z.string()).default([]),
    }),
    z.object({
      ...base,
      layout: z.literal('skills'),
      groups: z.array(z.object({ title: z.string(), items: z.array(z.string()) })),
    }),
    z.object({
      ...base,
      layout: z.literal('list'),
      items: z.array(z.object({ title: z.string(), text: z.string(), tag: z.coerce.string().optional() })),
    }),
    z.object({
      ...base,
      layout: z.literal('contact'),
      email: z.string(),
      links: z.array(link).default([]),
    }),
  ]),
});

const progetti = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/progetti' }),
  schema: z.object({
    order: z.number(),
    enabled: z.boolean().default(true),
    title: z.string(),
    period: z.coerce.string(),
    area: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

const sito = defineCollection({
  loader: glob({ pattern: 'sito.md', base: './src/content' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    location: z.string(),
    timezone: z.string().default('Europe/Rome'),
    seoTitle: z.string(),
    seoDescription: z.string(),
    url: z.string().url(),
    preloaderWords: z.array(z.string()).default([]),
    footerNote: z.string().optional(),
  }),
});

export const collections = { sezioni, progetti, sito };
