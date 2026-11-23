/* CareRecall - all data and review history remain in this browser. */
(()=>{
'use strict';
const data=window.CARE_DATA;
if(!data || !Array.isArray(data.questions)){document.body.prepend('Question bank not found. Check assets/data.js');return}
const QUESTIONS=data.questions, TOTAL=QUESTIONS.length, BY_ID=new Map(QUESTIONS.map(q=>[q.id,q]));
const KEY='care-recall-progress-v1';
const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toLocaleDateString('en-CA');
const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
function load(){try{const stored=JSON.parse(localStorage.getItem(KEY)||'{}');return {reviews:stored.reviews&&typeof stored.reviews==='object'?stored.reviews:{},activity:stored.activity&&typeof stored.activity==='object'?stored.activity:{}}}catch(e){return{reviews:{},activity:{}}}}
let progress=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(progress))}catch(e){toast('Could not save progress. Browser storage may be disabled.')}}
function reviewed(q){const r=progress.reviews[q.id];return !!r&&Number(r.attempts)>0}
function confident(q){return reviewed(q)&&['good','easy'].includes(progress.reviews[q.id].grade)}
function weak(q){return reviewed(q)&&['again','hard'].includes(progress.reviews[q.id].grade)}
function due(q){const r=progress.reviews[q.id];return reviewed(q)&&Number(r.nextDue)<=Date.now()}
function score(){return{seen:QUESTIONS.filter(reviewed).length,confident:QUESTIONS.filter(confident).length,due:QUESTIONS.filter(due).length}}
function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.remove('hidden');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.classList.add('hidden'),3000)}
function grade(id,g){const old=progress.reviews[id]||{};const attempts=(Number(old.attempts)||0)+1;const streak=['good','easy'].includes(g)?Math.max(0,Number(old.streak)||0)+1:0;const days=g==='hard'?1:g==='good'?Math.max(2,Math.min(21,Math.round(2*Math.pow(1.85,streak-1)))):g==='easy'?Math.max(4,Math.min(60,Math.round(4*Math.pow(2.1,streak-1)))):0;const nextDue=Date.now()+(g==='again'?10*60*1000:days*24*60*60*1000);progress.reviews[id]={attempts,streak,grade:g,last:Date.now(),nextDue};progress.activity[today()]=(Number(progress.activity[today()])||0)+1;save();refreshSidebar()}
function refreshSidebar(){const s=score();if($('side-mastered'))$('side-mastered').textContent=s.confident;if($('side-bar'))$('side-bar').style.width=`${s.confident/TOTAL*100}%`}
function populateCategories(id,allText){const sel=$(id);if(!sel)return;data.categories.forEach(cat=>{const opt=document.createElement('option');opt.value=cat;opt.textContent=cat;sel.appendChild(opt)})}
function registerSW(){if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{});}}
function isValidImport(v){return v&&typeof v==='object'&&v.reviews&&typeof v.reviews==='object'&&!Array.isArray(v.reviews)}
function initHome(){if(!$('stat-total'))return;const s=score();$('stat-total').textContent=TOTAL;$('stat-seen').textContent=s.seen;$('stat-confident').textContent=s.confident;$('stat-due').textContent=s.due;$('progress-label').textContent=`${s.seen} / ${TOTAL}`;$('progress-bar').style.width=`${s.seen/TOTAL*100}%`;
const week=$('week-activity');const fmt=new Intl.DateTimeFormat('en-GB',{weekday:'short'});for(let i=6;i>=0;i--){let dt=new Date();dt.setDate(dt.getDate()-i);const key=dt.toLocaleDateString('en-CA');const count=Number(progress.activity[key])||0;week.insertAdjacentHTML('beforeend',`<div class="day-tile ${count?'done':''}" title="${esc(key)}: ${count} reviews"><b>${fmt.format(dt)}</b><span>${count?count+' ✓':'—'}</span></div>`)}
$('export-progress').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exported:new Date().toISOString(),...progress},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='care-recall-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),250)});
$('import-progress').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const content=JSON.parse(await file.text());if(!isValidImport(content))throw Error('Invalid file format');const clean={reviews:{},activity:{}};for(const q of QUESTIONS){const r=content.reviews[q.id];if(!r||typeof r!=='object')continue;if(!['again','hard','good','easy'].includes(r.grade))continue;clean.reviews[q.id]={attempts:Math.max(0,Math.min(100000,Number(r.attempts)||0)),streak:Math.max(0,Math.min(1000,Number(r.streak)||0)),grade:r.grade,last:Number(r.last)||0,nextDue:Number(r.nextDue)||0}}
if(content.activity&&typeof content.activity==='object')for(const [k,v] of Object.entries(content.activity)){if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isFinite(Number(v)))clean.activity[k]=Math.max(0,Math.min(100000,Number(v)))}
progress=clean;save();toast('Progress restored');setTimeout(()=>location.reload(),400)}catch(err){toast('That file does not contain valid CareRecall progress.')}finally{e.target.value=''}})}

