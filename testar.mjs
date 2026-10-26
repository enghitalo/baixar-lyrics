// Roda copiar_letra.js (o script do F12) em páginas reais do Genius com
// Playwright e mostra só estatísticas do que seria copiado: linhas,
// caracteres, marcações de seção e se vazou texto do site. Nunca imprime a letra.
//
//   node testar.mjs                  # duas músicas e uma página de busca
//   node testar.mjs URL [URL...]     # outras páginas
//   COM_SECOES=1 node testar.mjs     # testa mantendo [Chorus], [Verse 1] etc.
//
// Abre uma janela do Chromium: sem janela (headless) o Cloudflare do Genius
// bloqueia com "Just a moment...". Se aparecer a verificação, resolva na janela.

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const urls = process.argv.slice(2);
if (!urls.length) urls.push(
  'https://genius.com/Eagles-hotel-california-lyrics',
  'https://genius.com/Dolly-parton-jolene-lyrics',
  'https://genius.com/search?q=Dolly%20Parton%20Jolene',
);

let snippet = readFileSync(new URL('./copiar_letra.js', import.meta.url), 'utf8');
if (process.env.COM_SECOES) snippet = snippet.replace('const SEM_SECOES = true', 'const SEM_SECOES = false');

// copy() só existe no console do F12; aqui ele vira um stub que guarda o texto.
const probe = `(() => {
  const log = [], orig = { log: console.log, warn: console.warn };
  let copied = null;
  window.copy = t => { copied = t; };
  console.log = (...a) => log.push(String(a[0]).startsWith('Letra copiada') ? a[0] : '[texto da letra]');
  console.warn = (...a) => log.push('AVISO: ' + a[0]);
  try { ${snippet} } finally { Object.assign(console, orig); delete window.copy; }
  const text = copied ?? '', lines = copied ? text.split('\\n') : [];
  return {
    mensagem: log.join(' | '),
    copiou: copied !== null,
    linhas: lines.length,
    caracteres: text.length,
    secoes: lines.filter(l => /^\\[.*\\]$/.test(l.trim())).length,
    textoDoSite: /Contributors|Translations|Read More|Embed|You might also like/i.test(text),
    html: /<[a-z]/i.test(text),
  };
})()`;

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ bypassCSP: true });
const rows = {};
for (const url of urls) {
  const name = decodeURIComponent(new URL(url).pathname + new URL(url).search).slice(0, 45);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if ((await page.title()).startsWith('Just a moment')) {
      console.log(`Verificação do Cloudflare em ${name}: resolva na janela (espero até 60 s).`);
      await page.waitForFunction(() => !document.title.startsWith('Just a moment'), null, { timeout: 60000 })
        .catch(() => { throw new Error('bloqueado pela verificação do Cloudflare'); });
    }
    await page.waitForSelector('[data-lyrics-container="true"]', { timeout: 10000 }).catch(() => {});
    rows[name] = await page.evaluate(probe);
  } catch (err) {
    rows[name] = { mensagem: 'ERRO: ' + err.message.split('\n')[0] };
  }
}
await browser.close();
console.table(rows);
