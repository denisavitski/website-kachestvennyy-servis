// @ts-check
import { defineConfig } from 'astro/config'
import { astroMergeAssets } from './astroMergeAssets'
import { loadEnv } from 'vite'
import { rm } from 'fs/promises'

// https://astro.build/config
const { PUBLIC_DOMAIN } = loadEnv(process.env.NODE_ENV || '', process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  site: `https://${PUBLIC_DOMAIN || 'my-site'}/`,

  output: 'static',

  integrations: [
    {
      name: 'remove components',
      hooks: {
        'astro:build:generated': (e) => {
          return rm(`${e.dir.pathname}/ui`, {
            force: true,
            recursive: true,
          })
        },
      },
    },
    astroMergeAssets(),
  ],

  devToolbar: {
    enabled: false,
  },

  build: {
    inlineStylesheets: 'never',
  },
})
