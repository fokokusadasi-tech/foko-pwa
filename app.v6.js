const APP_VERSION="1.1.0";
const UPDATE_DOWNLOAD_URL="https://example.com/foko-latest.zip";
const LATEST_JSON_URL="https://example.com/latest.json";

const $=(s)=>document.querySelector(s);
const grid=$("#grid"), editor=$("#editor"), imagesEl=$("#images");
const modal=$("#modalBackdrop"), aboutModal=$("#aboutBackdrop"), modalTitle=$("#modalTitle");
const imgInput=$("#imgInput"), versionText=$("#versionText");
const profileSelect=$("#profileSelect"), musteriEkleBtn=$("#musteriEkleBtn"), musteriSilBtn=$("#musteriSilBtn");
const importBtn=$("#importBtn"), importInput=$("#importInput"), exportBtn=$("#exportBtn");

const custBackdrop=$("#custBackdrop"), custName=$("#custName"), custPhone=$("#custPhone"), custProducts=$("#custProducts");
const custSaveBtn=$("#custSaveBtn"), custCancelBtn=$("#custCancelBtn");

function getQueryParam(key){ const u=new URL(location.href); return u.searchParams.get(key); }

// ---- Profiles (Müşteriler) & Meta in localStorage ----
const LS_PROFILES_KEY = "foko-profiles";
const LS_ACTIVE_KEY = "foko-active-profile";
const LS_META_KEY = "foko-profiles-meta"; // { profileName: { name, phone, products } }

function allProfiles(){ try{ return JSON.parse(localStorage.getItem(LS_PROFILES_KEY)||"{}"); }catch{ return {}; } }
function saveAllProfiles(obj){ localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(obj)); }
function allMeta(){ try{ return JSON.parse(localStorage.getItem(LS_META_KEY)||"{}"); }catch{ return {}; } }
function saveAllMeta(obj){ localStorage.setItem(LS_META_KEY, JSON.stringify(obj)); }

function activeProfileName(){ return localStorage.getItem(LS_ACTIVE_KEY) || getQueryParam("p") || "Varsayılan"; }
function setActiveProfileName(n){ localStorage.setItem(LS_ACTIVE_KEY, n); }
function getState(name){ const p=allProfiles(); return p[name] || defaultState(); }
function setState(name, state){ const p=allProfiles(); p[name]=state; saveAllProfiles(p); }

function ensureProfileExists(name){ const p=allProfiles(); if(!p[name]){ p[name]=defaultState(); saveAllProfiles(p); }}

// UI: list profiles and select active
function refreshProfileUI(){
  const p=allProfiles(); const names=Object.keys(p); if(names.indexOf("Varsayılan")===-1) names.unshift("Varsayılan");
  profileSelect.innerHTML="";
  names.forEach(n=>{ const opt=document.createElement("option"); opt.value=n; opt.textContent=n; profileSelect.appendChild(opt); });
  profileSelect.value = activeProfileName();
}
function switchProfile(name){ ensureProfileExists(name); setActiveProfileName(name); state = getState(name); render(); }

// --- Customer modal handlers ---
function openCustomerModal(prefill){
  custName.value = prefill?.name || "";
  custPhone.value = prefill?.phone || "";
  custProducts.value = prefill?.products || "";
  custBackdrop.style.display="flex";
  setTimeout(()=>custName.focus(), 50);
}
function closeCustomerModal(){ custBackdrop.style.display="none"; }

musteriEkleBtn.addEventListener("click", ()=>openCustomerModal());
custCancelBtn.addEventListener("click", closeCustomerModal);
custBackdrop.addEventListener("click", (e)=>{ if(e.target===custBackdrop) closeCustomerModal(); });

custSaveBtn.addEventListener("click", ()=>{
  const name = (custName.value||"").trim();
  const phone = (custPhone.value||"").trim();
  const prods = (custProducts.value||"").trim();
  if(!name){ alert("Müşteri adı gerekli."); return; }
  ensureProfileExists(name);
  // Save meta
  const meta = allMeta(); meta[name] = { name, phone: sanitizePhoneTR(phone), products: prods }; saveAllMeta(meta);
  setActiveProfileName(name); state=getState(name); save(); refreshProfileUI(); render();
  closeCustomerModal();
  alert("Müşteri kaydedildi.");
});

musteriSilBtn.addEventListener("click", ()=>{
  const cur = activeProfileName();
  if(cur==="Varsayılan"){ alert("'Varsayılan' silinemez."); return; }
  if(!confirm(`'${cur}' müşterisini silmek istiyor musunuz? Bu cihazdaki veriler silinir.`)) return;
  const p=allProfiles(); delete p[cur]; saveAllProfiles(p);
  const m=allMeta(); delete m[cur]; saveAllMeta(m);
  setActiveProfileName("Varsayılan"); ensureProfileExists("Varsayılan"); state=getState("Varsayılan"); refreshProfileUI(); render();
});
profileSelect.addEventListener("change", ()=>switchProfile(profileSelect.value));

