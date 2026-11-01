import { load } from "@wasm-zoo/ghostscript";

const $ = (s) => document.querySelector(s);
const button = $("#run");
const status = $("#status");
const bytesLabel = (n) => n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
let enginePromise;

function getEngine() {
  if (!enginePromise) enginePromise = load();
  return enginePromise;
}
function download(data, filename) {
  const blob = new Blob([data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

button.addEventListener("click", async () => {
  const file = $("#file").files[0];
  if (!file) {
    status.textContent = "पहले PDF फ़ाइल चुनें।";
    return;
  }
  const level = document.querySelector('input[name="level"]:checked')?.value || "ebook";
  button.disabled = true;
  $("#results").classList.add("hidden");
  status.textContent = "Compression engine लोड हो रहा है… पहली बार थोड़ा समय लग सकता है।";
  let gs;
  try {
    gs = await getEngine();
    status.textContent = "PDF compress हो रही है… इस टैब को बंद न करें।";
    const input = new Uint8Array(await file.arrayBuffer());
    const args = [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-dQUIET",
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.7",
      `-dPDFSETTINGS=/${level}`,
      "-dDetectDuplicateImages=true",
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-sOutputFile=/output.pdf",
      "/input.pdf"
    ];
    const result = await gs.exec(args, {
      files: [{ name: "/input.pdf", data: input }],
      outputs: ["/output.pdf"]
    });
    const output = result?.files?.find((f) => f.name === "/output.pdf")?.data || result?.files?.[0]?.data;
    if (!output || !output.byteLength) throw new Error("Ghostscript ने output PDF नहीं बनाई। फ़ाइल encrypted, damaged या unsupported हो सकती है।");
    const originalSize = file.size;
    const newSize = output.byteLength;
    const diff = originalSize - newSize;
    const pct = Math.abs(diff) / originalSize * 100;
    $("#original").textContent = bytesLabel(originalSize);
    $("#compressed").textContent = bytesLabel(newSize);
    $("#change").textContent = diff >= 0 ? `${pct.toFixed(1)}% smaller` : `${pct.toFixed(1)}% larger`;
    $("#results").classList.remove("hidden");
    download(output, "toolswa-compressed.pdf");
    status.textContent = diff >= 0
      ? "Compression पूरी हुई। नई PDF डाउनलोड हो रही है।"
      : "प्रोसेसिंग पूरी हुई, लेकिन नई PDF बड़ी है। Original PDF इस्तेमाल करना बेहतर होगा।";
  } catch (err) {
    console.error(err);
    status.textContent = err?.message || "Compression असफल हुई। दूसरी PDF से कोशिश करें।";
  } finally {
    button.disabled = false;
  }
});

if (localStorage.getItem("toolswa-dark") === "true") document.body.classList.add("dark");
document.querySelector(".theme")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("toolswa-dark", document.body.classList.contains("dark"));
});