let micInstance=null;
function stopMic(){try{micInstance?.stop()}catch(e){}micInstance=null}
function initPractice(){if(!$('new-session'))return;populateCategories('practice-category');const params=new URLSearchParams(location.search);const givenMode=params.get('mode');if(['smart','random','mock','due','weak'].includes(givenMode))$('session-mode').value=givenMode;const questionId=Number(params.get('q'));if(BY_ID.has(questionId)){$('session-mode').value='random';$('session-size').value='5'}
let order=[],index=0,shown=false,skips=0,timer=null,remaining=60;
function stopTimer(){clearInterval(timer);timer=null;$('session-timer').classList.add('hidden')}
function startTimer(){stopTimer();if($('session-mode').value!=='mock')return;remaining=60;$('time-left').textContent=remaining;$('session-timer').classList.remove('hidden');timer=setInterval(()=>{remaining=Math.max(0,remaining-1);$('time-left').textContent=remaining;$('session-timer').classList.toggle('urgent',remaining<=10);if(remaining===0)stopTimer()},1000)}
function plan(){if(BY_ID.has(questionId))return [questionId];const pool=QUESTIONS.filter(q=>$('practice-category').value==='all'||q.category===$('practice-category').value);const mode=$('session-mode').value;const n=Number($('session-size').value)||10;let arr;if(mode==='due')arr=shuffle(pool.filter(due));else if(mode==='weak')arr=shuffle(pool.filter(weak));else if(mode==='random'||mode==='mock')arr=shuffle(pool);else arr=[...shuffle(pool.filter(due)),...shuffle(pool.filter(q=>!reviewed(q))),...shuffle(pool.filter(q=>reviewed(q)&&!due(q)))];return arr.slice(0,n).map(q=>q.id)}
function showQuestion(){stopMic();shown=false;stopTimer();if(index>=order.length){showComplete();return}const q=BY_ID.get(order[index]);$('session-caption').textContent=`Question ${index+1} of ${order.length} · ${$('session-mode').selectedOptions[0].text}`;$('question-topic').textContent=q.category;$('question-index').textContent=`Q${q.id} · ${index+1}/${order.length}`;$('practice-question').textContent=q.question;$('model-answer').textContent=q.short;$('model-cues').innerHTML=q.cues.map(c=>`<span class="cue">${esc(c)}</span>`).join('');const f=data.families.find(f=>f.name===q.family);$('family-label').textContent=f?`Shared answer pattern: ${f.formula}`:'';$('original-answer').textContent=q.full;$('original-answer').classList.add('hidden');$('toggle-original').textContent='See your original full answer';$('answer-panel').classList.add('hidden');$('reveal-answer').classList.remove('hidden');$('answer-notes').value='';$('mic-button').textContent='🎙 Dictate';$('mic-hint').classList.add('hidden');$('skip-question').classList.remove('hidden');$('think-tip').textContent=$('session-mode').value==='mock'?'Mock interview: say a clear answer in about 60 seconds.':'Say your answer before checking, even if you remember only 2–3 key ideas.';$('think-tip').classList.remove('hidden');startTimer()}
function showComplete(){stopTimer();$('session-caption').textContent='Session finished';$('question-topic').textContent='Great effort';$('question-index').textContent=`${order.length} questions`;$('practice-question').textContent=order.length?'Session complete. Come back tomorrow to strengthen your memory.':'No questions match this review mode yet.';$('think-tip').textContent=order.length?`You skipped ${skips} question${skips===1?'':'s'}. Your ratings were saved automatically. A little practice every day works better than one long cram.`:'Try “Smart review” or “Surprise questions” to continue practising.';$('think-tip').classList.remove('hidden');$('answer-panel').classList.add('hidden');$('reveal-answer').classList.add('hidden');$('skip-question').classList.add('hidden');$('answer-notes').value='';$('session-timer').classList.add('hidden')}
function begin(){order=plan();index=0;skips=0;showQuestion();if(order.length)toast('New session started. Say the answer before revealing it.')}
$('new-session').addEventListener('click',()=>{if(BY_ID.has(questionId))location.href='practice.html?mode='+encodeURIComponent($('session-mode').value);else begin()});$('reveal-answer').addEventListener('click',()=>{if(index>=order.length)return;shown=true;$('answer-panel').classList.remove('hidden');$('reveal-answer').classList.add('hidden');$('think-tip').classList.add('hidden');stopTimer()});$('skip-question').addEventListener('click',()=>{skips++;index++;showQuestion()});$('toggle-original').addEventListener('click',()=>{const hidden=$('original-answer').classList.toggle('hidden');$('toggle-original').textContent=hidden?'See your original full answer':'Hide original full answer'});document.querySelectorAll('[data-grade]').forEach(el=>el.addEventListener('click',()=>{if(!shown||index>=order.length)return;grade(order[index],el.dataset.grade);index++;showQuestion()}));
$('mic-button').addEventListener('click',()=>{const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){$('mic-hint').textContent='This browser does not support voice dictation. You can speak aloud and use the text box if you wish. Chrome or Edge often support dictation.';$('mic-hint').classList.remove('hidden');return}if(micInstance){stopMic();$('mic-button').textContent='🎙 Dictate';return}try{const rec=new SpeechRecognition();rec.lang='en-GB';rec.interimResults=true;rec.continuous=true;let base=$('answer-notes').value.trim();micInstance=rec;rec.onresult=(e)=>{let final='',interim='';for(let i=0;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)final+=t+' ';else interim+=t} $('answer-notes').value=[base,final.trim(),interim.trim()].filter(Boolean).join(' ')};rec.onerror=(e)=>{toast('Microphone unavailable: '+e.error);stopMic();$('mic-button').textContent='🎙 Dictate'};rec.onend=()=>{micInstance=null;$('mic-button').textContent='🎙 Dictate'};rec.start();$('mic-button').textContent='■ Stop dictation';$('mic-hint').textContent='Your browser may use an online service for speech recognition. Do not dictate private resident information.';$('mic-hint').classList.remove('hidden')}catch(e){stopMic();toast('Unable to start microphone. Please check browser permissions.')}});
window.addEventListener('pagehide',()=>{stopTimer();stopMic();});begin()}

