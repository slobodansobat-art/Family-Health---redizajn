// =============================================================================
// Podešavanja za sve članke bloga (src/sadrzaj/blog/*.md).
// -----------------------------------------------------------------------------
// - Adresa članka: /blog/<ime-fajla>/  (ime fajla = slug, pravi ga CMS)
// - Šablon: src/_includes/sekcije/blog/clanak-sablon.njk (redosled sekcija članka)
// - Predlog teme (predlogTeme: true) NEMA svoju stranicu: prikazuje se samo
//   u listi na /blog/, bez linka, sa oznakom "[predlog teme]". Kad se tekst
//   napiše, urednik isključi "Predlog teme" i članak dobija adresu.
// - Kalkulator trudnoće (kalkulatorTrudnoce: true) učitava js/stranice/blog.js.
// - Opciona polja: seoNaslov (kraći naslov za pretraživače, kad je naslov
//   članka predug za ~60 znakova), opisIstaknut (duži opis na kartici
//   istaknutog članka na /blog/), redosled (redosled predloga tema u listi).
// =============================================================================
export default {
  layout: "sekcije/blog/clanak-sablon.njk",
  telo: "clanak",
  zaglavlje: { tema: "svetla", oblast: "opsti", nazad: "/blog/" },
  eleventyComputed: {
    // Predlog teme i sakriven članak nemaju svoju stranicu.
    permalink: (d) => (d.predlogTeme || d.sakrij ? false : `/blog/${d.page.fileSlug}/`),
    seo: (d) => ({
      naslov: `${d.seoNaslov || d.naslov} | ${d.podesavanja.sajt.naziv}`,
      opis: d.opis || "",
    }),
    skripte: (d) => (d.kalkulatorTrudnoce ? ["stranice/blog.js"] : []),
  },
};
