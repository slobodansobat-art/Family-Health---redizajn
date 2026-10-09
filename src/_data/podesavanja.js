// Opšti podaci sajta (kontakt, adresa, radno vreme...). Menja se u CMS-u:
// "Podešavanja sajta" -> "Kontakt, adresa i opšti podaci".
// Izvor: src/sadrzaj/podesavanja.json
import fs from "node:fs";
export default () => JSON.parse(fs.readFileSync("src/sadrzaj/podesavanja.json", "utf8"));
