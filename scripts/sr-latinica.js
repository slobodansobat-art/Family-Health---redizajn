#!/usr/bin/env node
// =============================================================================
// Prevod interfejsa Decap CMS-a na srpsku latinicu -> src/admin/sr-latinica.js
// -----------------------------------------------------------------------------
// Decap ima srpski samo na ćirilici (sr_Cyrl, paket decap-cms-locales). Ova
// skripta ga presloviva na latinicu, ispravlja reči gde preslovljavanje nije
// dovoljno (POPRAVKE, PO_KLJUCU) i dodaje prevode koji u sr_Cyrl nedostaju
// (DODATO). Rezultat je statičan fajl u repou koji se učitava posle Decap-a
// (src/admin/index.html) i registruje jezik "sr_Latn" (config.yml: locale).
//
// Pokreće se ručno, samo kad se menja verzija Decap-a u src/admin/index.html:
//   1. u package.json staviti decap-cms-locales iste verzije koju koristi
//      decap-cms-app te verzije (npm view decap-cms-app@<verzija> dependencies)
//   2. npm install && npm run cms-prevod
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IZLAZ = path.join(KOREN, "src/admin/sr-latinica.js");
const require = createRequire(import.meta.url);
const paket = require("decap-cms-locales/package.json");
const { default: sr } = await import("decap-cms-locales/dist/esm/sr_Cyrl/index.js");
const { default: en } = await import("decap-cms-locales/dist/esm/en/index.js");

// --- Preslovljavanje ---------------------------------------------------------
const AZBUKA = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Ђ: "Đ", Е: "E", Ж: "Ž", З: "Z", И: "I", Ј: "J", К: "K",
  Л: "L", Љ: "Lj", М: "M", Н: "N", Њ: "Nj", О: "O", П: "P", Р: "R", С: "S", Т: "T", Ћ: "Ć", У: "U",
  Ф: "F", Х: "H", Ц: "C", Ч: "Č", Џ: "Dž", Ш: "Š",
};
function preslovi(tekst) {
  // Velika slova dvoslova (Љ, Њ, Џ) u reči pisanoj velikim slovima -> LJ, NJ, DŽ
  return tekst.replace(/[Ѐ-ӿ]+/g, (rec) => {
    const svaVelika = rec.length > 1 && rec === rec.toUpperCase();
    let out = "";
    for (const z of rec) {
      const veliko = z.toUpperCase();
      const lat = AZBUKA[veliko];
      if (lat === undefined) { out += z; continue; }
      out += z === veliko ? (svaVelika ? lat.toUpperCase() : lat) : lat.toLowerCase();
    }
    return out;
  });
}

