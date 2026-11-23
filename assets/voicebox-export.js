/* Voicebox narration exports, entirely local in the visitor's browser. */
(() => {
  'use strict';
  const questions = window.CARE_DATA?.questions;
  if (!Array.isArray(questions)) return;
  const file = (name, text) => {
    const url = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 12000);
  };
  function exportText(style) {
    const script = questions.map(q => (
      'Question ' + q.id + '. ' + q.question + '\n\n' +
      'Answer. ' + (style === 'full' ? q.full : q.short) + '\n\n'
    )).join('\n');
    const title = 'CareRecall: 72 care assistant interview questions and answers\n' +
      'Read in a calm, clear, natural British English voice, with a brief pause after each question.\n\n';
    const result = title + script;
    file('CareRecall-Voicebox-72-Questions-' + (style === 'full' ? 'Full' : 'Short') + '.txt', result);
    const message = document.getElementById('kokoro-status');
    if (message) message.textContent='Script downloaded. Open Voicebox, paste it and generate audio.';
  }
  document.getElementById('voicebox-export-short')?.addEventListener('click',() => exportText('short'));
  document.getElementById('voicebox-export-full')?.addEventListener('click',() => exportText('full'));
})();