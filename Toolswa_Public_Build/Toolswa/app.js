const $ = s => document.querySelector(s);
const workspace = $("#workspace"), toolBody = $("#toolBody"), statusBox = $("#status");
$("#year").textContent = new Date().getFullYear();

// Theme persists across visits and is applied on the whole single-page site.
const savedTheme = localStorage.getItem("toolswa-theme");
if (savedTheme === "dark") document.body.classList.add("dark");
function syncThemeButton(){
  const dark = document.body.classList.contains("dark");
  $("#themeToggle").textContent = dark ? "☀" : "☾";
  $("#themeToggle").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}
syncThemeButton();
$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("toolswa-theme", document.body.classList.contains("dark") ? "dark" : "light");
  syncThemeButton();
});

// Three-dot menu.
const menu = $("#moreMenu"), menuBtn = $("#moreMenuBtn");
menuBtn.addEventListener("click", e => {
  e.stopPropagation(); menu.classList.toggle("hidden");
  menuBtn.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
});
document.addEventListener("click", e => {
  if (!e.target.closest(".menu-wrap")) { menu.classList.add("hidden"); menuBtn.setAttribute("aria-expanded","false"); }
});
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => menu.classList.add("hidden")));

// Search and category filters work together.
let activeCategory = "all";
function filterTools(){
  const q = $("#toolSearch").value.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll(".tool-card").forEach(card => {
    const matchText = `${card.dataset.search} ${card.innerText}`.toLowerCase().includes(q);
    const matchCategory = activeCategory === "all" || card.dataset.category === activeCategory;
    const visible = matchText && matchCategory;
    card.classList.toggle("hidden", !visible);
    if (visible) shown++;
  });
  $("#noResults").classList.toggle("hidden", shown !== 0);
}
$("#toolSearch").addEventListener("input", filterTools);
document.querySelectorAll(".category-chip").forEach(chip => chip.addEventListener("click", () => {
  document.querySelectorAll(".category-chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active"); activeCategory = chip.dataset.category; filterTools();
}));
document.addEventListener("keydown", e => {
  if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) { e.preventDefault(); $("#toolSearch").focus(); }
  if (e.key === "Escape") { menu.classList.add("hidden"); menuBtn.setAttribute("aria-expanded","false"); }
});

$("#closeTool").addEventListener("click", () => { workspace.classList.add("hidden"); $("#tools").scrollIntoView({behavior:"smooth"}); });
document.querySelectorAll(".open-tool").forEach(btn => btn.addEventListener("click", () => openTool(btn.dataset.tool)));

