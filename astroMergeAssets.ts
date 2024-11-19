import type { AstroIntegration } from 'astro'
import { readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { extname, join } from 'path'

async function getFolderFiles(folderPath: string, extensions: Array<string>) {
  const files: Array<{
    name: string
    path: string
    ext: string
    content: string
  }> = []

  async function traverseDir(currentPath: string) {
    const leafs = await readdir(currentPath)

    for (const leaf of leafs) {
      const leafPath = join(currentPath, leaf)
      const stats = await stat(leafPath)

      if (stats.isDirectory()) {
        await traverseDir(leafPath)
      } else if (extensions.find((e) => leaf.endsWith(e))) {
        const content = await readFile(leafPath, 'utf-8')

        files.push({
          name: leaf,
          path: leafPath,
          ext: extname(leaf),
          content: content,
        })
      }
    }
  }
  await traverseDir(folderPath)

  return files
}

export function astroMergeAssets() {
  let counter = 0

  const scriptName = '__SCRIPT__'
  const styleName = '__STYLE__'

  const integration: AstroIntegration = {
    name: 'astro-merge-assets',
    hooks: {
      'astro:config:setup': async (e) => {
        e.config.build.assets = '_astro'

        e.config.vite.build = {
          ...e.config.vite.build,
          assetsInlineLimit: 0,
          rollupOptions: {
            output: {
              manualChunks: () => {
                return 'KOSTYL'
              },

              entryFileNames: `_astro/${scriptName}.js`,

              assetFileNames() {
                return `_astro/${styleName}${counter++}.css`
              },
            },
          },
        }
      },
      'astro:build:generated': async (e) => {
        const astroDir = e.dir.pathname + '_astro'
        const chunksDir = e.dir.pathname + 'chunks'

        await rm(chunksDir, {
          force: true,
          recursive: true,
        })

        const files = await getFolderFiles(e.dir.pathname, [
          'html',
          'js',
          'css',
        ])

        const cssFiles = files.filter((file) => file.ext === '.css').reverse()
        const htmlFiles = files.filter((file) => file.ext === '.html')
        const jsFiles = files.filter((file) => file.ext === '.js')

        const mainJSFIle = jsFiles.find(
          (file) => file.name === `${scriptName}.js`,
        )!

        const js = mainJSFIle.content

        for await (const element of jsFiles) {
          await rm(element.path)
        }

        let css = ''

        for await (const cssFile of cssFiles) {
          css += cssFile.content

          await rm(cssFile.path)
        }

        await writeFile(`${astroDir}/style.css`, css)
        await writeFile(`${astroDir}/script.js`, js)

        for await (const htmlFile of htmlFiles) {
          jsFiles.forEach((file) => {
            htmlFile.content = htmlFile.content.replace(file.name, 'script.js')
          })

          let styleCounter = 0
          cssFiles.forEach((file) => {
            const oldLinkRegex = new RegExp(
              `(<link\\s+rel=["']stylesheet["']\\s+href=["'][^"']*)${file.name}(["']\\s*/?>)`,
              'gs',
            )

            if (styleCounter === 0) {
              htmlFile.content = htmlFile.content.replace(
                oldLinkRegex,
                (_, p1, p2) => {
                  return `${p1}style.css${p2}`
                },
              )
            } else {
              htmlFile.content = htmlFile.content.replace(oldLinkRegex, '')
            }

            styleCounter++
          })

          await writeFile(htmlFile.path, htmlFile.content)
        }
      },
    },
  }

  return integration
}
