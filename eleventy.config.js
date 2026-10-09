// =============================================================================
// Eleventy podešavanja za sajt Family Health
// -----------------------------------------------------------------------------
// Struktura (detaljno u README.md):
//   src/sadrzaj/        SAV tekst, cene, slike i blog. Ovo menja CMS (Decap).
//   src/_data/          Učitava sadržaj iz src/sadrzaj i daje ga šablonima.
//   src/_includes/      Šabloni: layouts (okvir stranice), partials (zaglavlje,
//                       futer...), makroi (komponente), sekcije (po stranicama).
//   src/stranice/       Jedan fajl po stranici: samo redosled sekcija.
//   src/assets/         CSS, JavaScript, fontovi, slike.
//   src/admin/          Decap CMS (config.yml se pravi automatski, vidi scripts/).
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import markdownIt from "markdown-it";
import { onkoMreza } from "./scripts/onko-mreza.js";
import { napraviCmsKonfiguraciju } from "./scripts/cms-konfiguracija.js";

const md = markdownIt({ html: false, linkify: true, typographer: false });

const MESECI = ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"];

export default function (eleventyConfig) {
  // --- Praćenje izmena tokom razvoja ---------------------------------------
  eleventyConfig.addWatchTarget("src/sadrzaj/");
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("scripts/");

  // --- Fajlovi koji se kopiraju bez obrade ----------------------------------
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/slike": "assets/slike" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonti": "assets/fonti" });
  eleventyConfig.addPassthroughCopy({ "src/staticno": "/" });
  eleventyConfig.addPassthroughCopy({ "src/admin/index.html": "admin/index.html" });
  eleventyConfig.addPassthroughCopy({ "src/admin/config.yml": "admin/config.yml" });

  // --- Pre svake izrade: fontovi i CMS konfiguracija -------------------------
  eleventyConfig.on("eleventy.before", () => {
    kopirajFontove();
    napraviCmsKonfiguraciju();
  });

  // --- Filteri (koriste se u šablonima kao {{ x | ime }}) --------------------

  // Markdown u HTML, za duže tekstove (pasusi, liste).
  eleventyConfig.addFilter("md", (tekst) => (tekst ? md.render(String(tekst)) : ""));
  // Markdown u jednom redu (podebljano, link), bez <p> omotača.
  eleventyConfig.addFilter("mdRed", (tekst) => (tekst ? md.renderInline(String(tekst)) : ""));
  // Cena u evrima: 1980 -> "1.980 €", 163.33 -> "163,33 €"
  eleventyConfig.addFilter("evra", (iznos) => formatirajEvre(iznos));
  // Datum: "2026-07-14" -> "jul 2026."
  eleventyConfig.addFilter("mesecGodina", (datum) => {
    const d = new Date(datum);
    return isNaN(d) ? String(datum || "") : `${MESECI[d.getUTCMonth()]} ${d.getUTCFullYear()}.`;
  });
  // Datum za <time datetime="...">
  eleventyConfig.addFilter("isoDatum", (datum) => {
    const d = new Date(datum);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  });
  // Podaci u JSON za JavaScript na stranici (npr. kalkulatori).
  eleventyConfig.addFilter("uJson", (vrednost) => JSON.stringify(vrednost ?? null).replace(/</g, "\\u003c"));
  // Da li link vodi na trenutnu stranicu (za aria-current).
  eleventyConfig.addFilter("jeTrenutna", (link, url) => {
    if (!link || !url) return false;
    const bezSidra = String(link).split("#")[0];
    return bezSidra === url;
  });
  // Uzima N elemenata niza.
  eleventyConfig.addFilter("prvih", (niz, n) => (Array.isArray(niz) ? niz.slice(0, n) : []));

  // --- Kratki kodovi --------------------------------------------------------
  // Animirana mreža (onkogenetika). Upotreba: {% onkoMreza "naziv", 1 %}
  eleventyConfig.addShortcode("onkoMreza", (seme = "fh", brzina = 1) => onkoMreza(seme, brzina));
  // Godina za futer.
  eleventyConfig.addShortcode("godina", () => String(new Date().getFullYear()));

  // --- Kolekcije ------------------------------------------------------------
  // Blog: svi članci iz src/sadrzaj/blog, najnoviji prvi, predlozi tema na kraju.
  eleventyConfig.addCollection("blog", (api) =>
    api
      .getFilteredByGlob("src/sadrzaj/blog/*.md")
      .filter((c) => !c.data.sakrij)
      .sort((a, b) => {
        if (!!a.data.predlogTeme !== !!b.data.predlogTeme) return a.data.predlogTeme ? 1 : -1;
        return new Date(b.data.datum || 0) - new Date(a.data.datum || 0);
      })
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
  };
}

// -----------------------------------------------------------------------------
// Pomoćne funkcije
// -----------------------------------------------------------------------------

export function formatirajEvre(iznos) {
  const broj = Number(iznos);
  if (!isFinite(broj)) return String(iznos ?? "");
  const zaokruzen = Math.round(broj * 100) / 100;
  const [ceo, dec] = zaokruzen.toFixed(2).split(".");
  const saTackama = ceo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (dec === "00" ? saTackama : `${saTackama},${dec}`) + " €";
}

// Fontovi se drže na samom sajtu (bez Google Fonts), zbog brzine i privatnosti.
// Kopiraju se iz node_modules/@fontsource u src/assets/fonti.
function kopirajFontove() {
  const cilj = "src/assets/fonti";
  const fontovi = [
    ["newsreader", ["400-normal", "400-italic", "500-normal", "500-italic"]],
    ["ibm-plex-sans", ["400-normal", "500-normal", "600-normal"]],
    ["ibm-plex-mono", ["500-normal"]],
    ["teko", ["500-normal"]],
  ];
  fs.mkdirSync(cilj, { recursive: true });
  for (const [ime, varijante] of fontovi) {
    for (const v of varijante) {
      for (const podskup of ["latin", "latin-ext"]) {
        const fajl = `${ime}-${podskup}-${v}.woff2`;
        const izvor = path.join("node_modules/@fontsource", ime, "files", fajl);
        const odrediste = path.join(cilj, fajl);
        if (fs.existsSync(izvor) && !fs.existsSync(odrediste)) fs.copyFileSync(izvor, odrediste);
      }
    }
  }
}
