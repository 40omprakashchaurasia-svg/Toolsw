(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const statusBox = $("#status");

  function showStatus(message) {
    if (statusBox) statusBox.textContent = message;
  }

  function setTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    try { localStorage.setItem("toolswa-dark", String(isDark)); } catch (_) { /* Storage may be blocked. */ }
  }

  try {
    if (localStorage.getItem("toolswa-dark") === "true") document.body.classList.add("dark");
  } catch (_) { /* Continue without saved theme preference. */ }

  $(".theme")?.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function getPdfLib() {
    if (!window.PDFLib?.PDFDocument) {
      throw new Error("PDF library load नहीं हुई। Internet connection जाँचें और पेज refresh करें।");
    }
    return window.PDFLib.PDFDocument;
  }

  function getSelectedFile(selector) {
    const file = $(selector)?.files?.[0];
    if (!file) throw new Error("पहले फ़ाइल चुनें।");
    return file;
  }

  async function runTool(action) {
    const button = $("#run");
    if (!button) return;
    button.disabled = true;
    showStatus("प्रोसेसिंग…");
    try {
      await action();
    } catch (error) {
      console.error(error);
      showStatus(error?.message || "काम पूरा नहीं हुआ। फ़ाइल जाँचकर फिर कोशिश करें।");
    } finally {
      button.disabled = false;
    }
  }

  const currentTool = document.body.dataset.tool;

  if (currentTool === "merge") {
    $("#run")?.addEventListener("click", () => runTool(async () => {
      const files = [...($("#files")?.files || [])];
      if (files.length < 2) throw new Error("कम से कम दो PDF फ़ाइलें चुनें।");
      const PDFDocument = getPdfLib();
      const output = await PDFDocument.create();
      for (const file of files) {
        if (file.type && file.type !== "application/pdf") throw new Error(`${file.name} PDF फ़ाइल नहीं है।`);
        const source = await PDFDocument.load(await file.arrayBuffer());
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      const bytes = await output.save({ useObjectStreams: true });
      saveBlob(new Blob([bytes], { type: "application/pdf" }), "toolswa-merged.pdf");
      showStatus(`${files.length} PDF फ़ाइलें merge हो गईं। डाउनलोड शुरू हो गया है।`);
    }));
  }

  if (currentTool === "split") {
    $("#run")?.addEventListener("click", () => runTool(async () => {
      const PDFDocument = getPdfLib();
      const file = getSelectedFile("#file");
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pageText = $("#pages")?.value.trim() || "";
      if (!pageText) throw new Error("निकालने वाले पेज लिखें, जैसे: 1, 3-5");

      const selectedPages = new Set();
      for (const part of pageText.split(",")) {
        const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) throw new Error("पेज इस format में लिखें: 1, 3-5");
        const start = Number(match[1]);
        const end = Number(match[2] || match[1]);
        if (start < 1 || end < start || end > source.getPageCount()) {
          throw new Error(`पेज नंबर 1 से ${source.getPageCount()} के बीच होना चाहिए।`);
        }
        for (let page = start; page <= end; page += 1) selectedPages.add(page - 1);
      }

      const output = await PDFDocument.create();
      const indexes = [...selectedPages].sort((a, b) => a - b);
      const pages = await output.copyPages(source, indexes);
      pages.forEach((page) => output.addPage(page));
      const bytes = await output.save({ useObjectStreams: true });
      saveBlob(new Blob([bytes], { type: "application/pdf" }), "toolswa-split.pdf");
      showStatus(`${pages.length} पेज की PDF तैयार है। डाउनलोड शुरू हो गया है।`);
    }));
  }

  if (currentTool === "resize") {
    $("#run")?.addEventListener("click", () => runTool(async () => {
      const file = getSelectedFile("#file");
      if (!file.type.startsWith("image/")) throw new Error("कृपया image फ़ाइल चुनें।");
      const objectUrl = URL.createObjectURL(file);
      try {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error("Image पढ़ी नहीं जा सकी। दूसरी image चुनें।"));
          image.src = objectUrl;
        });

        let width = Number($("#width")?.value);
        let height = Number($("#height")?.value);
        if (!width && !height) throw new Error("नई width या height डालें।");

        if ($("#keep")?.checked) {
          if (width && !height) height = Math.round(image.height * width / image.width);
          else if (height && !width) width = Math.round(image.width * height / image.height);
          else if (width && height) {
            const ratio = Math.min(width / image.width, height / image.height);
            width = Math.round(image.width * ratio);
            height = Math.round(image.height * ratio);
          }
        } else {
          width ||= image.width;
          height ||= image.height;
        }

        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12000 || height > 12000) {
          throw new Error("Width और height 1 से 12000 px के बीच पूरी संख्या में रखें।");
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("इस browser में Canvas उपलब्ध नहीं है।");
        context.drawImage(image, 0, 0, width, height);

        const format = $("#format")?.value || "image/jpeg";
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, 0.9));
        if (!blob) throw new Error("Image export नहीं हो सकी। दूसरा format चुनें।");

        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[format] || "jpg";
        saveBlob(blob, `toolswa-resized.${extension}`);
        showStatus(`Image ${width} × ${height} px में तैयार है। डाउनलोड शुरू हो गया है।`);
        canvas.width = 1;
        canvas.height = 1;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }));
  }

  if (currentTool === "words") {
    const textInput = $("#text");
    const updateCounts = () => {
      const raw = textInput?.value || "";
      const trimmed = raw.trim();
      $("#wc").textContent = trimmed ? (trimmed.match(/\S+/gu) || []).length : 0;
      $("#cc").textContent = raw.length;
      $("#nc").textContent = [...raw].filter((character) => !/\s/u.test(character)).length;
      $("#sc").textContent = (trimmed.match(/[.!?।]+(?=\s|$)/gu) || []).length;
      $("#pc").textContent = trimmed ? trimmed.split(/\n\s*\n/u).filter((part) => part.trim()).length : 0;
    };
    textInput?.addEventListener("input", updateCounts);
    updateCounts();
  }
})();
