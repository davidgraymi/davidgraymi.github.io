// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import csp from './src/lib/csp-integration.mjs';
import rehypeProse from './src/lib/rehype-prose.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://davidmgray.com',
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/design-system') }),
    // Must run last: it hashes the final HTML. Wordlet is Flutter's own build.
    csp({ skip: ['wordlet'] }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypeProse],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: true,
    },
  },
});