// Export / Import (profiles + meta)
exportBtn.addEventListener("click", ()=>{
  const data = { profiles: allProfiles(), meta: allMeta() };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a=document.createElement("a"); a.download="foko-yedek.json"; a.href=URL.createObjectURL(blob); a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
});
importBtn.addEventListener("click", ()=>importInput.click());
importInput.addEventListener("change", (e)=>{
  const file = e.target.files && e.target.files[0]; if(!file) return;
  const fr = new FileReader();
  fr.onload = ()=>{
    try{
      const parsed = JSON.parse(fr.result);
      if(parsed && typeof parsed==="object"){
        // Backward compat: either {profiles:..., meta:...} or plain profiles map
        if(parsed.profiles){
          saveAllProfiles(parsed.profiles);
          saveAllMeta(parsed.meta||{});
        }else{
          saveAllProfiles(parsed);
        }
        refreshProfileUI(); switchProfile(activeProfileName());
        alert("Yedek içe aktarıldı.");
      }else{ alert("Geçersiz yedek dosyası."); }
    }catch{ alert("Geçersiz yedek dosyası."); }
  };
  fr.readAsText(file);
  e.target.value="";
});

// ----- App state -----
let state = getState(activeProfileName());
let currentKey = null;

function defaultState(){
  return {
    city: "KUŞADASI",
    sections: {
      LEFT: [
        ["CİLT/SAÇ BAKIM RUTİNLERİ", [
          "LEKE\\nRUTİNİ","KIRIŞIKLIK\\nRUTİNİ","SİVİLCE\\nRUTİNİ","GÖZENEK/\\nKOMEDON RUTİNİ",
          "HASSAS\\nCİLTLER","KURU\\nCİLTLER","YAĞLI\\nCİLTLER","KARMA\\nCİLTLER",
          "BOYALI SAÇLAR\\nRUTİNİ","EGZAMA\\nRUTİNİ","KEPEK\\nRUTİNİ","DÖKÜLME\\nRUTİNİ"
        ]],
        ["RETİNOL/RETİNAL\\nKULLANIM REHBERİ (TEK)", ["RETİNOL/RETİNAL\\nKULLANIM REHBERİ"]],
      ],
      MIDDLE: [
        ["SERUMLAR", [
          "C VİTAMİNİ","NİACİNAMİDE","ARBUTİN","TRANEXAMİC","PEPTİDE","ACN SERUM",
          "ATP SERUM","HYALURONIC\\nACİD","HYALURONIC+B3","ARGİRELİNE %10",
          "HYALURONIC+C","ARGİRELİNE OİL","GLYCOLİC SERUM","AHA-BHA SERUM"
        ]],
        ["TONİKLER", ["BHA TONİK","AHA TONİK","AHA-BHA TONİK","ACN TONİK"]],
      ],
      RIGHT: [
        ["YÜZ YIKAMA JELLERİ", [
          "BHA YÜZ\\nYIKAMA JELİ","CİLT TEMİZLEME\\nYAĞI","ACN YÜZ\\nYIKAMA JELİ","5.5 Ph\\nYÜZ YIKAMA JELİ"
        ]],
        ["ŞAMPUANLAR", [
          "BOYALI SAÇLAR\\nİÇİN ŞAMPUAN","YAĞLI SAÇLAR\\nİÇİN ŞAMPUAN",
          "DÖKÜLME KARŞITI\\nŞAMPUAN","SBR SERİSİ KEPEK\\nKARŞITI ŞAMPUAN","ATP\\nSIVI YIKAMA SABUNU"
        ]],
        ["DOĞAL YAĞLAR/SULAR", ["Avakado Yağı","Susam Yağı","Karanfil Yağı","Macadamid Yağı"]]
      ]
    },
    content: {}
  };
}

function save(){ setState(activeProfileName(), state); }

function render(){
  $("#city").textContent = state.city || "KUŞADASI";
  refreshProfileUI();
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
  modalTitle.textContent = key.replaceAll("\\n"," ");
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
  save(); alert("Kaydedildi.");
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

// WhatsApp share to selected customer
$("#whatsBtn").addEventListener("click", ()=>{
  const meta = allMeta();
  const names = Object.keys(meta).filter(n=> (meta[n]?.phone||"").trim() !== "");
  if(names.length===0){
    if(confirm("Kayıtlı telefon numarası olan müşteri yok. Yeni müşteri eklemek ister misiniz?")){
      openCustomerModal();
    }
    return;
  }
  const menu = names.map((n,i)=> `${i+1}) ${n} — ${displayPhone(meta[n].phone)}`).join("\n");
  const pick = prompt("Gönderilecek müşteri numarasını seçin:\n"+menu, "1");
  if(!pick) return;
  const idx = parseInt(pick,10)-1;
  if(isNaN(idx) || idx<0 || idx>=names.length) return;
  const sel = names[idx];
  const phone = meta[sel].phone;
  const title = (modalTitle.textContent||"").trim();
  const text = (editor.innerText||"").trim();
  const products = (meta[sel].products||"").trim();
  const msg = `*${title}*\n\n${text}\n\n— ${sel}\n${products?("Alınan ürünler: "+products):""}`.trim();
  const link = buildWaLink(phone, msg);
  window.open(link, "_blank");
});

function sanitizePhoneTR(p){
  if(!p) return "";
  let digits = (""+p).replace(/\D/g,"");
  if(digits.startsWith("00")) digits = digits.slice(2);
  if(digits.startsWith("90") && digits.length===12) return digits;
  if(digits.startsWith("0") && digits.length===11) return "90"+digits.slice(1);
  if(digits.length===10) return "90"+digits;
  if(digits.length===12) return digits; // assume includes country code
  return digits; // fallback
}
function displayPhone(p){
  const d = sanitizePhoneTR(p);
  if(!d) return "";
  return "+"+d.slice(0,2)+" "+d.slice(2,5)+" "+d.slice(5,8)+" "+d.slice(8,10)+" "+d.slice(10,12);
}
function buildWaLink(phone, text){
  const d = sanitizePhoneTR(phone);
  const base = "https://wa.me/"+d;
  const params = "?text="+encodeURIComponent(text);
  return base+params;
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

function ensureHtml2Canvas(){ if(window.html2canvas) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    s.onload=()=>resolve(); s.onerror=reject; document.head.appendChild(s);
  });
}

