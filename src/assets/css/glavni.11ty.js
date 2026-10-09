// =============================================================================
// Spaja sve CSS fajlove u jedan (/assets/css/glavni.css) da bi sajt učitavao
// jedan fajl umesto dvadesetak. Redosled:
//   1. 01-tokeni.css      boje, fontovi, razmaci
//   2. 02-osnova.css      reset, tipografija, dugmad, pomoćne klase
//   3. komponente/*.css   zaglavlje, futer, forme, koraci, česta pitanja...
//   4. stranice/*.css     stilovi pojedinačnih stranica (po abecedi)
// Novi CSS fajl u folderu komponente/ ili stranice/ se automatski uključuje.
// =============================================================================
import fs from "node:fs";
import path from "node:path";

const KOREN = "src/assets/css";

function fajloviIz(folder) {
  const pun = path.join(KOREN, folder);
  if (!fs.existsSync(pun)) return [];
  return fs.readdirSync(pun).filter((f) => f.endsWith(".css")).sort().map((f) => path.join(folder, f));
}

export default class {
  data() {
    return { permalink: "/assets/css/glavni.css", eleventyExcludeFromCollections: true };
  }
  render() {
    const redosled = ["01-tokeni.css", "02-osnova.css", ...fajloviIz("komponente"), ...fajloviIz("stranice")];
    return redosled
      .map((f) => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(KOREN, f), "utf8"))
      .join("\n\n");
  }
}
