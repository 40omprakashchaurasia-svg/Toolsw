TOOLSWa — PUBLIC BUILD (VITE)

TOOLS
- PDF Merge
- PDF Split
- PDF Compress (Ghostscript WebAssembly, Low / Recommended / High)
- Image Resizer
- Word Counter

IMPORTANT PDF COMPRESSOR DETAILS
The compressor uses Ghostscript compiled to WebAssembly in the visitor's browser. PDF data is processed locally; the app does not send the selected PDF to a Toolswa server.
Compression levels map to Ghostscript presets:
- Low = /printer
- Recommended = /ebook
- High = /screen

Ghostscript's PDF writer generally keeps text as text, unlike the previous rasterizing approach. However, it can alter/remove some document features such as forms, annotations, signatures, bookmarks, metadata or advanced colour profiles. A modified PDF invalidates existing digital signatures. Always compare output with the original. No fixed compression percentage is guaranteed.

BUILD / DEPLOY TO NETLIFY
This is now a Vite project, not a ready-to-drag static folder.
1. Install Node.js 18 or newer.
2. Run: npm install
3. Run: npm run build
4. The deployable website is created in the dist folder.
5. Connect the project folder/repository to Netlify. Build command: npm run build. Publish directory: dist.
netlify.toml already contains these settings.

LICENSE WARNING
The Ghostscript WebAssembly dependency is identified as AGPL-3.0-or-later. Review LICENSE-NOTICE.txt and the exact package license files before public monetization/commercial launch. You may need to publish corresponding source or obtain a commercial license.

BEFORE PUBLIC LAUNCH
- Replace hello@toolswa.com with your real support email.
- Review Privacy Policy.
- Test with normal, scanned, encrypted, form-based and digitally signed PDFs.
- Test mobile browsers and large files.
- Do not advertise guaranteed compression or guaranteed preservation of every PDF feature.
