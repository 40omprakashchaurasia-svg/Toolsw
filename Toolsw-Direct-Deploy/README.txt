TOOLSWa — DIRECT NETLIFY DEPLOY (STATIC SITE)

This package is prepared for Netlify manual drag-and-drop deployment.
It does NOT need npm, Vite, a build command, or a dist folder.

TOOLS INCLUDED
1. PDF Merge — combines multiple PDFs.
2. PDF Split — extracts selected pages/page ranges.
3. Basic PDF Optimize — re-saves a PDF and reports the size difference.
   This does NOT recompress embedded images and cannot guarantee a smaller file.
4. Image Resizer — resize/export JPG, PNG and WebP.
5. Word Counter — words, characters, sentences and paragraphs.

DIRECT DEPLOY STEPS
1. Extract this ZIP on your computer.
2. Open the extracted folder named Toolsw-Direct-Deploy.
3. Confirm that index.html, style.css, tool.js and netlify.toml are visible together.
4. In Netlify, open your EXISTING Toolswa site and go to the Deploys page.
5. Drag the extracted Toolsw-Direct-Deploy folder (not the ZIP file) into the
   manual deploy/drop area. Netlify will publish this static folder as the new
   current version of the same site.
6. Open the live site and test all five tools using copies of sample files.

IMPORTANT
- Do NOT delete your existing Netlify site. Deploying this folder to the same
  site replaces the live website content. Previous deploys may remain in history.
- Do NOT use the old Vite build settings (npm run build / dist) for this manual
  drag-and-drop package. It is already a static publish folder.
- PDF Merge, PDF Split and Basic PDF Optimize load pdf-lib from jsDelivr CDN.
  The visitor needs an internet connection for those PDF tools to load.
- This Basic PDF Optimize page does not perform Ghostscript/image compression.
  It only re-saves the PDF structure and skips downloading when the result is
  not smaller. A full image-aware compressor requires a separately built and
  tested Ghostscript WebAssembly bundle.
- Your selected files are processed in the browser, not uploaded to a Toolswa
  processing server by this site's code.
- Replace hello@toolswa.com with your real support address before launch.
- Review LICENSE-NOTICE.txt and privacy/legal text before monetizing.

TROUBLESHOOTING
- If a PDF tool says the library did not load, check internet/CDN access and
  refresh the page.
- If an old page is still visible, open the latest successful deploy URL and
  hard-refresh the site (Ctrl+Shift+R).
- Keep your original PDFs; modified documents may not preserve every feature.
