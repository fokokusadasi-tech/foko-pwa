const APP_VERSION = "1.0.0";
const UPDATE_DOWNLOAD_URL = "https://example.com/foko-latest.zip";
const LATEST_JSON_URL = "https://example.com/latest.json";

const $ = (sel)=>document.querySelector(sel);
const grid = $("#grid");
const editor = $("#editor");
const imagesEl = $("#images");
const modal = $("#modalBackdrop");
const aboutModal = $("#aboutBackdrop");
const modalTitle = $("#modalTitle");
const imgInput = $("#imgInput");
const versionText = $("#versionText");

let state = JSON.parse(localStorage.getItem("foko-state")||"null") || defaultState();
let currentKey = null;

function defaultState(){
  return {
    city: "KUŞADASI",
    sections: {
      LEFT: [
        ["CİLT/SAÇ BAKIM RUTİNLERİ", [
          "LEKE\nRUTİNİ","KIRIŞIKLIK\nRUTİNİ","SİVİLCE\nRUTİNİ","GÖZENEK/\nKOMEDON RUTİNİ",
          "HASSAS\nCİLTLER","KURU\nCİLTLER","YAĞLI\nCİLTLER","KARMA\nCİLTLER",
          "BOYALI SAÇLAR\nRUTİNİ","EGZAMA\nRUTİNİ","KEPEK\nRUTİNİ","DÖKÜLME\nRUTİNİ"
        ]],
        ["RETİNOL/RETİNAL\nKULLANIM REHBERİ (TEK)", ["RETİNOL/RETİNAL\nKULLANIM REHBERİ"]],
      ],
      MIDDLE: [
        ["SERUMLAR", [
          "C VİTAMİNİ","NİACİNAMİDE","ARBUTİN","TRANEXAMİC","PEPTİDE","ACN SERUM",
          "ATP SERUM","HYALURONIC\nACİD","HYALURONIC+B3","ARGİRELİNE %10",
          "HYALURONIC+C","ARGİRELİNE OİL","GLYCOLİC SERUM","AHA-BHA SERUM"
        ]],
        ["TONİKLER", ["BHA TONİK","AHA TONİK","AHA-BHA TONİK","ACN TONİK"]],
      ],
      RIGHT: [
        ["YÜZ YIKAMA JELLERİ", [
          "BHA YÜZ\nYIKAMA JELİ","CİLT TEMİZLEME\nYAĞI","ACN YÜZ\nYIKAMA JELİ","5.5 Ph\nYÜZ YIKAMA JELİ"
        ]],
        ["ŞAMPUANLAR", [
          "BOYALI SAÇLAR\nİÇİN ŞAMPUAN","YAĞLI SAÇLAR\nİÇİN ŞAMPUAN",
          "DÖKÜLME KARŞITI\nŞAMPUAN","SBR SERİSİ KEPEK\nKARŞITI ŞAMPUAN","ATP\nSIVI YIKAMA SABUNU"
        ]],
        ["DOĞAL YAĞLAR/SULAR", ["Avakado Yağı","Susam Yağı","Karanfil Yağı","Macadamid Yağı"]]
      ]
    },
    content: {}
  };
}
function save(){ localStorage.setItem("foko-state", JSON.stringify(state)); }

function render(){
  $("#city").textContent = state.city || "KUŞADASI";
  grid.innerHTML = "";
  ["LEFT","MIDDLE","RIGHT"].forEach(colKey=>{
    const col = document.createElement("div");
    state.sections[colKey].forEach(([title, buttons])=>{
      const sec = document.createElement("section");
      const h2 = document.createElement("h2"); h2.textContent = title; sec.appendChild(h2);
      const wrap = document.createElement("div"); wrap.className = "btn-grid";
      buttons.forEach(label=>{
        const b = document.createElement("button"); b.className = "cta"; b.textContent = label;
        b.addEventListener("click", ()=>openEditor(label)); wrap.appendChild(b);
      });
      sec.appendChild(wrap); col.appendChild(sec);
    });
    grid.appendChild(col);
  });
}

