/* =============================================================================
   BLOG: filter tema na listi (/blog/) i kalkulator trudnoće u članku
   -----------------------------------------------------------------------------
   1. Filter tema: bez JS-a se vidi cela lista, a čipovi su skriveni. JS
      prikazuje čipove i sakriva članke druge teme (data-kategorija).
   2. Kalkulator nedelje trudnoće (članak sa "kalkulatorTrudnoce: true"):
      od prvog dana poslednje menstruacije računa nedelju i okvirni termin
      (280 dana). Sve se računa u lokalnom vremenu (ne UTC), da se dan ne
      pomeri oko ponoći ili pri prelasku na letnje računanje vremena.
      Tekstovi i preporuke: src/sadrzaj/stranice/blog.json -> kalkulator
      (na stranici u <script id="blog-kalkulator-podaci">).
   ========================================================================== */
(function () {
  "use strict";

  /* --- 1. Filter tema ------------------------------------------------------ */
  function pokreniFilter() {
    var lista = document.querySelector("[data-blog-lista]");
    if (!lista) return;
    var filter = lista.querySelector("[data-blog-filter]");
    var ul = lista.querySelector("[data-blog-stavke]");
    if (!filter || !ul) return;

    var cipovi = Array.prototype.slice.call(filter.querySelectorAll("[data-kategorija]"));
    var stavke = Array.prototype.slice.call(ul.querySelectorAll("[data-kategorija]"));

    function izaberi(cip) {
      var tema = cip.getAttribute("data-kategorija");
      cipovi.forEach(function (c) { c.setAttribute("aria-pressed", c === cip ? "true" : "false"); });
      stavke.forEach(function (s) { s.hidden = !!tema && s.getAttribute("data-kategorija") !== tema; });
      // Kratka animacija pojave liste
      ul.classList.remove("pojava");
      void ul.offsetWidth;
      ul.classList.add("pojava");
    }

    cipovi.forEach(function (c) {
      c.addEventListener("click", function () {
        if (c.getAttribute("aria-pressed") !== "true") izaberi(c);
      });
    });
    filter.hidden = false;
  }

  /* --- 2. Kalkulator nedelje trudnoće ------------------------------------- */
  var MESECI = ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"];
  var DAN = 86400000;

  function dvaBroja(n) { return (n < 10 ? "0" : "") + n; }

  // Date -> "2026-07-14" po lokalnom vremenu (bez toISOString, koji je u UTC)
  function uVrednostPolja(d) {
    return d.getFullYear() + "-" + dvaBroja(d.getMonth() + 1) + "-" + dvaBroja(d.getDate());
  }

  // "2026-07-14" -> lokalna ponoć tog dana (ili null ako datum nije ispravan)
  function izPolja(vrednost) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(vrednost || "");
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getMonth() === Number(m[2]) - 1 ? d : null;
  }

  function danas() {
    var s = new Date();
    return new Date(s.getFullYear(), s.getMonth(), s.getDate());
  }

  function pokreniKalkulator() {
    var sekcija = document.querySelector("[data-kalkulator-trudnoce]");
    if (!sekcija) return;
    var t = FH.podaci("blog-kalkulator-podaci");
    if (!t) return;

    var polje = sekcija.querySelector("[data-kalkulator-datum]");
    var rezultat = sekcija.querySelector("[data-kalkulator-rezultat]");
    var nedelja = sekcija.querySelector("[data-kalkulator-nedelja]");
    var termin = sekcija.querySelector("[data-kalkulator-termin]");
    var link = sekcija.querySelector("[data-kalkulator-link]");
    var preporuka = sekcija.querySelector("[data-kalkulator-preporuka]");
    var sidro = "#" + sekcija.id;

    function prikazi(tekstNedelje, tekstTermina, tekstPreporuke, adresa) {
      nedelja.textContent = tekstNedelje;
      termin.textContent = tekstTermina;
      preporuka.textContent = tekstPreporuke;
      link.setAttribute("href", adresa);
    }

    function izracunaj() {
      var pocetak = izPolja(polje.value);
      if (!pocetak) { prikazi("—", "—", t.unesiteDatum, sidro); return; }

      // Razlika u danima između dve lokalne ponoći (zaokruženo zbog letnjeg vremena)
      var dani = Math.round((danas() - pocetak) / DAN);
      var nedelje = Math.floor(dani / 7);
      var ostatak = dani % 7;
      if (dani < 0 || nedelje > 43) { prikazi("—", "—", t.proveriteDatum, sidro); return; }

      // Termin: + 280 dana preko kalendara (setDate), ne preko milisekundi
      var kraj = new Date(pocetak.getFullYear(), pocetak.getMonth(), pocetak.getDate() + 280);
      var tekstTermina = kraj.getDate() + ". " + MESECI[kraj.getMonth()] + " " + kraj.getFullYear() + ".";

      // Manje od 7 dana: "prvoj nedelji"; inače "11. nedelji i 3 d."
      var tekstNedelje = nedelje < 1
        ? t.prvaNedelja
        : nedelje + ". " + t.nedelji + (ostatak ? " i " + ostatak + " " + t.dana : "");

      // Preporuka: prva čija je granica (doNedelje) veća od trenutne nedelje
      var p = t.preporuke.filter(function (x) { return nedelje < x.doNedelje; })[0] || t.preporuke[t.preporuke.length - 1];
      prikazi(tekstNedelje, tekstTermina, p.tekst, p.link);
    }

    function osvezi() {
      izracunaj();
      rezultat.classList.remove("pojava");
      void rezultat.offsetWidth;
      rezultat.classList.add("pojava");
    }

    // Datum ne može biti u budućnosti
    polje.max = uVrednostPolja(danas());
    // Kao u skici: primer od 11 nedelja (77 dana) dok korisnica ne unese svoj datum
    if (!polje.value) {
      var primer = danas();
      primer.setDate(primer.getDate() - 77);
      polje.value = uVrednostPolja(primer);
    }
    polje.addEventListener("input", osvezi);
    polje.addEventListener("change", osvezi);
    izracunaj();
  }

  pokreniFilter();
  pokreniKalkulator();
})();
