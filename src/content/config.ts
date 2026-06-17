import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postCollection = defineCollection({
  // Glob loader picks up every locale variant under each article folder,
  // including AI-generated `*.auto.md` fallbacks. Entry id looks like
  // `product-thinking-macbook-neo/zh` or `.../en.auto`; slug + locale +
  // isAuto are parsed from the id by helpers in `src/helpers/posts.ts`.
  // Custom generateId keeps the raw `<slug>/<locale>[.auto]` path: the default
  // slugifies `en.auto` → `en-auto`, which would break `.auto` detection.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/post',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z
    .object({
      /** Title */
      title: z.string(),
      /** Description */
      description: z.string().optional(),
      /** Tags */
      tags: z.array(z.string()).optional(),
      /** Whether it's a draft */
      draft: z.boolean().optional(),
      /** Publish date (required when not draft) */
      pubDate: z.coerce.date().optional(),
    })
    .refine(
      (data) => {
        // If it is a draft, then pubDate is not required; otherwise, it is mandatory.
        if (data.draft === true) {
          return true;
        }
        return data.pubDate !== undefined;
      },
      {
        message: 'When draft is false, publicDate is required',
        path: ['publicDate'],
      },
    ),
});

export const collections = { post: postCollection };
