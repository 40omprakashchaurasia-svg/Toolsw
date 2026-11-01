import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        merge: resolve(__dirname, "pdf-merge.html"),
        split: resolve(__dirname, "pdf-split.html"),
        compress: resolve(__dirname, "pdf-compress.html"),
        resize: resolve(__dirname, "image-resizer.html"),
        words: resolve(__dirname, "word-counter.html"),
        about: resolve(__dirname, "about.html"),
        contact: resolve(__dirname, "contact.html"),
        privacy: resolve(__dirname, "privacy.html")
      }
    }
  }
});
