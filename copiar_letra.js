(() => {
  const SEM_SECOES = true; // false mantém linhas como [Chorus] e [Verse 1]
  const boxes = document.querySelectorAll('[data-lyrics-container="true"]');
  if (!boxes.length) return console.warn('Nenhuma letra aqui: abra a página da música, não a da busca.');
  let text = [...boxes].map(box => {
    const clone = box.cloneNode(true);
    clone.querySelectorAll('[data-exclude-from-selection="true"]').forEach(el => el.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return clone.textContent.trim();
  }).join('\n\n');
  if (SEM_SECOES) text = text.replace(/^\[.*\]$/gm, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  if (typeof copy === 'function') copy(text); else console.log(text);
  console.log(`Letra copiada: ${text.split('\n').length} linhas. Cole no .txt com Ctrl+V.`);
})();