// ----- Section & Button add/rename/edit -----
$("#addSectionBtn").addEventListener("click", ()=>{
  const name = prompt("Yeni başlık adı:"); if(!name) return;
  const colPick = prompt("Hangi sütun? 1 / 2 / 3", "1")||"1";
  const col = colPick.startsWith("1")?"LEFT":colPick.startsWith("2")?"MIDDLE":"RIGHT";
  if(state.sections[col].some(([t])=>t.trim().toLowerCase()===name.trim().toLowerCase())){ alert("Bu isimde bir başlık zaten var."); return; }
  state.sections[col].push([name, []]); save(); render(); alert(`${colPick}. sütuna '${name}' eklendi.`);
});

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

$("#editButtonBtn").addEventListener("click", ()=>{
  const secList=[]; const secPos=[];
  ["LEFT","MIDDLE","RIGHT"].forEach(col=>{
    state.sections[col].forEach(([t,btns],i)=>{ secList.push(`${col} — ${t}`); secPos.push([col,i]); });
  });
  if(!secList.length){ alert("Düzenlenecek bölüm yok."); return; }
  const secPick = prompt("Bölüm seçin:\n" + secList.map((x,i)=>`${i+1}) ${x}`).join("\n"), "1"); if(!secPick) return;
  let sidx=parseInt(secPick,10)-1; if(isNaN(sidx)||sidx<0||sidx>=secList.length) return;
  const [scol, si] = secPos[sidx];
  const btns = state.sections[scol][si][1];
  if(!btns.length){ alert("Bu bölümde buton yok."); return; }
  const btnPick = prompt("Buton seçin:\n" + btns.map((x,i)=>`${i+1}) ${x}`).join("\n"), "1"); if(!btnPick) return;
  let bidx=parseInt(btnPick,10)-1; if(isNaN(bidx)||bidx<0||bidx>=btns.length) return;
  const cur = btns[bidx];
  const act = prompt(`Ne yapmak istersiniz?\nR) Yeniden adlandır\nS) Sil\n(Seçim: R/S)`, "R");
  if(!act) return;
  if(act.toUpperCase()==="R"){
    const nn = prompt("Yeni buton adı:", cur); if(!nn) return;
    if(btns.some(b=>b.trim().toLowerCase()===nn.trim().toLowerCase()) && nn.trim().toLowerCase()!==cur.trim().toLowerCase()){
      alert("Aynı isimde başka buton var."); return;
    }
    btns[bidx]=nn; save(); render(); alert("Buton adı güncellendi.");
  }else if(act.toUpperCase()==="S"){
    if(!confirm(`'${cur}' butonunu silmek istiyor musunuz?`)) return;
    btns.splice(bidx,1); save(); render(); alert("Buton silindi.");
  }
});

// ----- Title / About / Update / Contact -----
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

function registerSW(){ if("serviceWorker" in navigator){ navigator.serviceWorker.register("./sw.js"); } }
async function maybeCheckUpdate(){
  try{ const r=await fetch(LATEST_JSON_URL,{cache:"no-store"}); const data=await r.json();
    const latest=(data.latest_version||"").trim(); const dl=data.download_url||UPDATE_DOWNLOAD_URL;
    if(latest && compareVersion(latest, APP_VERSION)>0){ if(confirm(`Yeni sürüm mevcut: ${latest}\nİndirmek ister misiniz?`)){ window.open(dl,"_blank"); } }
  }catch{}
}
function compareVersion(a,b){ const pa=a.split(".").map(x=>parseInt(x,10)||0), pb=b.split(".").map(x=>parseInt(x,10)||0);
  for(let i=0;i<3;i++){ if((pa[i]||0)!==(pb[i]||0)) return (pa[i]||0)>(pb[i]||0)?1:-1; } return 0;
}

refreshProfileUI(); switchProfile(activeProfileName()); // sets state & renders
registerSW(); setTimeout(maybeCheckUpdate, 400);