function initLibrary(){if(!$('question-list'))return;populateCategories('library-category');let query='',cat='all',filter='all';const container=$('question-list');const fam=$('families');fam.innerHTML=data.families.map(f=>`<article class="family-card"><div class="tag tag-neutral">${f.ids.length} questions</div><h3 style="margin-top:10px">${esc(f.name)}</h3><div class="family-formula">${esc(f.formula)}</div><p style="margin-top:10px">${esc(f.tip)}</p><div class="ids">${f.ids.map(id=>`<a href="#q-${id}" title="Go to question ${id}">Q${id}</a>`).join('')}</div></article>`).join('');$('toggle-families').addEventListener('click',()=>{const was=fam.classList.toggle('hidden');$('toggle-families').textContent=was?'Show families':'Hide families'});
function render(){let items=QUESTIONS.filter(q=>(cat==='all'||q.category===cat)&&((q.question+' '+q.short+' '+q.family+' '+q.cues.join(' ')).toLowerCase().includes(query))&&(filter==='all'||(filter==='unseen'&&!reviewed(q))||(filter==='weak'&&weak(q))||(filter==='confident'&&confident(q))));$('results-count').textContent=`Showing ${items.length} of ${TOTAL} questions`;container.innerHTML=items.length?items.map(q=>{const level=confident(q)?'Confident':weak(q)?'Practise again':'Not yet practised';return `<details class="question-item" id="q-${q.id}"><summary><span class="question-id">${q.id}</span><span class="question-name">${esc(q.question)}</span><span class="tag tag-neutral">${esc(level)}</span><span class="fold" aria-hidden="true">⌄</span></summary><div class="question-body"><div class="small muted" style="margin-bottom:9px">${esc(q.category)} · ${esc(q.family)}</div><p>${esc(q.short)}</p><div class="cue-list">${q.cues.map(c=>`<span class="cue">${esc(c)}</span>`).join('')}</div><details style="margin-top:15px"><summary class="small subtle-link" style="cursor:pointer">View your full original answer</summary><div class="original">${esc(q.full)}</div></details><div style="display:flex;flex-wrap:wrap;gap:9px;margin-top:12px"><a class="btn btn-small btn-primary" href="practice.html?q=${q.id}">Practise this question ↗</a><a class="btn btn-small btn-outline" href="listen.html?q=${q.id}">🔊 Listen to it</a></div></div></details>`}).join(''):'<div class="empty">Nothing matches yet. Try a different topic or search.</div>'}
$('library-query').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render()});$('library-category').addEventListener('change',e=>{cat=e.target.value;render()});$('library-filter').addEventListener('change',e=>{filter=e.target.value;render()});render();function openFromHash(){if(!location.hash.startsWith('#q-'))return;const id=Number(location.hash.slice(3));if(!$('q-'+id)){query='';cat='all';filter='all';$('library-query').value='';$('library-category').value='all';$('library-filter').value='all';render()}const element=$('q-'+id);if(element){element.open=true;setTimeout(()=>element.scrollIntoView({block:'center'}),80)}}window.addEventListener('hashchange',openFromHash);openFromHash()}

