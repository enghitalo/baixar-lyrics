// Download único de letras em domínio público do Genius
const fs = require('fs'), path = require('path');
const { chromium } = require('/home/hitalo/Music/genius-teste/node_modules/playwright');
const OUT = path.join(process.env.HOME, 'Music', 'letras-dominio-publico');

const SONGS = [
  ['21 Savage', 'a lot', '/21-savage-a-lot-lyrics'],
  ['4 Non Blondes', 'What\'s Up?', '/4-non-blondes-whats-up-lyrics'],
  ['Lukas Graham', '7 Years', '/Lukas-graham-7-years-lyrics'],
  ['Johnny Cash', 'A Boy Named Sue', '/Johnny-cash-a-boy-named-sue-lyrics'],
  ['Avicii', 'Wake Me Up', '/Avicii-wake-me-up-lyrics'],
  ['Bill Withers', 'Grandma\'s Hands', '/Bill-withers-grandmas-hands-lyrics'],
  ['Billy Joel', 'Piano Man', '/Billy-joel-piano-man-lyrics'],
  ['Billy Joel', 'Vienna', '/Billy-joel-vienna-lyrics'],
  ['Megan Thee Stallion', 'Body', '/Megan-thee-stallion-body-lyrics'],
  ['Rednex', 'Cotton Eye Joe', '/Rednex-cotton-eye-joe-lyrics'],
  ['Cyndi Lauper', 'Girls Just Want to Have Fun', '/Cyndi-lauper-girls-just-want-to-have-fun-lyrics'],
  ['Demi Lovato', 'Sober', '/Demi-lovato-sober-lyrics'],
  ['Two Gallants', 'Despite What You\'ve Been Told', '/Two-gallants-despite-what-youve-been-told-lyrics'],
  ['Dolly Parton', 'Jolene', '/Dolly-parton-jolene-lyrics'],
  ['Edith Whiskers', 'Home', '/Edith-whiskers-home-lyrics'],
  ['Elle King', 'My Neck, My Back', '/Elle-king-my-neck-my-back-lyrics'],
  ['ABBA', 'Dancing Queen', '/Abba-dancing-queen-lyrics'],
  ['Harry Chapin', 'Cat\'s in the Cradle', '/Harry-chapin-cats-in-the-cradle-lyrics'],
  ['Eagles', 'Hotel California', '/Eagles-hotel-california-lyrics'],
  ['J. Cole', 'MIDDLE CHILD', '/J-cole-middle-child-lyrics'],
  ['J. Cole', 'No Role Modelz', '/J-cole-no-role-modelz-lyrics'],
  ['John Denver', 'Take Me Home, Country Roads', '/John-denver-take-me-home-country-roads-lyrics'],
  ['Kendrick Lamar', 'Swimming Pools (Drank)', '/Kendrick-lamar-swimming-pools-drank-lyrics'],
  ['Eminem', 'Kim', '/Eminem-kim-lyrics'],
  ['Lil Dicky', 'Lemme Freak', '/Lil-dicky-lemme-freak-lyrics'],
  ['Lil Dicky', 'Professional Rapper', '/Lil-dicky-professional-rapper-lyrics'],
  ['Teddy Swims', 'Lose Control', '/Teddy-swims-lose-control-lyrics'],
  ['Lukas Graham', 'Mama Said', '/Lukas-graham-mama-said-lyrics'],
  ['Martin Garrix & Bebe Rexha', 'In The Name Of Love', '/Martin-garrix-and-bebe-rexha-in-the-name-of-love-lyrics'],
  ['Neil Diamond', 'Sweet Caroline', '/Neil-diamond-sweet-caroline-lyrics'],
  ['NF', 'The Search', '/Nf-the-search-lyrics'],
  ['Oasis', 'Wonderwall', '/Oasis-wonderwall-lyrics'],
  ['Passenger', 'Let Her Go', '/Passenger-let-her-go-lyrics'],
  ['Plain White T\'s', 'Hey There Delilah', '/Plain-white-ts-hey-there-delilah-lyrics'],
  ['P!nk', 'Just Give Me a Reason', '/P-nk-just-give-me-a-reason-lyrics'],
  ['Rihanna', 'California King Bed', '/Rihanna-california-king-bed-lyrics'],
  ['The Dubliners', 'Rocky Road to Dublin', '/The-dubliners-rocky-road-to-dublin-lyrics'],
  ['Taylor Swift', 'Love Story', '/Taylor-swift-love-story-lyrics'],
  ['Temper City', 'Self Aware', '/Temper-city-self-aware-lyrics'],
  ['The Cranberries', 'Zombie', '/The-cranberries-zombie-lyrics'],
  ['Travie McCoy', 'Billionaire', '/Travie-mccoy-billionaire-lyrics'],
  ['Wham!', 'Last Christmas', '/Wham-last-christmas-lyrics']
];

const snippet = `
  const SEM_SECOES = true;
  const boxes = document.querySelectorAll('[data-lyrics-container="true"]');
  if (!boxes.length) return;
  let text = [...boxes].map(box => {
    const clone = box.cloneNode(true);
    clone.querySelectorAll('[data-exclude-from-selection="true"]').forEach(el => el.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\\n'));
    return clone.textContent.trim();
  }).join('\\n\\n');
  if (SEM_SECOES) text = text.replace(/^\\[.*\\]$/gm, '');
  text = text.replace(/\\n{3,}/g, '\\n\\n').trim();
  if (typeof copy === 'function') copy(text); else console.log(text);
`;

const grab = `(() => { let c = null; window.copy = t => { c = t; }; const l = console.log, w = console.warn;
  console.log = () => {}; console.warn = () => {};
  try { ${snippet} } finally { console.log = l; console.warn = w; delete window.copy; } return c; })()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ bypassCSP: true });
  
  for (const [artist, title, p] of SONGS) {
    const url = 'https://genius.com' + p;
    const file = path.join(OUT, `${artist} - ${title}.txt`.replace(/[\/:]/g, '-'));
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if ((await page.title()).startsWith('Just a moment'))
        await page.waitForFunction(() => !document.title.startsWith('Just a moment'), null, { timeout: 60000 });
      await page.waitForSelector('[data-lyrics-container="true"]', { timeout: 15000 }).catch(() => {});
      
      const text = await page.evaluate(grab);
      if (!text) { console.log(`SEM LETRA  ${artist} - ${title}`); continue; }
      
      fs.writeFileSync(file, `${artist} - ${title}\nLetra: ${url}\n\n${text}\n`);
      console.log(`ok ${String(text.split('\n').length).padStart(3)} linhas  ${path.basename(file)}`);
    } catch (e) {
      console.log(`ERRO  ${artist} - ${title}: ${e.message.split('\n')[0]}`);
    }
    await page.waitForTimeout(2000);
  }
  await browser.close();
})();
