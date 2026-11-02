(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const button = $("#run");
  const status = $("#status");
  const bytesLabel = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  function downloadPdf(data, filename) {
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  button?.addEventListener("click", async () => {
    const file = $("#file")?.files?.[0];
    if (!file) { status.textContent = "पहले PDF फ़ाइल चुनें।"; return; }
    if (!window.PDFLib?.PDFDocument) {
      status.textContent = "PDF library load नहीं हुई। Internet connection जाँचें और पेज refresh करें।";
      return;
    }

    button.disabled = true;
    $("#results")?.classList.add("hidden");
    status.textContent = "PDF की संरचना optimize की जा रही है…";
    try {
      const PDFDocument = window.PDFLib.PDFDocument;
      const document = await PDFDocument.load(await file.arrayBuffer());
      const output = await document.save({ useObjectStreams: true });
      const originalSize = file.size;
      const optimizedSize = output.byteLength;
      const difference = originalSize - optimizedSize;
      const percent = originalSize ? Math.abs(difference) / originalSize * 100 : 0;

      $("#original").textContent = bytesLabel(originalSize);
      $("#compressed").textContent = bytesLabel(optimizedSize);
      $("#change").textContent = difference >= 0
        ? `${percent.toFixed(1)}% smaller`
        : `${percent.toFixed(1)}% larger`;
      $("#results")?.classList.remove("hidden");

      if (optimizedSize < originalSize) {
        downloadPdf(output, "toolswa-optimized.pdf");
        status.textContent = "Basic optimization पूरी हुई। नई PDF डाउनलोड हो रही है।";
      } else {
        status.textContent = "इस फ़ाइल का आकार कम नहीं हुआ। कोई छोटी फ़ाइल बनने की गारंटी नहीं है; डाउनलोड नहीं किया गया।";
      }
    } catch (error) {
      console.error(error);
      status.textContent = error?.message || "PDF optimize नहीं हुई। फ़ाइल encrypted या damaged हो सकती है।";
    } finally {
      button.disabled = false;
    }
  });

  try { if (localStorage.getItem("toolswa-dark") === "true") document.body.classList.add("dark"); } catch (_) {}
  document.querySelector(".theme")?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    try { localStorage.setItem("toolswa-dark", document.body.classList.contains("dark")); } catch (_) {}
  });
})();
