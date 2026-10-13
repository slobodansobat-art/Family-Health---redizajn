#!/usr/bin/env node
// =============================================================================
// Generator CMS konfiguracije (src/admin/config.yml) za Decap CMS.
// -----------------------------------------------------------------------------
// VAŽNO: ovo je RUČNA skripta. Ne pokreće se pri izradi sajta.
//   src/admin/config.yml je fiksan fajl u repou: CMS forma ne zavisi od toga
//   kojim redom Decap upiše ključeve u JSON pri čuvanju, niti od toga da li je
//   urednik ispraznio neku listu.
//
// Kada je pokrenuti: kad programer doda/ukloni polje u JSON-u sadržaja ili
// novu stranicu.
//   npm run cms-konfiguracija                      (upisuje src/admin/config.yml)
//   node scripts/cms-konfiguracija.js --izlaz /tmp/config.yml   (proba, bez upisa u repo)
//   node scripts/cms-konfiguracija.js --osnova <stari.yml>      (druga osnova)
// Posle pokretanja pregledati razliku (git diff src/admin/config.yml).
//
// Kako radi (stabilno, može da se pokreće više puta):
//   1. Polja se prave iz JSON sadržaja (src/sadrzaj/...).
//   2. Postojeći config.yml je OSNOVA: redosled polja i šema lista/objekata se
//      čuvaju iz njega. Novo polje se ubacuje posle polja koje mu prethodi u JSON-u.
//      Prazna lista ([]) u JSON-u NE menja tip: koristi se šema iz osnove.
//      Polje koje postoji samo u osnovi ostaje (uz upozorenje u konzoli).
//   3. Redosled sekcija stranice = redosled include-ova u src/stranice/<kljuc>.njk
//      (sekcija = ključ koji šablon čita kao stranice.<kljuc>.<sekcija>).
//
// Pravila za nazive polja u JSON-u (važe za sve stranice):
//   - "slika…" ili "…Slika"            -> izbor slike (otprema u src/assets/slike)
//   - "slika…Opis" / "…SlikaOpis"      -> obično tekst polje: opis slike (alt)
//   - "…Md"                            -> tekst sa formatiranjem (podebljano, link, liste)
//   - "…Mobilni"                       -> tekst za telefon: oznaka "… (telefon)",
//                                         nije obavezno, stoji odmah posle polja bez sufiksa
//   - tekst duži od 90 znakova          -> veće polje za tekst
//   - "_…"                             -> tehničko polje (skriveno); "_naziv" = naziv stranice u CMS-u
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SADRZAJ = "src/sadrzaj";
const STRANICE_NJK = "src/stranice";
const INCLUDES = "src/_includes";
const PODRAZUMEVANI_IZLAZ = "src/admin/config.yml";

const upozorenja = [];
const upozori = (t) => upozorenja.push(t);

// --- Oznake (labele) polja --------------------------------------------------
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
  vadjenje: "Vađenje", krvi: "krvi", saglasnost: "Saglasnost", radno: "Radno", sajt: "Sajt",
  podesavanja: "Podešavanja", tekstovi: "Tekstovi", skola: "Škola", cipovi: "Čipovi",
  postanski: "Poštanski", podrucje: "Područje", resenje: "Rešenje", ziro: "Žiro", cesto: "Često",
  nasa: "Naša", nase: "Naše", nas: "Naš", dijagnoza: "Dijagnoza", sledi: "Sledi",
};

