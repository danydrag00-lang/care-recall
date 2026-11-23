"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"assets/edited-voice.js"),"utf8");
function moduleMock(){
  const window={};
  vm.runInNewContext(source,{window,URL,Blob,Promise},{filename:"edited-voice.js"});
  return window.CareRecallVoice;
}
test("long personally edited answers split into manageable neural speech chunks without dropping words",()=>{
  const voice=moduleMock();
  const text=("I support each resident with compassion, dignity and patience. "+
      "Their choices and privacy are important during personal care. ").repeat(45);
  const chunks=voice.splitText(text);
  assert(chunks.length>8);
  assert(chunks.every(part=>part.length>0 && part.length<=190));
  assert.equal(chunks.join(" ").replace(/\s+/g," ").trim(),text.replace(/\s+/g," ").trim());
});
test("empty text is rejected before requesting a speech model",async()=>{
  const voice=moduleMock();
  assert.deepEqual([...voice.splitText("   ")],[]);
  await assert.rejects(voice.prepare("  ","bf_emma"),/write your answer/);
});
test("every CareRecall page loads personal answer edits before the main application",()=>{
  for (const name of ["index.html","practice.html","library.html","listen.html"]){
    const html=fs.readFileSync(path.join(root,name),"utf8");
    const dataPos=html.indexOf('src="assets/data.js"');
    const editsPos=html.indexOf('src="assets/answer-edits.js"');
    const appPos=html.indexOf('src="assets/app.js"');
    assert(dataPos>=0 && editsPos>dataPos && appPos>editsPos,name);
    assert(html.includes('href="assets/editorial.css"'));
    assert(html.includes('content="#292727"'));
  }
});
test("Study Room loads revised voice code before its playback handlers",()=>{
  const html=fs.readFileSync(path.join(root,"listen.html"),"utf8");
  assert(html.indexOf('src="assets/edited-voice.js"')>html.indexOf('src="assets/app.js"'));
  assert(html.indexOf('src="assets/edited-voice.js"')<html.indexOf('src="assets/saved-audio.js"'));
  for (const id of ["saved-edit-form","saved-edit-text","saved-edit-toggle","saved-edit-save","saved-edit-reset","saved-edit-cancel","saved-edit-feedback"]) assert(html.includes('id="'+id+'"'));
});
