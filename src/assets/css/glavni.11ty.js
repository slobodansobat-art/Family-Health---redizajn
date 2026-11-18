// =============================================================================
// Spaja sve CSS fajlove u jedan (/assets/css/glavni.css) da bi sajt učitavao
// jedan fajl umesto dvadesetak. Redosled:
//   1. 01-tokeni.css      boje, fontovi, razmaci
//   2. 02-osnova.css      reset, tipografija, dugmad, pomoćne klase
//   3. komponente/*.css   zaglavlje, futer, forme, koraci, česta pitanja...
//   4. stranice/*.css     stilovi pojedinačnih stranica (po abecedi)
//   5. LAPTOP (generiše se ovde, automatski): na nižim desktop ekranima
//      (laptop, laptop na televizoru, Windows uvećanje 125–150%) veliki
//      naslovi su ~13% manji, a veliki vertikalni razmaci ~25% manji.
//      Ništa se ne piše ručno: pravila se računaju iz CSS-a iznad, pa
//      važe i za nove stilove. Telefon i tablet (ispod 960px) se ne menjaju.
// Novi CSS fajl u folderu komponente/ ili stranice/ se automatski uključuje.
// =============================================================================
import fs from "node:fs";
import path from "node:path";

const KOREN = "src/assets/css";

// Kada važi laptop razmera: desktop raspored, a ekran uzak ili nizak.
const LAPTOP_USLOV = "(min-width: 960px) and (max-width: 1366px), (min-width: 960px) and (max-height: 820px)";
const FAKTOR_FONT = 0.87;      // naslovi i veliki brojevi (font-size >= 28px)
const FAKTOR_RAZMAK = 0.75;    // vertikalni razmaci sekcija (>= 64px)
const FAKTOR_VISINA = 0.86;    // velike fiksne visine blokova (>= 560px, bez position:absolute)

function fajloviIz(folder) {
  const pun = path.join(KOREN, folder);
  if (!fs.existsSync(pun)) return [];
  return fs.readdirSync(pun).filter((f) => f.endsWith(".css")).sort().map((f) => path.join(folder, f));
}

// Rastavlja CSS na pravila prvog nivoa: { selektor, telo } ili { media, pravila }.
function rastavi(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  let i = 0;
  while (i < css.length) {
    const otv = css.indexOf("{", i);
    if (otv < 0) break;
    const glava = css.slice(i, otv).trim();
    let dub = 1, j = otv + 1;
    while (j < css.length && dub > 0) { if (css[j] === "{") dub++; else if (css[j] === "}") dub--; j++; }
    const telo = css.slice(otv + 1, j - 1);
    if (glava.startsWith("@media")) out.push({ media: glava.slice(6).trim(), pravila: rastavi(telo) });
    else if (!glava.startsWith("@")) out.push({ selektor: glava, telo });
    i = j;
  }
  return out;
}

const px = (v, f) => `${Math.round(parseFloat(v) * f)}px`;
const skaliraj = (vrednost, f) =>
  vrednost.replace(/(\d+(?:\.\d+)?)(px|vw|cqi)/g, (_, n, j) => j === "px" ? px(n, f) : `${+(parseFloat(n) * f).toFixed(2)}${j}`);

// Iz jednog pravila pravi umanjenu verziju (ili null ako nema šta da se menja).
function umanji(telo) {
  const dekl = telo.split(";").map((d) => d.trim()).filter(Boolean);
  const apsolutno = dekl.some((d) => /^position\s*:\s*absolute/.test(d));
  const nove = [];
  for (const d of dekl) {
    const m = d.match(/^([a-z-]+)\s*:\s*(.+)$/i);
    if (!m) continue;
    const [, svojstvo, vrednost] = m;
    if (svojstvo === "font-size") {
      const brojevi = [...vrednost.matchAll(/(\d+(?:\.\d+)?)px/g)].map((x) => +x[1]);
      if (brojevi.length && Math.max(...brojevi) >= 28) nove.push(`font-size: ${skaliraj(vrednost, FAKTOR_FONT)}`);
    } else if (/^padding(-block|-top|-bottom)?$/.test(svojstvo)) {
      const delovi = vrednost.split(/\s+/);
      // padding: 1 vrednost važi i levo-desno, pa se ne dira; inače su vertikalne 1. i 3. vrednost
      if (svojstvo === "padding" && delovi.length === 1) continue;
      let promena = false;
      const novi = delovi.map((v, k) => {
        const vertikalan = svojstvo === "padding" ? (k === 0 || k === 2) : true;
        const b = v.match(/^(\d+)px$/);
        if (vertikalan && b && +b[1] >= 64) { promena = true; return px(b[1], FAKTOR_RAZMAK); }
        return v;
      });
      if (promena) nove.push(`${svojstvo}: ${novi.join(" ")}`);
    } else if ((svojstvo === "height" || svojstvo === "min-height") && !apsolutno) {
      const b = vrednost.match(/^(\d+)px$/);
      if (b && +b[1] >= 560) nove.push(`${svojstvo}: ${px(b[1], FAKTOR_VISINA)}`);
    }
  }
  return nove.length ? nove.join("; ") : null;
}

function laptopCss(fajlovi) {
  const delovi = [":root { --sekcija: 72px; }"];
  const ugnjezdeni = [];
  for (const f of fajlovi) {
    for (const p of rastavi(fs.readFileSync(path.join(KOREN, f), "utf8"))) {
      if (p.selektor) {
        if (/logo/.test(p.selektor)) continue;   // logo ostaje iste veličine
        const u = umanji(p.telo);
        if (u) delovi.push(`${p.selektor} { ${u}; }`);
      } else if (p.media) {
        // pravila za desktop opseg (npr. 960–1100px) zadržavaju svoj uslov; mobilna se preskaču
        const maks = p.media.match(/max-width:\s*(\d+)px/);
        if ((maks && +maks[1] < 960) || /prefers-reduced-motion|print/.test(p.media)) continue;
        const unutra = p.pravila.filter((r) => r.selektor).map((r) => [r.selektor, umanji(r.telo)]).filter(([, u]) => u);
        if (unutra.length) ugnjezdeni.push(`@media ${p.media} {\n${unutra.map(([s, u]) => `  ${s} { ${u}; }`).join("\n")}\n}`);
      }
    }
  }
  return `/* ===== LAPTOP razmera (generisano u glavni.11ty.js) ===== */\n@media ${LAPTOP_USLOV} {\n${delovi.join("\n")}\n${ugnjezdeni.join("\n")}\n}`;
}

export default class {
  data() {
    return { permalink: "/assets/css/glavni.css", eleventyExcludeFromCollections: true };
  }
  render() {
    const redosled = ["01-tokeni.css", "02-osnova.css", ...fajloviIz("komponente"), ...fajloviIz("stranice")];
    return redosled
      .map((f) => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(KOREN, f), "utf8"))
      .join("\n\n") + "\n\n" + laptopCss(redosled.slice(1));
  }
}
