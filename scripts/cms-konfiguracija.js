// =============================================================================
// Automatski pravi src/admin/config.yml za Decap CMS.
// -----------------------------------------------------------------------------
// Zašto automatski: svaka stranica ima svoj JSON u src/sadrzaj/stranice.
// Ova skripta čita te fajlove i za svako polje bira odgovarajući unos u CMS-u
// (kratak tekst, dug tekst, slika, lista, broj, da/ne). Tako je CMS uvek
// usklađen sa sadržajem, bez ručnog održavanja velikog config.yml fajla.
//
// Pravila za nazive polja u JSON-u (važe za sve stranice):
//   - polje koje počinje sa "slika" ili se završava sa "Slika"  -> izbor slike
//   - polje koje se završava sa "Md"                          -> tekst sa formatiranjem
//                                                                (podebljano, link, liste)
//   - tekst duži od 90 znakova                                -> veće polje za tekst
//   - polja koja počinju sa "_" su tehnička (ne prikazuju se urednicima)
//   - "_naziv" u JSON-u stranice je naziv stranice u CMS-u
// Pokreće se pri svakoj izradi sajta (vidi eleventy.config.js).
// =============================================================================

import fs from "node:fs";
import path from "node:path";

const SADRZAJ = "src/sadrzaj";
const IZLAZ = "src/admin/config.yml";

const RECNIK = {
  cinjenice: "Činjenice", cesta: "Česta", pitanja: "pitanja", sta: "Šta", sledeci: "Sledeći",
  korak: "Korak", koraci: "Koraci", pocetna: "Početna", tekst: "Tekst", naslov: "Naslov",
  podnaslov: "Podnaslov", opis: "Opis", oznaka: "Oznaka", link: "Link", cena: "Cena",
  seo: "SEO (pretraživači)", hero: "Uvodni deo (hero)", faq: "Česta pitanja", stavke: "Stavke",
  kontakt: "Kontakt", forma: "Forma", dugme: "Dugme", napomena: "Napomena", vreme: "Vreme",
  uzorak: "Uzorak", rezultat: "Rezultat", rezultati: "Rezultati", paketi: "Paketi", paket: "Paket",
  lekar: "Lekar", lekari: "Lekari", trudnoca: "Trudnoća", maticne: "Matične", celije: "ćelije",
  poredjenje: "Poređenje", ucesce: "Učešće", nedelja: "Nedelja", pitanje: "Pitanje", odgovor: "Odgovor",
  zasto: "Zašto", sto: "Što", vise: "Više", izvor: "Izvor", izvori: "Izvori", nalaz: "Nalaz",
};