function openEditor(key){
  currentKey = key;
  const c = state.content[key] || { html: "Bu başlığa ait içerik henüz eklenmedi.", images: [] };
  modalTitle.textContent = key.replaceAll("\n"," ");
  editor.innerHTML = c.html || "";
  imagesEl.innerHTML = "";
  c.images.forEach(src=>{ const img=document.createElement("img"); img.src=src; imagesEl.appendChild(img); });
  modal.style.display = "flex";
}
function closeEditor(){ modal.style.display="none"; currentKey=null; }

document.querySelectorAll(".toolbar button[data-cmd]").forEach(btn=>{
  btn.addEventListener("click", ()=>document.execCommand(btn.dataset.cmd, false, null));
});
$("#colorPicker").addEventListener("input", (e)=>document.execCommand("foreColor", false, e.target.value));
$("#bulletBtn").addEventListener("click", ()=>document.execCommand("insertUnorderedList"));
$("#numberBtn").addEventListener("click", ()=>document.execCommand("insertOrderedList"));
$("#clearBtn").addEventListener("click", ()=>document.execCommand("removeFormat"));

$("#saveBtn").addEventListener("click", ()=>{
  if(!currentKey) return;
  const html = editor.innerHTML;
  const imgs = Array.from(imagesEl.querySelectorAll("img")).map(i=>i.src);
  state.content[currentKey] = { html, images: imgs };
  save(); alert("Kaydedildi ve varsayılan görünüm METİN olarak ayarlandı.");
});
$("#closeBtn").addEventListener("click", closeEditor);
$("#imgInput").addEventListener("change", (e)=>{
  const files = Array.from(e.target.files||[]);
  files.forEach(file=>{
    const fr = new FileReader();
    fr.onload = ()=>{ const img=document.createElement("img"); img.src=fr.result; imagesEl.appendChild(img); };
    fr.readAsDataURL(file);
  });
  e.target.value="";
});
$("#whatsBtn").addEventListener("click", ()=>{
  const text = editor.innerText.trim();
  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
});

function ensureHtml2Canvas(){
  if(window.html2canvas) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    s.onload=()=>resolve(); s.onerror=reject; document.head.appendChild(s);
  });
}
$("#pngBtn").addEventListener("click", async ()=>{
  await ensureHtml2Canvas();
  const tmp=document.createElement("div");
  tmp.style.padding="20px"; tmp.style.background="#fff"; tmp.style.color="#000"; tmp.style.width="800px";
  tmp.innerHTML = "<h3>"+(modalTitle.textContent||"")+"</h3>" + editor.innerHTML;
  document.body.appendChild(tmp);
  const canvas = await html2canvas(tmp); document.body.removeChild(tmp);
  const a=document.createElement("a"); a.download=(modalTitle.textContent||"icerik")+".png";
  a.href=canvas.toDataURL("image/png"); a.click();
});

$("#addSectionBtn").addEventListener("click", ()=>{
  const name = prompt("Yeni başlık adı:"); if(!name) return;
  const colPick = prompt("Hangi sütun? 1 / 2 / 3", "1")||"1";
  const col = colPick.startsWith("1")?"LEFT":colPick.startsWith("2")?"MIDDLE":"RIGHT";
  if(state.sections[col].some(([t])=>t.trim().toLowerCase()===name.trim().toLowerCase())){ alert("Bu isimde bir başlık zaten var."); return; }
  state.sections[col].push([name, []]); save(); render(); alert(`${colPick}. sütuna '${name}' eklendi.`);
});

