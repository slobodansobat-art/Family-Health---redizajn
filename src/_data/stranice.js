// Sadržaj svih stranica. Svaka stranica ima svoj JSON u src/sadrzaj/stranice.
// U šablonu: stranice.harmony.hero.naslov  (harmony = ime fajla harmony.json)
import fs from "node:fs";
import path from "node:path";

const FOLDER = "src/sadrzaj/stranice";

export default () => {
  const stranice = {};
  for (const fajl of fs.readdirSync(FOLDER).filter((f) => f.endsWith(".json"))) {
    const kljuc = path.basename(fajl, ".json").replace(/-([a-z])/g, (_, s) => s.toUpperCase());
    stranice[kljuc] = JSON.parse(fs.readFileSync(path.join(FOLDER, fajl), "utf8"));
  }
  return stranice;
};
