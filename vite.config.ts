import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import $monacoEditorPlugin from 'vite-plugin-monaco-editor';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'node:fs';
import path from 'node:path';

const monacoEditorPlugin = ($monacoEditorPlugin as any).default ?? $monacoEditorPlugin;

// Check if the custom extension task is running
// @ts-ignore
const isExtensionBuild = process.env.BUILD_AS_EXTENSION === 'true';

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({

      languageWorkers: ['editorWorkerService', 'json'],
      customWorkers: [
        {
          label: 'graphql',
          entry: 'monaco-graphql/esm/graphql.worker.js',
        },
      ],
    }),
    {
      name: 'copy-extension-files-native',
      closeBundle() {
        if (!isExtensionBuild) return;

        const outDir =  this.environment?.config?.build?.outDir || 'dist';

        // Define exact source paths and exact destination paths
        const filesToCopy = [
          {
            src: path.resolve(__dirname, 'extension/background.js'),
            dest: path.resolve(outDir, 'background.js')
          },
          {
            src: path.resolve(__dirname, 'extension/manifest.json'),
            dest: path.resolve(outDir, 'manifest.json')
          }
        ];

        filesToCopy.forEach(({ src, dest }) => {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          } else {
            console.error(`Error: Source file not found at ${src}`);
          }
        });
      }
    },
    {
      name: 'move-monaco-editor-workers-def',
      closeBundle() {
        const outDir = this.environment?.config?.build?.outDir || path.resolve(__dirname, 'dist');

        // Get the output directory (defaults to 'dist')
        const htmlPath = path.resolve(outDir, 'index.html');

        // Ensure index.html actually exists before proceeding
        if (!fs.existsSync(htmlPath)) {
          console.warn('move-monaco-editor-workers-def: index.html not found.');
          return;
        }

        let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        // Regex to target the first <script> tag inside the <head>
        // This captures the opening tag, attributes, the inner content, and the closing tag
        const scriptRegex = /<head>[\s\S]*?(<script\b[^>]*>([\s\S]*?)<\/script>)/i;
        const match = htmlContent.match(scriptRegex);

        if (match) {
          const fullScriptTag = match[1]; // The entire <script>...</script> block
          const scriptCode = match[2];     // Just the JavaScript inside

          // 1. Remove the script tag from the HTML content
          htmlContent = htmlContent.replace(fullScriptTag, '');
          fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
          console.log('✓ Successfully removed the first script tag from index.html head.');

          // 2. Write the extracted code to monaco-workers.js in the root output dir
          const workerPath = path.resolve(outDir, 'monaco-workers.js');
          fs.writeFileSync(workerPath, scriptCode, 'utf-8');
          console.log(`✓ Successfully created ${workerPath}`);
        } else {
          console.warn('move-monaco-editor-workers-def: No script tag found inside <head>.');
        }
      },
    }
    // // Conditionally apply the copy plugin only for the extension build
    // ...(isExtensionBuild
    //     ? [
    //       viteStaticCopy({
    //         targets: [
    //           {
    //             src: 'extension/background.js',
    //             dest: '.',
    //             rename: 'background.js'
    //           },
    //           {
    //             src: 'extension/manifest.json',
    //             dest: '.',
    //             rename: 'manifest.json'
    //           },
    //           // If your icons are in a root folder instead of public/, copy them here too:
    //           // { src: 'icons', dest: '.' }
    //         ],
    //       }),
    //     ]
    //     : []),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'mixed-decls',
          'color-functions',
          'global-builtin',
        ],
      },
    },
  },
});