function oznaka(kljuc) {
  const reci = String(kljuc)
    .replace(/Md$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((r) => RECNIK[r.toLowerCase()] || r.toLowerCase());
  const tekst = reci.join(" ");
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

function jeSlika(kljuc) {
  return /^slika/i.test(kljuc) || /Slika$/.test(kljuc);
}

// Spaja ključeve svih objekata u nizu (stavke liste nemaju uvek ista polja).
function spojiObjekte(niz) {
  const spojen = {};
  for (const o of niz) {
    if (!o || typeof o !== "object" || Array.isArray(o)) continue;
    for (const [k, v] of Object.entries(o)) {
      if (!(k in spojen) || spojen[k] === null || spojen[k] === "") spojen[k] = v;
      else if (Array.isArray(v) && Array.isArray(spojen[k])) spojen[k] = spojen[k].concat(v);
      else if (typeof v === "string" && typeof spojen[k] === "string" && v.length > spojen[k].length) spojen[k] = v;
    }
  }
  return spojen;
}

function polje(kljuc, vrednost) {
  const osnovno = { name: kljuc, label: oznaka(kljuc), required: false };
  if (kljuc.startsWith("_")) return { ...osnovno, widget: "hidden" };
  if (jeSlika(kljuc)) return { ...osnovno, widget: "image", choose_url: false };
  if (typeof vrednost === "boolean") return { ...osnovno, widget: "boolean" };
  if (typeof vrednost === "number") {
    return Number.isInteger(vrednost)
      ? { ...osnovno, widget: "number", value_type: "int" }
      : { ...osnovno, widget: "number", value_type: "float" };
  }
  if (Array.isArray(vrednost)) {
    const objekti = vrednost.filter((v) => v && typeof v === "object" && !Array.isArray(v));
    if (objekti.length) {
      const uzor = spojiObjekte(objekti);
      const polja = Object.entries(uzor).map(([k, v]) => polje(k, v));
      const prvoTekstualno = polja.find((p) => p.widget === "string" || p.widget === "text");
      return {
        ...osnovno,
        widget: "list",
        collapsed: true,
        ...(prvoTekstualno ? { summary: `{{fields.${prvoTekstualno.name}}}` } : {}),
        fields: polja,
      };
    }
    const dugacak = vrednost.some((v) => typeof v === "string" && v.length > 90);
    const brojevi = vrednost.length && vrednost.every((v) => typeof v === "number");
    return {
      ...osnovno,
      widget: "list",
      field: brojevi
        ? { name: "stavka", label: "Stavka", widget: "number", value_type: "float" }
        : { name: "stavka", label: "Stavka", widget: dugacak ? "text" : "string" },
    };
  }
  if (vrednost && typeof vrednost === "object") {
    return {
      ...osnovno,
      widget: "object",
      collapsed: true,
      fields: Object.entries(vrednost).map(([k, v]) => polje(k, v)),
    };
  }
  if (/Md$/.test(kljuc)) {
    return { ...osnovno, widget: "markdown", buttons: ["bold", "italic", "link", "bulleted-list", "numbered-list"], editor_components: [], modes: ["rich_text"] };
  }
  const tekst = String(vrednost ?? "");
  return { ...osnovno, widget: tekst.length > 90 || tekst.includes("\n") ? "text" : "string" };
}

function citajJson(fajl) {
  return JSON.parse(fs.readFileSync(fajl, "utf8"));
}

function jsonFajlovi(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

// --- YAML ispis (dovoljan za ovu namenu, bez dodatnih paketa) ---------------
function yamlVrednost(v) {
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  return JSON.stringify(String(v));
}
function uYaml(vrednost, uvlaka = 0) {
  const p = " ".repeat(uvlaka);
  if (Array.isArray(vrednost)) {
    if (!vrednost.length) return " []";
    return vrednost
      .map((stavka) => {
        if (stavka && typeof stavka === "object") {
          const unutra = uYaml(stavka, uvlaka + 2).replace(/^\n\s*/, "");
          return `\n${p}- ${unutra}`;
        }
        return `\n${p}- ${yamlVrednost(stavka)}`;
      })
      .join("");
  }
  if (vrednost && typeof vrednost === "object") {
    return Object.entries(vrednost)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => {
        if (v && typeof v === "object") return `\n${p}${k}:${uYaml(v, uvlaka + 2)}`;
        return `\n${p}${k}: ${yamlVrednost(v)}`;
      })
      .join("");
  }
  return ` ${yamlVrednost(vrednost)}`;
}

export function napraviCmsKonfiguraciju() {
  const podesavanja = fs.existsSync(`${SADRZAJ}/podesavanja.json`) ? citajJson(`${SADRZAJ}/podesavanja.json`) : {};
  const cms = podesavanja.cms || {};

  // 1) Opšta podešavanja i navigacija
  const opste = {
    name: "podesavanja",
    label: "Podešavanja sajta",
    editor: { preview: false },
    files: ["podesavanja", "navigacija"]
      .filter((ime) => fs.existsSync(`${SADRZAJ}/${ime}.json`))
      .map((ime) => {
        const podaci = citajJson(`${SADRZAJ}/${ime}.json`);
        return {
          name: ime,
          label: ime === "podesavanja" ? "Kontakt, adresa i opšti podaci" : "Meniji i futer",
          file: `${SADRZAJ}/${ime}.json`,
          fields: Object.entries(podaci).map(([k, v]) => polje(k, v)),
        };
      }),
  };

  // 2) Stranice: jedan unos po JSON fajlu u src/sadrzaj/stranice
  const stranice = {
    name: "stranice",
    label: "Stranice",
    editor: { preview: false },
    files: jsonFajlovi(`${SADRZAJ}/stranice`).map((f) => {
      const podaci = citajJson(`${SADRZAJ}/stranice/${f}`);
      const ime = path.basename(f, ".json");
      return {
        name: ime,
        label: podaci._naziv || oznaka(ime),
        file: `${SADRZAJ}/stranice/${f}`,
        fields: Object.entries(podaci).map(([k, v]) => polje(k, v)),
      };
    }),
  };

  // 3) Onko analize: svaka analiza je poseban fajl; nove se dodaju iz CMS-a
  const sveAnalize = jsonFajlovi(`${SADRZAJ}/analize`).map((f) => citajJson(`${SADRZAJ}/analize/${f}`));
  const uzorAnalize = spojiObjekte(sveAnalize);
  const analize = {
    name: "analize",
    label: "Onko analize",
    label_singular: "analizu",
    folder: `${SADRZAJ}/analize`,
    extension: "json",
    format: "json",
    create: true,
    slug: "{{slug}}",
    identifier_field: "naziv",
    summary: "{{naziv}}",
    sortable_fields: ["redosled", "naziv"],
    editor: { preview: false },
    fields: Object.entries(uzorAnalize).map(([k, v]) => {
      const p = polje(k, v);
      if (k === "naziv") p.required = true;
      if (k === "slug") p.hint = "Deo adrese stranice, npr. cancer-precision. Samo mala slova, brojevi i crtice.";
      if (k === "imaStranicu") p.hint = "Uključite kada analiza ima svoju stranicu (pravi se po šablonu Cancer Precision).";
      return p;
    }),
  };

  // 4) Blog
  const blog = {
    name: "blog",
    label: "Blog",
    label_singular: "članak",
    folder: `${SADRZAJ}/blog`,
    extension: "md",
    format: "frontmatter",
    create: true,
    slug: "{{slug}}",
    identifier_field: "naslov",
    summary: "{{naslov}} ({{kategorija}})",
    sortable_fields: ["datum", "naslov", "kategorija"],
    fields: [
      { name: "naslov", label: "Naslov", widget: "string" },
      { name: "opis", label: "Kratak opis (lista članaka i Google)", widget: "text", required: false },
      { name: "kategorija", label: "Kategorija", widget: "select", options: ["Trudnoća", "Prenatalni testovi", "Matične ćelije", "Onkogenetika", "Genetika"] },
      { name: "datum", label: "Datum objave", widget: "datetime", format: "YYYY-MM-DD", date_format: "DD.MM.YYYY.", time_format: false, required: false },
      { name: "vremeCitanja", label: "Vreme čitanja (npr. 4 min)", widget: "string", required: false },
      { name: "autor", label: "Autor", widget: "string", required: false },
      { name: "autorUloga", label: "Uloga autora", widget: "string", required: false },
      { name: "slika", label: "Glavna fotografija", widget: "image", required: false, choose_url: false },
      { name: "slikaOpis", label: "Opis fotografije (za slepe i Google)", widget: "string", required: false },
      { name: "istaknuto", label: "Istaknut članak na vrhu bloga", widget: "boolean", default: false, required: false },
      { name: "kalkulatorTrudnoce", label: "Prikaži kalkulator nedelje trudnoće", widget: "boolean", default: false, required: false },
      { name: "predlogTeme", label: "Predlog teme (tekst još nije napisan)", widget: "boolean", default: false, required: false },
      { name: "body", label: "Tekst članka", widget: "markdown" },
    ],
  };

  const konfiguracija = {
    backend: {
      name: "github",
      repo: cms.repo || "slobodansobat-art/familyhealth-sajt",
      branch: cms.grana || "main",
      ...(cms.authEndpoint ? { auth_endpoint: cms.authEndpoint } : {}),
      ...(cms.baseUrl ? { base_url: cms.baseUrl } : {}),
      commit_messages: {
        create: "CMS: dodato {{collection}} „{{slug}}“",
        update: "CMS: izmenjeno {{collection}} „{{slug}}“",
        delete: "CMS: obrisano {{collection}} „{{slug}}“",
        uploadMedia: "CMS: dodata slika „{{path}}“",
        deleteMedia: "CMS: obrisana slika „{{path}}“",
      },
    },
    local_backend: true,
    // Jezik CMS-a: hrvatski je najbliži srpskoj latinici (Decap ima srpski samo na ćirilici)
    locale: "hr",
    site_url: (podesavanja.sajt && podesavanja.sajt.url) || "",
    display_url: (podesavanja.sajt && podesavanja.sajt.url) || "",
    logo_url: "/assets/slike/logo-cms.svg",
    media_folder: "src/assets/slike",
    public_folder: "/assets/slike",
    slug: { encoding: "ascii", clean_accents: true, sanitize_replacement: "-" },
    collections: [opste, stranice, analize, blog],
  };

  const zaglavlje =
    "# =============================================================================\n" +
    "# OVAJ FAJL SE PRAVI AUTOMATSKI (scripts/cms-konfiguracija.js) pri svakoj izradi.\n" +
    "# Ne menjati ručno: izmene će biti pregažene. Menja se skripta ili sadržaj.\n" +
    "# =============================================================================\n";
  const yaml = zaglavlje + uYaml(konfiguracija).replace(/^\n/, "") + "\n";
  fs.mkdirSync(path.dirname(IZLAZ), { recursive: true });
  const stari = fs.existsSync(IZLAZ) ? fs.readFileSync(IZLAZ, "utf8") : "";
  if (stari !== yaml) fs.writeFileSync(IZLAZ, yaml);
}
