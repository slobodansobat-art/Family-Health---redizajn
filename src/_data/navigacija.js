// Meniji (zaglavlje, padajući meniji, mobilni meni) i futer.
// Izvor: src/sadrzaj/navigacija.json (CMS: "Podešavanja sajta" -> "Meniji i futer").
import fs from "node:fs";
export default () => JSON.parse(fs.readFileSync("src/sadrzaj/navigacija.json", "utf8"));
