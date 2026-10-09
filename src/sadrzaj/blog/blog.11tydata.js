// =============================================================================
// Podešavanja za sve članke bloga (src/sadrzaj/blog/*.md).
// -----------------------------------------------------------------------------
// - Adresa članka: /blog/<ime-fajla>/  (ime fajla = slug, pravi ga CMS)
// - Šablon: src/_includes/sekcije/blog/clanak-sablon.njk (redosled sekcija članka)
// - Predlog teme (predlogTeme: true) NEMA svoju stranicu: prikazuje se samo
//   u listi na /blog/, bez linka, sa oznakom "[predlog teme]". Kad se tekst
//   napiše, urednik isključi "Predlog teme" i članak dobija adresu.
// - Kalkulator trudnoće (kalkulatorTrudnoce: true) učitava js/stranice/blog.js.
// =============================================================================
export default {
  layout: "sekcije/blog/clanak-sablon.njk",
  telo: "clanak",
  zaglavlje: { tema: "svetla", oblast: "opsti", nazad: "/blog/" },
  eleventyComputed: {
    permalink: (d) => (d.predlogTeme ? false : `/blog/${d.page.fileSlug}/`),
    seo: (d) => ({
      naslov: `${d.naslov} | ${d.podesavanja.sajt.naziv}`,
      opis: d.opis || "",
    }),
    skripte: (d) => (d.kalkulatorTrudnoce ? ["stranice/blog.js"] : []),
  },
};
