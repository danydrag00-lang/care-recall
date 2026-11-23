/* Updated-answer Kokoro neural narration.
 * Prerecorded website MP3s still play instantly for unedited answers.
 * Personal edits are synthesised locally in the visitor's browser.
 */
(() => {
  "use strict";
  const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
  const CDN = [
    "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm",
    "https://esm.sh/kokoro-js@1.2.1?bundle"
  ];
  const memo = new Map();
  const pending = new Map();
  let modelPromise = null;
  let databasePromise = null;
  const keyOf = (voice,text) => voice + "\u0000" + String(text).trim().replace(/\s+/g," ");

  function splitText(text,limit=190) {
    const source = String(text).replace(/\s+/g," ").trim();
    if (!source) return [];
    const sentences = source.match(/[^.!?;:]+[.!?;:]?\s*|\S+/g) || [source];
    const chunks = [];
    let current = "";
    function push() { if (current.trim()) chunks.push(current.trim()); current=""; }
    for (const sentence of sentences) {
      const part = sentence.trim();
      if (!part) continue;
      if ((current+" "+part).trim().length <= limit) {
        current = (current+" "+part).trim();continue;
      }
      push();
      if (part.length <= limit) { current=part;continue; }
      for (const word of part.split(/\s+/)) {
        if (current && (current+" "+word).length>limit) push();
        if (word.length<=limit) current=(current+" "+word).trim();
        else {
          if (current) push();
          for(let offset=0;offset<word.length;offset+=limit) chunks.push(word.slice(offset,offset+limit));
        }
      }
    }
    push();
    return chunks;
  }

  // Join every synthesis chunk into one continuous 16-bit WAV.
  function audioToBlob(parts) {
    if (!parts.length) throw new Error("No audio was generated.");
    const rate=parts[0].sampling_rate || 24000;
    const gap = Math.floor(rate*0.11);
    const length=parts.reduce((sum,a)=>sum+a.data.length,0)+Math.max(0,parts.length-1)*gap;
    const bytes=new ArrayBuffer(44+length*2);
    const view=new DataView(bytes);
    function str(pos,s) {for(let i=0;i<s.length;i++)view.setUint8(pos+i,s.charCodeAt(i));}
    str(0,"RIFF");view.setUint32(4,36+length*2,true);str(8,"WAVE");
    str(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);
    view.setUint16(22,1,true);view.setUint32(24,rate,true);
    view.setUint32(28,rate*2,true);view.setUint16(32,2,true);
    view.setUint16(34,16,true);str(36,"data");view.setUint32(40,length*2,true);
    let offset=44;
    parts.forEach((a,i)=>{
      if ((a.sampling_rate || 24000)!==rate) throw new Error("Speech sample rate changed.");
      for(const sample of a.data) {
        const x=Math.max(-1,Math.min(1,Number(sample)||0));
        view.setInt16(offset,x<0?Math.round(x*32768):Math.round(x*32767),true);offset+=2;
      }
      if(i<parts.length-1) {offset+=gap*2;}
    });
    return new Blob([bytes],{type:"audio/wav"});
  }

  function db() {
    if (databasePromise) return databasePromise;
    if (!("indexedDB" in window)) return Promise.resolve(null);
    databasePromise=new Promise(resolve=>{
      try {
        const request=indexedDB.open("care-recall-generated-audio",1);
        request.onupgradeneeded=()=>request.result.createObjectStore("clips");
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>resolve(null);
        request.onblocked=()=>resolve(null);
      }catch(_){resolve(null);}
    });
    return databasePromise;
  }
  async function readBlob(key) {
    const database=await db();if(!database)return null;
    return new Promise(resolve=>{
      try {
        const req=database.transaction("clips","readonly").objectStore("clips").get(key);
        req.onsuccess=()=>resolve(req.result instanceof Blob?req.result:null);
        req.onerror=()=>resolve(null);
      }catch(_){resolve(null);}
    });
  }
  async function storeBlob(key,blob) {
    const database=await db();if(!database)return;
    return new Promise(resolve=>{
      try {
        const tx=database.transaction("clips","readwrite");
        tx.objectStore("clips").put(blob,key);
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>resolve();
        tx.onabort=()=>resolve();
      }catch(_){resolve();}
    });
  }
  async function model() {
    if (!modelPromise) modelPromise=(async()=>{
      let library=null, lastError=null;
      for(const url of CDN) {
        try {library=await import(url);if(library.KokoroTTS)break;}
        catch(error){lastError=error;}
      }
      if(!library?.KokoroTTS)throw lastError || new Error("Kokoro speech library could not load.");
      return library.KokoroTTS.from_pretrained(MODEL,{dtype:"q8",device:"wasm"});
    })().catch(error=>{modelPromise=null;throw error;});
    return modelPromise;
  }
  function remember(key,blob) {
    const url=URL.createObjectURL(blob);
    memo.set(key,url);
    return url;
  }
  function cached(text,voice) {return memo.get(keyOf(voice,text)) || null;}
  function prepare(text,voice="bf_emma",progress=()=>{}) {
    const input=String(text||"").trim();
    if(!input) return Promise.reject(new Error("Please write your answer before generating speech."));
    if(!/^(bf_emma|bf_isabella|bm_george)$/.test(voice))
      return Promise.reject(new Error("This voice is not available."));
    const key=keyOf(voice,input);
    if(memo.has(key))return Promise.resolve(memo.get(key));
    if(pending.has(key))return pending.get(key);
    const work=(async()=>{
      progress("Looking for your saved edited recording…");
      const old=await readBlob(key);
      if(old) {progress("Your revised narration is ready.");return remember(key,old);}
      progress("Preparing Kokoro for your edited answer. The first use downloads a large model.");
      const tts=await model();
      const chunks=splitText(input);
      if(!chunks.length)throw new Error("There is no text to read.");
      const parts=[];
      for(let i=0;i<chunks.length;i++) {
        progress("Updating voice recording · "+(i+1)+" of "+chunks.length+" parts");
        const out=await tts.generate(chunks[i],{voice,speed:0.96});
        if(!out?.data?.length)throw new Error("Kokoro returned empty speech.");
        parts.push(out);
      }
      const blob=audioToBlob(parts);
      const url=remember(key,blob);
      void storeBlob(key,blob).catch(()=>{});
      progress("Your revised narration is ready.");
      return url;
    })().finally(()=>pending.delete(key));
    pending.set(key,work);
    return work;
  }
  window.CareRecallVoice={prepare,cached,splitText};
})();
