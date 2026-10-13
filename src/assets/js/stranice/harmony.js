/* =============================================================================
   HARMONY (/trudnoca-i-beba/harmony/)
   1. Izbor paketa: klik na karticu menja zbir (naziv, opis, cena, rate)
      i upisuje izabrani paket u formu za zakazivanje (#kontakt).
   Oznaka uz korak ("Besplatno") je u statičkom HTML-u (makro koraci).
   Tabovi (rezultati), koraci i česta pitanja rade preko glavni.js.
   ========================================================================== */
(function () {
  "use strict";

  /* --- 1. Izbor paketa ------------------------------------------------------ */
  function pokreniPakete() {
    var izbor = document.querySelector("[data-paketi]");
    var podaci = FH.podaci("harmony-podaci");
    if (!izbor || !podaci) return;

    var kartice = Array.prototype.slice.call(izbor.querySelectorAll("[data-paket]"));
    var zbir = document.querySelector(".harmony-paketi__zbir");
    var poljeForme = document.querySelector("[data-polje-paket]");

    function upisi(kljuc, tekst) {
      var el = zbir && zbir.querySelector('[data-izbor="' + kljuc + '"]');
      if (el) el.textContent = tekst;
    }

    function izaberi(i) {
      var p = podaci.stavke[i];
      if (!p) return;
      kartice.forEach(function (k, j) { k.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      upisi("naziv", p.naziv);
      upisi("opis", p.opis);
      upisi("cena", FH.evra(p.cena));
      upisi("rata", FH.evra(p.cena / podaci.brojRata));
      if (poljeForme) poljeForme.value = p.naziv + ", " + FH.evra(p.cena);
      // Kratka animacija zbira (ponovo se pokreće pri svakoj promeni)
      if (zbir) { zbir.classList.remove("pojava"); void zbir.offsetWidth; zbir.classList.add("pojava"); }
    }

    kartice.forEach(function (k, i) {
      k.addEventListener("click", function () {
        if (k.getAttribute("aria-pressed") !== "true") izaberi(i);
      });
    });
  }

  function pokreni() {
    pokreniPakete();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pokreni);
  else pokreni();
})();