// Single, correct rename handler
$("#renameSectionBtn").addEventListener("click", ()=>{
  const all=[]; const pos=[];
  ["LEFT","MIDDLE","RIGHT"].forEach(col=>{
    state.sections[col].forEach(([t,_],i)=>{ all.push(`${col} — ${t}`); pos.push([col,i,t]); });
  });
  if(!all.length){ alert("Düzenlenecek başlık yok."); return; }
  const pick = prompt("Düzenlenecek başlık numarasını girin:\n" + all.map((x,i)=>`${i+1}) ${x}`).join("\n"), "1");
  if(!pick) return;
  const idx = parseInt(pick,10)-1; if(isNaN(idx)||idx<0||idx>=all.length) return;
  const [col,i,old] = pos[idx];
  const nn = prompt(`Yeni ad (${old}):`, old); if(!nn) return;
  if(state.sections[col].some(([t])=>t.trim().toLowerCase()===nn.trim().toLowerCase()) && nn.trim().toLowerCase()!==old.trim().toLowerCase()){
    alert("Aynı isimde başka başlık var."); return;
  }
  state.sections[col][i][0]=nn; save(); render(); alert("Başlık güncellendi.");
});

$("#addButtonBtn").addEventListener("click", ()=>{
  const all=[]; const pos=[];
  ["LEFT","MIDDLE","RIGHT"].forEach(col=>{
    state.sections[col].forEach(([t,_],i)=>{ all.push(`${col} — ${t}`); pos.push([col,i]); });
  });
  if(!all.length){ alert("Bölüm yok."); return; }
  const pick = prompt("Hedef bölüm numarası:\n" + all.map((x,i)=>`${i+1}) ${x}`).join("\n"), "1"); if(!pick) return;
  const idx = parseInt(pick,10)-1; if(isNaN(idx)||idx<0||idx>=all.length) return;
  const name = prompt("Buton adı:"); if(!name) return;
  const [col,i] = pos[idx];
  const btns = state.sections[col][i][1];
  if(btns.some(b=>b.trim().toLowerCase()===name.trim().toLowerCase())) { alert("Aynı buton zaten var."); return; }
  btns.push(name); save(); render(); alert("Buton eklendi.");
});

$("#editTitleBtn").addEventListener("click", ()=>{
  const nv = prompt("Başlıktaki 'Kuşadası' yerine ne yazsın?", state.city||"KUŞADASI");
  if(!nv) return; state.city = nv.trim().toUpperCase(); save(); render();
});

$("#aboutLink").addEventListener("click", ()=>{ versionText.textContent = APP_VERSION; aboutModal.style.display = "flex"; });
$("#aboutCloseBtn").addEventListener("click", ()=>aboutModal.style.display="none");
$("#checkUpdateLink").addEventListener("click", ()=>{ window.open(UPDATE_DOWNLOAD_URL, "_blank"); });

$("#contactBtn").addEventListener("click", ()=>{
  const choice = prompt("İletişim: 1) WhatsApp 2) Instagram 3) Mail", "1");
  if(choice==="1"){ window.open("https://wa.me/908503041580","_blank"); }
  else if(choice==="2"){ window.open("https://www.instagram.com/fokokusadasi","_blank"); }
  else if(choice==="3"){ window.location.href="mailto:fokokusadasi@gmail.com?subject=FOKO%20Uygulama%20Destek"; }
});

modal.addEventListener("click", (e)=>{ if(e.target===modal) closeEditor(); });
aboutModal.addEventListener("click", (e)=>{ if(e.target===aboutModal) aboutModal.style.display="none"; });

function registerSW(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js");
  }
}
async function maybeCheckUpdate(){
  try{
    const r = await fetch(LATEST_JSON_URL, {cache: "no-store"});
    const data = await r.json();
    const latest = (data.latest_version||"").trim();
    const dl = data.download_url || UPDATE_DOWNLOAD_URL;
    if(latest && compareVersion(latest, APP_VERSION) > 0){
      if(confirm(`Yeni sürüm mevcut: ${latest}\nİndirmek ister misiniz?`)){
        window.open(dl, "_blank");
      }
    }
  }catch{}
}
function compareVersion(a,b){
  const pa=a.split(".").map(x=>parseInt(x,10)||0);
  const pb=b.split(".").map(x=>parseInt(x,10)||0);
  for(let i=0;i<3;i++){ if((pa[i]||0)!==(pb[i]||0)) return (pa[i]||0)>(pb[i]||0)?1:-1; }
  return 0;
}
render(); registerSW(); setTimeout(maybeCheckUpdate, 400);