function openTool(name){
  workspace.classList.remove("hidden"); statusBox.textContent = "";
  const titles = {merge:"PDF Merge",split:"PDF Split",compress:"PDF Compressor",resize:"Image Resizer",words:"Word Counter"};
  $("#toolTitle").textContent = titles[name] || "Tool";
  toolBody.innerHTML = templates[name]();
  workspace.scrollIntoView({behavior:"smooth",block:"start"});
  wireDropZones(name);
  wireTool(name);
}
function dropField(id, label, accept, multiple=false){
  return `<label class="drop-zone" for="${id}" data-drop="${id}"><strong>Drop ${multiple?"files":"a file"} here or click to browse</strong><small>${label}</small><input id="${id}" type="file" accept="${accept}" ${multiple?"multiple":""}></label><div class="file-list" id="${id}List">No file selected</div>`;
}
const templates = {
  merge:()=>`<p class="hint">Add at least two PDF files. Drag and drop is supported; files are merged in the order shown.</p>${dropField("files","PDF files · multiple files supported","application/pdf",true)}<button class="action" id="run">Merge PDFs</button>`,
  split:()=>`<p class="hint">Choose the pages to extract. Example: <b>1, 3-5</b>. Page numbers start at 1.</p>${dropField("file","One PDF file","application/pdf")}<label class="field">Pages to extract<input id="pages" type="text" placeholder="e.g. 1, 3-5"></label><button class="action" id="run">Extract pages</button>`,
  compress:()=>`<p class="hint">This tool re-saves the PDF using object streams. It may reduce structural overhead, but cannot guarantee a smaller file or recompress embedded images.</p>${dropField("file","One PDF file","application/pdf")}<button class="action" id="run">Optimize PDF</button>`,
  resize:()=>`${dropField("file","JPG, PNG, WebP or other browser-supported image","image/*")}<div class="two-col"><label class="field">Width (px)<input id="width" type="number" min="1" placeholder="e.g. 1200"></label><label class="field">Height (px)<input id="height" type="number" min="1" placeholder="e.g. 800"></label></div><label class="field"><input id="keep" type="checkbox" checked> Keep aspect ratio</label><label class="field">Output format<select id="format"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><button class="action" id="run">Resize image</button>`,
  words:()=>`<p class="hint">Type or paste text, or drop a .txt file into the upload area to load its contents.</p><label class="field">Your text<textarea id="text" placeholder="Start typing or paste text here…"></textarea></label>${dropField("textFile","Optional plain-text file (.txt)","text/plain")}<div class="stats"><div class="stat"><b id="wc">0</b>Words</div><div class="stat"><b id="cc">0</b>Characters</div><div class="stat"><b id="sc">0</b>Sentences</div><div class="stat"><b id="pc">0</b>Paragraphs</div></div>`
};
function wireDropZones(name){
  const ids = name === "merge" ? ["files"] : name === "words" ? ["textFile"] : ["file"];
  ids.forEach(id => {
    const input = document.getElementById(id), zone = document.querySelector(`[data-drop="${id}"]`), list = document.getElementById(id+"List");
    if (!input || !zone) return;
    const update = () => { const files=[...input.files]; list.textContent = files.length ? files.map(f=>`${f.name} (${formatBytes(f.size)})`).join(" · ") : "No file selected"; };
    input.addEventListener("change", update);
    ["dragenter","dragover"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add("dragover");}));
    ["dragleave","drop"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove("dragover");}));
    zone.addEventListener("drop",e=>{
      const dropped=[...e.dataTransfer.files];
      const accepted=name==="words" ? dropped.filter(f=>f.type==="text/plain"||f.name.toLowerCase().endsWith(".txt")) : name==="merge" ? dropped.filter(f=>f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf")) : name==="resize" ? dropped.filter(f=>f.type.startsWith("image/")) : dropped.filter(f=>f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf"));
      if (!accepted.length) { statusBox.textContent="इस टूल के लिए सही file type drop करें।"; return; }
      const dt=new DataTransfer();
      (name==="merge"?[...input.files,...accepted]:accepted).forEach(f=>dt.items.add(f));
      input.files=dt.files; update(); statusBox.textContent="";
      if(name==="words") loadTextFile(input.files[0]);
    });
  });
}
function formatBytes(n){if(n<1024)return n+" B";if(n<1048576)return (n/1024).toFixed(1)+" KB";return (n/1048576).toFixed(1)+" MB";}
function wireTool(name){
  if(name==="words"){
    const text=$("#text");
    const update=()=>{const raw=text.value, trimmed=raw.trim();$("#wc").textContent=trimmed?(trimmed.match(/\S+/gu)||[]).length:0;$("#cc").textContent=raw.length;$("#sc").textContent=(trimmed.match(/[.!?]+(?=\s|$)/gu)||[]).length;$("#pc").textContent=trimmed?trimmed.split(/\n\s*\n/u).filter(x=>x.trim()).length:0;};
    text.addEventListener("input",update);
    $("#textFile").addEventListener("change",()=>loadTextFile($("#textFile").files[0]));
    return;
  }
  $("#run").addEventListener("click",async()=>{
    const btn=$("#run");btn.disabled=true;statusBox.textContent="Processing…";
    try{
      if(name!=="resize"&&!window.PDFLib) throw Error("PDF library load नहीं हुई। इंटरनेट कनेक्शन जाँचकर पेज रीफ्रेश करें।");
      if(name==="merge") await mergePDF();
      if(name==="split") await splitPDF();
      if(name==="compress") await compressPDF();
      if(name==="resize") await resizeImage();
    }catch(err){statusBox.textContent=err.message||"Processing में समस्या आई। फ़ाइल जाँचकर दोबारा कोशिश करें।";}
    finally{btn.disabled=false;}
  });
}
async function loadTextFile(file){if(!file)return;$("#text").value=await file.text();$("#text").dispatchEvent(new Event("input"));}
async function getBytes(file){if(!file)throw Error("पहले फ़ाइल चुनें या drag-and-drop करें।");return new Uint8Array(await file.arrayBuffer());}
function download(bytes,name,type="application/pdf"){const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function mergePDF(){
  const files=[...$("#files").files];if(files.length<2)throw Error("कम से कम दो PDF files चुनें।");
  const out=await PDFLib.PDFDocument.create();
  for(const f of files){const src=await PDFLib.PDFDocument.load(await getBytes(f));const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}
  download(await out.save(),"toolswa-merged.pdf");statusBox.textContent=`${files.length} PDF files merge हो गईं।`;
}
function parsePages(value,total){
  const selected=new Set();
  for(const part of value.split(",")){
    const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error("Pages इस format में लिखें: 1, 3-5");
    const start=Number(m[1]),end=Number(m[2]||m[1]);if(start<1||end<start||end>total)throw Error(`Page number 1 से ${total} के बीच होना चाहिए।`);
    for(let p=start;p<=end;p++)selected.add(p-1);
  }
  if(!selected.size)throw Error("कम से कम एक page number डालें।");
  return [...selected].sort((a,b)=>a-b);
}
async function splitPDF(){
  const src=await PDFLib.PDFDocument.load(await getBytes($("#file").files[0]));const indexes=parsePages($("#pages").value,src.getPageCount());
  const out=await PDFLib.PDFDocument.create();const pages=await out.copyPages(src,indexes);pages.forEach(p=>out.addPage(p));
  download(await out.save(),"toolswa-split.pdf");statusBox.textContent=`${indexes.length} page extract होकर डाउनलोड हो रहे हैं।`;
}
async function compressPDF(){
  const src=await PDFLib.PDFDocument.load(await getBytes($("#file").files[0]));const bytes=await src.save({useObjectStreams:true});
  download(bytes,"toolswa-optimized.pdf");statusBox.textContent="PDF फिर से सेव हो गई। File size कम होने की गारंटी नहीं है।";
}
async function resizeImage(){
  const file=$("#file").files[0];if(!file)throw Error("पहले image चुनें या drag-and-drop करें।");
  const url=URL.createObjectURL(file),img=new Image();
  try{
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("Image पढ़ी नहीं जा सकी।"));img.src=url;});
    let w=Number($("#width").value),h=Number($("#height").value);if(!w&&!h)throw Error("नई width या height डालें।");
    if($("#keep").checked){if(w&&!h)h=Math.round(img.height*w/img.width);else if(h&&!w)w=Math.round(img.width*h/img.height);else if(w&&h){const ratio=Math.min(w/img.width,h/img.height);w=Math.round(img.width*ratio);h=Math.round(img.height*ratio);}}
    else{w=w||img.width;h=h||img.height;}
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>10000||h>10000)throw Error("Width और height 1 से 10000 px के बीच रखें।");
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas उपलब्ध नहीं है।");ctx.drawImage(img,0,0,w,h);
    const type=$("#format").value;const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,.9));if(!blob)throw Error("Image export नहीं हो सकी।");
    const ext=type==="image/png"?"png":type==="image/webp"?"webp":"jpg";download(await blob.arrayBuffer(),`toolswa-resized.${ext}`,type);statusBox.textContent=`Image ${w} × ${h} px में तैयार है।`;
  }finally{URL.revokeObjectURL(url);}
}