// Posebne oznake i uputstva za pojedina polja (putanja: fajl/ključ/ključ...)
const POSEBNO = {
  "podesavanja/kontakt/viberLink": { label: "Viber link", hint: "Oblik: viber://chat?number=%2B381… (broj bez nule, %2B je znak +)" },
  "podesavanja/kontakt/radnoVremeSchema": { label: "Radno vreme za Google", hint: "Format za pretraživače, npr. Mo-Fr 08:00-16:00 (Mo, Tu, We, Th, Fr, Sa, Su)" },
  "podesavanja/kontakt/telefonLink": { hint: "Broj za poziv, sa +381, bez razmaka" },
  "podesavanja/kontakt/mobilniLink": { hint: "Broj za poziv, sa +381, bez razmaka" },
  "podesavanja/sajt/zabraniIndeksiranje": { label: "Sakrij sajt od Google-a", hint: "Isključiti kada sajt zameni stari familyhealth.rs" },
  "podesavanja/tekstovi": { label: "Zajednički tekstovi (dugmad, oznake)" },
  "podesavanja/tekstovi/korakOd": { label: "Oznaka koraka", hint: "{n} = broj koraka, {N} = ukupno koraka" },
  "podesavanja/tekstovi/glavnoDugme": { label: "Donja traka (telefon): podrazumevano glavno dugme" },
  "podesavanja/tekstovi/glavnoDugmeLink": { label: "Donja traka (telefon): link glavnog dugmeta" },
  "podesavanja/tekstovi/oznakaGornjiMeni": { label: "Naziv gornjeg menija (za čitače ekrana)" },
  "podesavanja/tekstovi/oznakaFuter": { label: "Naziv menija u futeru (za čitače ekrana)" },
  "podesavanja/cms": { widget: "hidden" },
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

const jeMobilni = (k) => /.Mobilni$/.test(k);
const bezMobilni = (k) => k.replace(/Mobilni$/, "");
const jeOpisSlike = (k) => /Opis$/.test(k) && (/^slika/i.test(k) || /Slika/.test(k));
const jeSlika = (k) => (/^slika/i.test(k) || /Slika$/.test(k)) && !/Opis$/.test(k);
const jeObjekat = (v) => v && typeof v === "object" && !Array.isArray(v);

function labelaZa(kljuc) {
  if (jeMobilni(kljuc)) return `${labelaZa(bezMobilni(kljuc))} (telefon)`;
  if (jeOpisSlike(kljuc)) {
    const osnova = kljuc.replace(/Opis$/, "");
    return osnova === "slika" ? "Opis slike (za slepe i Google)" : `Opis: ${oznaka(osnova)} (za slepe i Google)`;
  }
  return oznaka(kljuc);
}

// --- Spajanje stavki liste (stavke nemaju uvek ista polja) ------------------
function spojiObjekte(niz) {
  const spojen = {};
  for (const o of niz) {
    if (!jeObjekat(o)) continue;
    for (const [k, v] of Object.entries(o)) {
      if (!(k in spojen) || spojen[k] === null || spojen[k] === "") spojen[k] = v;
      else if (Array.isArray(v) && Array.isArray(spojen[k])) spojen[k] = spojen[k].concat(v);
      else if (jeObjekat(v) && jeObjekat(spojen[k])) spojen[k] = spojiObjekte([spojen[k], v]);
      else if (typeof v === "string" && typeof spojen[k] === "string" && v.length > spojen[k].length) spojen[k] = v;
    }
  }
  return spojen;
}

// --- Redosled polja -----------------------------------------------------------
// osnovaRed: imena polja iz postojećeg config.yml (redom), jsonRed: ključevi iz JSON-a.
// Rezultat: redosled iz osnove + nova polja posle svog prethodnika iz JSON-a;
// "…Mobilni" odmah posle polja bez sufiksa.
function urediRedosled(osnovaRed, jsonRed) {
  const red = [...osnovaRed];
  for (let i = 0; i < jsonRed.length; i++) {
    const k = jsonRed[i];
    if (red.includes(k)) continue;
    let mesto = -1;
    for (let j = i - 1; j >= 0; j--) {
      const p = red.indexOf(jsonRed[j]);
      if (p >= 0) { mesto = p; break; }
    }
    if (mesto === -1 && osnovaRed.length) {
      // nema prethodnika u osnovi: posle poslednjeg polja koje je u JSON-u pre njega, inače na početak
      red.splice(0, 0, k);
    } else red.splice(mesto + 1, 0, k);
  }
  // Mobilni posle osnovnog polja
  for (const k of [...red]) {
    if (!jeMobilni(k)) continue;
    const osnovno = bezMobilni(k);
    if (!red.includes(osnovno)) continue;
    red.splice(red.indexOf(k), 1);
    let poz = red.indexOf(osnovno) + 1;
    while (poz < red.length && jeMobilni(red[poz]) && bezMobilni(red[poz]) === osnovno) poz++;
    red.splice(poz, 0, k);
  }
  return red;
}

// --- Jedno polje ------------------------------------------------------------
// putanja: za poruke i POSEBNO; vrednost: iz JSON-a (može biti undefined);
// staro: definicija polja iz osnove (config.yml) ili undefined.
function polje(kljuc, vrednost, staro, putanja) {
  const osnovno = { name: kljuc, label: labelaZa(kljuc), required: false };
  const posebno = POSEBNO[putanja] || {};
  let p = napraviPolje(kljuc, vrednost, staro, putanja, osnovno);
  if (jeMobilni(kljuc) && p.widget !== "hidden" && !p.hint) p.hint = "Kraći tekst koji se prikazuje na telefonu.";
  if (jeSlika(kljuc) && !p.hint) p.hint = "Fotografija (JPG, PNG ili WebP). Dok je prazno, prikazuje se obojeno polje sa opisom.";
  if (posebno.widget === "hidden") p = { name: kljuc, label: p.label, widget: "hidden", required: false };
  if (posebno.label) p.label = posebno.label;
  if (posebno.hint) p.hint = posebno.hint;
  // zadrži ručno dodata podešavanja iz osnove (hint, default, pattern...)
  if (staro) {
    for (const k of ["hint", "default", "pattern", "required"]) {
      if (staro[k] !== undefined && p[k] === undefined) p[k] = staro[k];
    }
  }
  return p;
}

function napraviPolje(kljuc, vrednost, staro, putanja, osnovno) {
  if (kljuc.startsWith("_")) return { ...osnovno, widget: "hidden" };
  if (jeSlika(kljuc)) return { ...osnovno, widget: "image", choose_url: false };
  if (jeOpisSlike(kljuc)) return { ...osnovno, widget: "string" };

  // Nema vrednosti (polje postoji samo u osnovi) ili prazna lista: zadrži šemu iz osnove
  const prazno = vrednost === undefined || vrednost === null || (Array.isArray(vrednost) && vrednost.length === 0);
  if (prazno && staro) return popraviStaro(staro, putanja);
  if (Array.isArray(vrednost) && vrednost.length === 0) {
    upozori(`${putanja}: prazna lista bez šeme u osnovi -> lista tekstova (proveriti!)`);
    return { ...osnovno, widget: "list", label_singular: "stavku", field: { name: "stavka", label: "Stavka", widget: "string" } };
  }

  if (typeof vrednost === "boolean") return { ...osnovno, widget: "boolean" };
  if (typeof vrednost === "number") {
    const float = !Number.isInteger(vrednost) || (staro && staro.value_type === "float");
    return { ...osnovno, widget: "number", value_type: float ? "float" : "int" };
  }
  if (Array.isArray(vrednost)) {
    const objekti = vrednost.filter(jeObjekat);
    if (objekti.length) {
      const uzor = spojiObjekte(objekti);
      const staraPolja = staro && staro.widget === "list" && Array.isArray(staro.fields) ? staro.fields : [];
      const polja = poljaObjekta(uzor, staraPolja, putanja);
      const prvoTekstualno = polja.find((x) => x.widget === "string" || x.widget === "text");
      return {
        ...osnovno,
        widget: "list",
        label_singular: "stavku",
        collapsed: true,
        ...(prvoTekstualno ? { summary: `{{fields.${prvoTekstualno.name}}}` } : {}),
        fields: polja,
      };
    }
    const dugacak = vrednost.some((v) => typeof v === "string" && (v.length > 90 || v.includes("\n")));
    const brojevi = vrednost.every((v) => typeof v === "number");
    const stariWidget = staro && staro.field && staro.field.widget;
    return {
      ...osnovno,
      widget: "list",
      label_singular: "stavku",
      field: brojevi
        ? { name: "stavka", label: "Stavka", widget: "number", value_type: "float" }
        : { name: "stavka", label: "Stavka", widget: dugacak || stariWidget === "text" ? "text" : "string" },
    };
  }
  if (jeObjekat(vrednost)) {
    const staraPolja = staro && staro.widget === "object" && Array.isArray(staro.fields) ? staro.fields : [];
    return { ...osnovno, widget: "object", collapsed: true, fields: poljaObjekta(vrednost, staraPolja, putanja) };
  }
  if (/Md$/.test(kljuc)) {
    return { ...osnovno, widget: "markdown", buttons: ["bold", "italic", "link", "bulleted-list", "numbered-list"], editor_components: [], modes: ["rich_text"] };
  }
  const tekst = String(vrednost ?? "");
  const dug = tekst.length > 90 || tekst.includes("\n") || (staro && staro.widget === "text");
  return { ...osnovno, widget: dug ? "text" : "string" };
}

// Polja objekta/stavke liste: unija JSON ključeva i polja iz osnove, stabilan redosled.
function poljaObjekta(podaci, staraPolja, putanja) {
  const poImenu = new Map(staraPolja.map((f) => [f.name, f]));
  const red = urediRedosled(staraPolja.map((f) => f.name), Object.keys(podaci));
  return red.map((k) => {
    if (!(k in podaci) && poImenu.has(k)) upozori(`${putanja}/${k}: postoji samo u config.yml (nema ga u sadržaju); zadržano`);
    return polje(k, podaci[k], poImenu.get(k), `${putanja}/${k}`);
  });
}

// Šema iz osnove za polje bez podataka: primeni nova pravila (opis slike, Mobilni...)
function popraviStaro(staro, putanja) {
  const p = { ...staro, label: labelaZa(staro.name) };
  if (jeOpisSlike(staro.name)) { p.widget = "string"; delete p.choose_url; }
  if (p.widget === "list" && !p.label_singular) p.label_singular = "stavku";
  if (Array.isArray(staro.fields)) p.fields = staro.fields.map((f) => polje(f.name, undefined, f, `${putanja}/${f.name}`));
  return p;
}

// --- Redosled sekcija stranice iz include-ova --------------------------------
function camel(k) { return String(k).replace(/-([a-z])/g, (_, s) => s.toUpperCase()); }

function frontMatter(tekst) {
  const m = tekst.match(/^---[a-z]*\n([\s\S]*?)\n---/);
  return m ? m[1] : "";
}

// Ključevi sekcija stranice redom include-ova u src/stranice/<kljuc>.njk.
// Za svaki include bira se GLAVNI ključ sekcije: (1) ime fajla sekcije ako je
// ključ u JSON-u (hero.njk -> hero), (2) "set d = stranice.<kljuc>.<sekcija>",
// (3) prvi ključ koji sekcija (ili njeni include-ovi) čita. Usputna čitanja
// (npr. hero čita najnižu cenu iz "paketi") ne menjaju redosled.
function redosledSekcija(kljucStranice, kljuceviJson) {
  const fajl = fs.readdirSync(path.join(KOREN, STRANICE_NJK))
    .filter((f) => f.endsWith(".njk"))
    .find((f) => {
      const fm = frontMatter(fs.readFileSync(path.join(KOREN, STRANICE_NJK, f), "utf8"));
      const m = fm.match(/^kljuc:\s*["']?([\w-]+)/m);
      return m && m[1] === kljucStranice;
    });
  if (!fajl) return [];
  const ime = camel(kljucStranice);
  const bezKomentara = (t) => t.replace(/\{#[\s\S]*?#\}/g, "");
  const citaj = (p) => (fs.existsSync(p) && fs.statSync(p).isFile() ? bezKomentara(fs.readFileSync(p, "utf8")) : "");
  const reInclude = /\{%-?\s*include\s+"([^"]+)"/g;
  const reRef = new RegExp(`stranice\\.${ime}\\.([A-Za-z0-9_]+)`, "g");
  const reD = new RegExp(`set\\s+d\\s*=\\s*stranice\\.${ime}\\.([A-Za-z0-9_]+)`);
  // svi ključevi koje čita fajl i njegovi include-ovi, redom
  function reference(p, poseceni = new Set()) {
    if (poseceni.has(p)) return [];
    poseceni.add(p);
    const t = citaj(p);
    const re = new RegExp(`${reInclude.source}|${reRef.source}`, "g");
    const out = [];
    for (const m of t.matchAll(re)) {
      if (m[1]) out.push(...reference(path.join(KOREN, INCLUDES, m[1]), poseceni));
      else if (m[2]) out.push(m[2]);
    }
    return out;
  }
  const strana = citaj(path.join(KOREN, STRANICE_NJK, fajl));
  const sekcije = [...strana.matchAll(reInclude)].map((m) => {
    const putanja = path.join(KOREN, INCLUDES, m[1]);
    const osnovnoIme = camel(path.basename(m[1], ".njk"));
    const d = citaj(putanja).match(reD);
    const refs = reference(putanja).filter((k) => kljuceviJson.includes(k));
    const glavni = kljuceviJson.includes(osnovnoIme) ? osnovnoIme : d && kljuceviJson.includes(d[1]) ? d[1] : refs[0];
    return { glavni, refs };
  });
  // Redom sekcija: ključevi koje sekcija čita, osim glavnih ključeva DRUGIH sekcija
  // (privatnost: uvod pa odeljci; trudnoća: hero pa alat; harmony hero ne povlači "paketi").
  const glavni = new Set(sekcije.map((x) => x.glavni).filter(Boolean));
  const red = [];
  for (const sek of sekcije) {
    const svoji = sek.refs.filter((k) => k === sek.glavni || !glavni.has(k));
    if (sek.glavni && !svoji.includes(sek.glavni)) svoji.unshift(sek.glavni);
    for (const k of svoji) if (!red.includes(k)) red.push(k);
  }
  return red;
}

// Polja JSON fajla stranice: _naziv i seo prvi, zatim sekcije redom include-ova,
// zatim ostalo po osnovi/JSON-u.
function poljaStranice(podaci, staraPolja, putanja, kljucStranice) {
  const sekcije = redosledSekcija(kljucStranice, Object.keys(podaci));
  const osnovni = urediRedosled(staraPolja.map((f) => f.name), Object.keys(podaci));
  const prvi = ["_naziv", "seo"].filter((k) => osnovni.includes(k));
  const red = [...prvi];
  for (const k of sekcije) if (!red.includes(k)) red.push(k);
  for (const k of osnovni) if (!red.includes(k)) red.push(k);
  const konacan = urediRedosled(red, red); // Mobilni posle osnovnog
  const poImenu = new Map(staraPolja.map((f) => [f.name, f]));
  return konacan.map((k) => polje(k, podaci[k], poImenu.get(k), `${putanja}/${k}`));
}

// --- Čitanje ---------------------------------------------------------------------
const citajJson = (fajl) => JSON.parse(fs.readFileSync(path.join(KOREN, fajl), "utf8"));
function jsonFajlovi(folder) {
  const pun = path.join(KOREN, folder);
  if (!fs.existsSync(pun)) return [];
  return fs.readdirSync(pun).filter((f) => f.endsWith(".json")).sort();
}

function ucitajOsnovu(fajl) {
  if (!fajl || !fs.existsSync(fajl)) return null;
  try { return YAML.parse(fs.readFileSync(fajl, "utf8")); }
  catch (e) { upozori(`osnova ${fajl} nije ispravan YAML (${e.message}); pravi se bez nje`); return null; }
}

// --- Konfiguracija -----------------------------------------------------------------
export function napraviCmsKonfiguraciju({ izlaz = PODRAZUMEVANI_IZLAZ, osnova } = {}) {
  const izlazPun = path.resolve(KOREN, izlaz);
  const osnovaPun = path.resolve(KOREN, osnova || PODRAZUMEVANI_IZLAZ);
  const stara = ucitajOsnovu(osnovaPun) || {};
  const staraKolekcija = (ime) => (stara.collections || []).find((c) => c.name === ime) || {};
  const stariFajl = (kol, ime) => ((staraKolekcija(kol).files || []).find((f) => f.name === ime) || {}).fields || [];

  const podesavanja = fs.existsSync(path.join(KOREN, SADRZAJ, "podesavanja.json")) ? citajJson(`${SADRZAJ}/podesavanja.json`) : {};
  const cms = podesavanja.cms || {};

  // 1) Opšta podešavanja i navigacija
  const opste = {
    name: "podesavanja",
    label: "Podešavanja sajta",
    editor: { preview: false },
    files: ["podesavanja", "navigacija"]
      .filter((ime) => fs.existsSync(path.join(KOREN, SADRZAJ, `${ime}.json`)))
      .map((ime) => {
        const podaci = citajJson(`${SADRZAJ}/${ime}.json`);
        const staraPolja = stariFajl("podesavanja", ime);
        const poImenu = new Map(staraPolja.map((f) => [f.name, f]));
        const red = urediRedosled(staraPolja.map((f) => f.name), Object.keys(podaci));
        return {
          name: ime,
          label: ime === "podesavanja" ? "Kontakt, adresa i opšti podaci" : "Meniji i futer",
          file: `${SADRZAJ}/${ime}.json`,
          fields: red.map((k) => polje(k, podaci[k], poImenu.get(k), `${ime}/${k}`)),
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
        fields: poljaStranice(podaci, stariFajl("stranice", ime), `stranice/${ime}`, ime),
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
    fields: poljaObjekta(uzorAnalize, staraKolekcija("analize").fields || [], "analize").map((p) => {
      if (p.name === "naziv") p.required = true;
      if (p.name === "slug") p.hint = "Deo adrese stranice, npr. cancer-precision. Samo mala slova, brojevi i crtice.";
      if (p.name === "imaStranicu") p.hint = "Uključite kada analiza ima svoju stranicu (pravi se po šablonu Cancer Precision).";
      return p;
    }),
  };

  // 4) Blog (polja su fiksna; kategorije se biraju iz liste na stranici Blog)
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
      { name: "seoNaslov", label: "Kraći naslov za Google", widget: "string", required: false, hint: "Ako je naslov duži od ~50 znakova. Na kraj se automatski dodaje „| Family Health“." },
      { name: "opis", label: "Kratak opis (lista članaka i Google)", widget: "text", required: false },
      { name: "opisIstaknut", label: "Duži opis na kartici istaknutog članka", widget: "text", required: false },
      {
        name: "kategorija",
        label: "Kategorija",
        widget: "relation",
        collection: "stranice",
        file: "blog",
        search_fields: ["lista.kategorije.*"],
        value_field: "lista.kategorije.*",
        display_fields: ["lista.kategorije.*"],
        hint: "Spisak kategorija se menja na jednom mestu: Stranice → Blog → Lista → Kategorije.",
      },
      { name: "datum", label: "Datum objave", widget: "datetime", format: "YYYY-MM-DD", date_format: "DD.MM.YYYY.", time_format: false, required: false },
      { name: "vremeCitanja", label: "Vreme čitanja (npr. 4 min)", widget: "string", required: false },
      { name: "autor", label: "Autor", widget: "string", required: false },
      { name: "autorUloga", label: "Uloga autora", widget: "string", required: false },
      { name: "slika", label: "Glavna fotografija", widget: "image", required: false, choose_url: false },
      { name: "slikaOpis", label: "Opis slike (za slepe i Google)", widget: "string", required: false },
      { name: "istaknuto", label: "Istaknut članak na vrhu bloga", widget: "boolean", default: false, required: false },
      { name: "kalkulatorTrudnoce", label: "Prikaži kalkulator nedelje trudnoće", widget: "boolean", default: false, required: false },
      { name: "predlogTeme", label: "Predlog teme (tekst još nije napisan)", widget: "boolean", default: false, required: false },
      { name: "redosled", label: "Redosled predloga tema u listi", widget: "number", value_type: "int", required: false },
      { name: "sakrij", label: "Sakrij članak", widget: "boolean", default: false, required: false, hint: "Uključeno: članak se ne prikazuje u listi bloga, među srodnim člancima ni u mapi sajta." },
      { name: "body", label: "Tekst članka", widget: "markdown" },
    ],
  };

  const konfiguracija = {
    backend: {
      name: "github",
      repo: cms.repo || "slobodansobat-art/Family-Health---redizajn",
      branch: cms.grana || "main",
      ...(cms.authEndpoint ? { auth_endpoint: cms.authEndpoint } : {}),
      ...(cms.baseUrl ? { base_url: cms.baseUrl } : {}),
      ...(cms.siteDomain ? { site_domain: cms.siteDomain } : {}),
      commit_messages: {
        create: "CMS: dodato {{collection}} „{{slug}}“",
        update: "CMS: izmenjeno {{collection}} „{{slug}}“",
        delete: "CMS: obrisano {{collection}} „{{slug}}“",
        uploadMedia: "CMS: dodata slika „{{path}}“",
        deleteMedia: "CMS: obrisana slika „{{path}}“",
      },
    },
    // Samo za razvoj: na localhost-u Decap koristi lokalni server (npm run cms:lokalno)
    // umesto GitHub-a. Na pravom sajtu se ovo ne koristi.
    local_backend: true,
    // Interfejs na srpskoj latinici: src/admin/sr-latinica.js (scripts/sr-latinica.js)
    locale: "sr_Latn",
    site_url: (podesavanja.sajt && podesavanja.sajt.url) || "",
    display_url: (podesavanja.sajt && podesavanja.sajt.url) || "",
    logo_url: "/assets/slike/logo-cms.svg",
    // Slike iz CMS-a se otpremaju u src/assets/slike (na sajtu: /assets/slike/...)
    media_folder: "src/assets/slike",
    public_folder: "/assets/slike",
    slug: { encoding: "ascii", clean_accents: true, sanitize_replacement: "-" },
    collections: [opste, stranice, analize, blog],
  };

  const zaglavlje =
    "# =============================================================================\n" +
    "# Decap CMS: šta urednici menjaju i kako izgleda forma.\n" +
    "# Fiksan fajl u repou (NE pravi se pri izradi sajta). Napravljen skriptom\n" +
    "# scripts/cms-konfiguracija.js (npm run cms-konfiguracija), koja čuva redosled\n" +
    "# i šemu iz ovog fajla. Može se menjati i ručno (npr. hint, label).\n" +
    "# =============================================================================\n";
  const tekst = zaglavlje + YAML.stringify(konfiguracija, { lineWidth: 0, aliasDuplicateObjects: false });
  YAML.parse(tekst); // provera: ispravan YAML
  fs.mkdirSync(path.dirname(izlazPun), { recursive: true });
  fs.writeFileSync(izlazPun, tekst);
  return { izlaz: izlazPun, upozorenja };
}

// --- Pokretanje iz komandne linije ------------------------------------------------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (ime) => { const i = process.argv.indexOf(ime); return i > 0 ? process.argv[i + 1] : undefined; };
  const { izlaz, upozorenja: u } = napraviCmsKonfiguraciju({ izlaz: arg("--izlaz"), osnova: arg("--osnova") });
  for (const t of u) console.warn("upozorenje: " + t);
  console.log(`Upisano: ${path.relative(process.cwd(), izlaz) || izlaz}`);
}