// --- Ispravke posle preslovljavanja (redom; cele reči) -----------------------
const POPRAVKE = [
  [/„([^"“]*)"/g, "„$1“"],                 // zatvoreni navodnik
  [/\bOdaberi\b/g, "Izaberi"], [/\bodabrane\b/g, "izabrane"],
  [/\bKreiraj\b/g, "Napravi"], [/\bkreiraj\b/g, "napravi"],
  [/\bZbirke\b/g, "Celine"], [/\bzbirke\b/g, "celine"],
  [/\bMedijska sredstva\b/g, "Slike i fajlovi"],
  [/\bmedijske datoteke\b/g, "fajlove"],
];

// Prevodi po ključu (gde je bolje napisati ceo tekst)
const PO_KLJUCU = {
  "app.header.media": "Slike i fajlovi",
  "collection.sidebar.collections": "Sadržaj sajta",
  "collection.sidebar.allCollections": "Sav sadržaj",
  "collection.collectionTop.newButtonAriaLabel": "Napravi novi unos: %{collectionLabel}",
  "editor.editorToolbar.duplicate": "Dupliraj",
  "editor.editorToolbar.backCollection": "Uređujete: %{collectionLabel}",
  "editor.editorToolbar.deployButtonLabel": "Pogledaj na sajtu",
  "editor.editorWidgets.markdown.link": "Link",
  "editor.editorWidgets.markdown.linkPrompt": "Unesite adresu linka",
  "editor.editorWidgets.markdown.bulletedList": "Lista sa tačkama",
  "editor.editorWidgets.markdown.richText": "Formatiran tekst",
  "editor.editorWidgets.markdown.toggleMode.rich": "Prebaci na formatiran tekst",
  "editor.editorWidgets.image.chooseUrl": "Unesi adresu (URL)",
  "editor.editorWidgets.image.replaceUrl": "Zameni adresom (URL)",
  "editor.editorWidgets.image.promptUrl": "Unesite adresu (URL) slike",
  "editor.editorWidgets.file.choose": "Izaberi fajl",
  "editor.editorWidgets.file.chooseUrl": "Unesi adresu (URL)",
  "editor.editorWidgets.file.chooseMultiple": "Izaberi fajlove",
  "editor.editorWidgets.file.replaceUrl": "Zameni adresom (URL)",
  "editor.editorWidgets.file.promptUrl": "Unesite adresu (URL) fajla",
  "editor.editorWidgets.file.chooseDifferent": "Izaberi drugi fajl",
  "editor.editorWidgets.file.addMore": "Dodaj još fajlova",
  "editor.editorWidgets.file.remove": "Ukloni fajl",
  "editor.editorWidgets.file.removeAll": "Ukloni sve fajlove",
  "editor.editorWidgets.object.expand": "Otvori",
  "editor.editorWidgets.object.collapse": "Zatvori",
  "app.app.checkConfigYml": "Proverite fajl config.yml.",
  "mediaLibrary.mediaLibrary.fileTooLarge": "Fajl je prevelik.\nNajveća dozvoljena veličina je %{size} kB.",
  "mediaLibrary.mediaLibraryModal.noAssetsFound": "Nema fajlova.",
  "mediaLibrary.mediaLibraryModal.uploading": "Otpremanje...",
  "mediaLibrary.mediaLibraryModal.upload": "Otpremi",
  "ui.errorBoundary.recoveredEntry.copyButtonLabel": "Kopiraj",
  "ui.toast.onBackendDown": "Servis za čuvanje trenutno ne radi. Više informacija: %{details}",
};

// Ključevi koji u sr_Cyrl ne postoje (inače bi bili na engleskom)
const DODATO = {
  "auth.loginWithForgejo": "Prijavite se preko Forgejo",
  "collection.entries.unpublishedHeader": "Neobjavljeni unosi",
  "editor.editorInterface.toggleNotes": "Prikaži/sakrij beleške",
  "editor.editorNotesPane.title": "Beleške",
  "editor.editorNotesPane.emptyState": "Još nema beležaka. Dodajte prvu belešku ispod.",
  "editor.editorNotesPane.addNote": "Dodaj belešku",
  "editor.editorNotesPane.addPlaceholder": "Dodajte belešku...",
  "editor.editorNotesPane.editPlaceholder": "Izmenite belešku...",
  "editor.editorNotesPane.save": "Sačuvaj",
  "editor.editorNotesPane.cancel": "Otkaži",
  "editor.editorNotesPane.edit": "Izmeni",
  "editor.editorNotesPane.delete": "Obriši",
  "editor.editorNotesPane.resolve": "Označi kao rešeno",
  "editor.editorNotesPane.unresolve": "Vrati kao nerešeno",
  "editor.editorNotesPane.confirmDelete": "Da li ste sigurni da želite da obrišete ovu belešku?",
  "editor.editorNotesPane.shortcut": "Savet: Ctrl+Enter brzo dodaje belešku",
  "ui.toast.noteAdded": "Beleška je dodata",
  "ui.toast.onFailToAddNote": "Beleška nije dodata: %{details}",
  "ui.toast.noteUpdated": "Beleška je izmenjena",
  "ui.toast.onFailToUpdateNote": "Beleška nije izmenjena: %{details}",
  "ui.toast.noteDeleted": "Beleška je obrisana",
  "ui.toast.onFailToDeleteNote": "Beleška nije obrisana: %{details}",
  "ui.toast.noteResolved": "Beleška je označena kao rešena",
  "ui.toast.noteReopened": "Beleška je ponovo otvorena",
  "ui.toast.onFailToToggleNote": "Status beleške nije promenjen: %{details}",
};

// --- Sastavljanje ------------------------------------------------------------------
const postavi = (obj, putanja, vrednost) => {
  const delovi = putanja.split(".");
  let o = obj;
  for (const d of delovi.slice(0, -1)) o = o[d] = o[d] && typeof o[d] === "object" ? o[d] : {};
  o[delovi[delovi.length - 1]] = vrednost;
};
const ravno = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? ravno(v, `${p}${k}.`) : [[`${p}${k}`, v]]));

const rezultat = {};
const nedostaje = [];
const srRavno = new Map(ravno(sr));
for (const [kljuc, engleski] of ravno(en)) {
  let tekst;
  if (PO_KLJUCU[kljuc]) tekst = PO_KLJUCU[kljuc];
  else if (srRavno.has(kljuc)) {
    tekst = preslovi(String(srRavno.get(kljuc)));
    for (const [re, zamena] of POPRAVKE) tekst = tekst.replace(re, zamena);
  } else if (DODATO[kljuc]) tekst = DODATO[kljuc];
  else { tekst = engleski; nedostaje.push(kljuc); }
  postavi(rezultat, kljuc, tekst);
}

const sadrzaj =
  "/* =============================================================================\n" +
  "   Decap CMS: interfejs na srpskoj latinici (jezik \"sr_Latn\").\n" +
  `   Napravljeno skriptom scripts/sr-latinica.js iz decap-cms-locales@${paket.version} (sr_Cyrl).\n` +
  "   Ne menjati ručno: izmene idu u skriptu (POPRAVKE, PO_KLJUCU, DODATO).\n" +
  "   Učitava se u src/admin/index.html posle decap-cms.js; config.yml: locale: \"sr_Latn\".\n" +
  "   ============================================================================= */\n" +
  `CMS.registerLocale("sr_Latn", ${JSON.stringify(rezultat, null, 2)});\n`;
fs.writeFileSync(IZLAZ, sadrzaj);
console.log(`Upisano: ${path.relative(KOREN, IZLAZ)} (${ravno(rezultat).length} tekstova)`);
if (nedostaje.length) console.warn(`Bez prevoda (ostaje engleski), dodati u DODATO:\n  ${nedostaje.join("\n  ")}`);
const cirilica = ravno(rezultat).filter(([, v]) => /[Ѐ-ӿ]/.test(v));
if (cirilica.length) console.warn("Ostala ćirilica:", cirilica);