function initRecordingStudio(){
  if(!$('recording-script'))return;
  const batches=[];
  for(let i=0;i<QUESTIONS.length;i+=4)batches.push(QUESTIONS.slice(i,i+4));
  $('recording-batch').innerHTML=batches.map((b,i)=>`<option value="${i}">Questions ${b[0].id}–${b[b.length-1].id}</option>`).join('');
  let script='';
  function scriptForBatch(){
    const selected=batches[Number($('recording-batch').value)]||batches[0];
    const kind=$('recording-version').value;
    script=selected.map(q=>`Question ${q.id}. ${q.question}\n\n${kind==='full'?q.full:q.short}\n\n`).join('\n');
    $('recording-script').value=script;
    $('recording-count').textContent=`${script.length.toLocaleString('en-GB')} characters · ${selected.length} questions · ${kind==='full'?'full':'short'} answers`;
  }
  $('recording-batch').addEventListener('change',scriptForBatch);
  $('recording-version').addEventListener('change',scriptForBatch);
  scriptForBatch();
  const cartesiaVoiceId='273f9ef7-9fc2-4def-88bb-ab108c6249ca';
  const copyVoiceId=$('cartesia-copy-id');
  if(copyVoiceId)copyVoiceId.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(cartesiaVoiceId);
      toast('Julia voice ID copied · choose Julia in Cartesia');
    }catch(e){
      const idElement=$('cartesia-voice-id');
      if(idElement){const range=document.createRange();range.selectNodeContents(idElement);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range)}
      toast('Voice ID selected · press Command+C or Ctrl+C to copy');
    }
  });
  $('recording-copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(script);toast('Script copied · paste it into Cartesia or TwoShot')}catch(e){$('recording-script').focus();$('recording-script').select();toast('Select the script and copy it manually')}
  });
  $('recording-save-text').addEventListener('click',()=>{
    const batch=batches[Number($('recording-batch').value)]||batches[0];
    const blob=new Blob([script],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;
    link.download=`care-recall-${String(batch[0].id).padStart(2,'0')}-${String(batch[batch.length-1].id).padStart(2,'0')}-${$('recording-version').value}.txt`;
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  });
  const player=$('recording-player'),filesInput=$('recording-files'),queue=$('recording-queue');
  let tracks=[],activeIndex=0;
  function cleanup(){tracks.forEach(t=>URL.revokeObjectURL(t.url));tracks=[];activeIndex=0;player.pause();player.removeAttribute('src');player.load();$('recording-current').textContent='No recordings selected yet';queue.innerHTML='';$('recording-prev').disabled=true;$('recording-next').disabled=true}
  function updateAudio(autoplay=false){
    const item=tracks[activeIndex];if(!item)return;
    player.src=item.url;player.playbackRate=Number($('recording-speed').value)||1;
    $('recording-current').textContent=`Recording ${activeIndex+1} of ${tracks.length}: ${item.name}`;
    $('recording-prev').disabled=activeIndex===0;
    $('recording-next').disabled=tracks.length<2||activeIndex===tracks.length-1&&!$('recording-loop').checked;
    [...queue.querySelectorAll('button')].forEach((btn,i)=>{btn.classList.toggle('active',i===activeIndex);btn.setAttribute('aria-current',String(i===activeIndex))});
    if(autoplay){const promise=player.play();if(promise&&promise.catch)promise.catch(()=>toast('Press play to continue the audio'))}
  }
  function move(step){if(!tracks.length)return;const next=activeIndex+step;if(next<0)return;if(next>=tracks.length){if(!$('recording-loop').checked)return;activeIndex=0}else activeIndex=next;updateAudio(true)}
  filesInput.addEventListener('change',()=>{
    cleanup();
    const files=Array.from(filesInput.files||[]).filter(f=>f.type.startsWith('audio/')||/\.(mp3|wav|m4a|ogg)$/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
    if(!files.length){toast('Select one or more audio recordings');return}
    tracks=files.map(f=>({name:f.name,url:URL.createObjectURL(f)}));
    queue.innerHTML=tracks.map((f,i)=>`<li><button type="button">${i+1}. ${esc(f.name)}</button></li>`).join('');
    [...queue.querySelectorAll('button')].forEach((b,i)=>b.addEventListener('click',()=>{activeIndex=i;updateAudio(true)}));
    updateAudio(false);toast(`${tracks.length} narration recording${tracks.length===1?'':'s'} loaded`);
  });
  player.addEventListener('ended',()=>{if(activeIndex+1<tracks.length||$('recording-loop').checked)move(1)});
  player.addEventListener('error',()=>{if(tracks.length)toast('This recording could not play. Try MP3 format.')});
  $('recording-prev').addEventListener('click',()=>move(-1));$('recording-next').addEventListener('click',()=>move(1));
  $('recording-speed').addEventListener('change',()=>player.playbackRate=Number($('recording-speed').value)||1);
  $('recording-loop').addEventListener('change',()=>{if(tracks.length){$('recording-next').disabled=tracks.length<2||activeIndex===tracks.length-1&&!$('recording-loop').checked}});
  window.addEventListener('pagehide',cleanup);
}

refreshSidebar();registerSW();initHome();initPractice();initLibrary();initRecordingStudio();
})();