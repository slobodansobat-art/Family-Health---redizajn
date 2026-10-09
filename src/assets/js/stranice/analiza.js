/* =============================================================================
   ONKO ANALIZA (šablon stranice, uzor: Cancer Precision)
   -----------------------------------------------------------------------------
   Tabovi "Za lekare" / "Za pacijente" rade preko glavni.js (data-tabovi).
   Ovde je samo jedna dopuna: promena taba kada je traka sa tabovima
   prilepljena uz vrh vraća stranicu na početak izabranog panela.
   Oznake: src/_includes/sekcije/analiza/
   ========================================================================== */
(function () {
  "use strict";

  var telo = document.querySelector(".analiza__telo[data-tabovi]");
  if (!telo) return;

  var smanjiPokrete = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- Povratak na početak panela posle promene taba ------------------- */
  telo.addEventListener("tab-izabran", function () {
    var vrh = telo.getBoundingClientRect().top;
    if (vrh < 0) {
      window.scrollTo({ top: window.scrollY + vrh, behavior: smanjiPokrete.matches ? "auto" : "smooth" });
    }
  });

})();
