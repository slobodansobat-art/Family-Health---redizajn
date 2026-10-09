// Onko analize: svaka analiza je poseban JSON u src/sadrzaj/analize.
// Koristi se u katalogu (/onkogenetika/analize/), u meniju i za stranice analiza.
// Analiza sa "imaStranicu": true dobija stranicu po šablonu Cancer Precision.
import fs from "node:fs";
import path from "node:path";

const FOLDER = "src/sadrzaj/analize";

export default () =>
  fs
    .readdirSync(FOLDER)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const a = JSON.parse(fs.readFileSync(path.join(FOLDER, f), "utf8"));
      a.slug = a.slug || path.basename(f, ".json");
      // Adresa: posebna stranica (npr. Cancer Neo), stranica po šablonu, ili katalog.
      a.url = a.posebanLink || (a.imaStranicu ? `/onkogenetika/analize/${a.slug}/` : `/onkogenetika/analize/#${a.slug}`);
      return a;
    })
    .sort((a, b) => (a.redosled ?? 999) - (b.redosled ?? 999) || String(a.naziv).localeCompare(String(b.naziv), "sr"));
