/* =============================================================================
   POČETNA (/): ponašanje stranice
   -----------------------------------------------------------------------------
     pokreniHero()    podeljeni hero: deo se širi na miš, klik, dodir i fokus
     pokreniTraku()   traka partnera: dugme Zaustavi / Pokreni
   HTML: src/_includes/sekcije/pocetna/hero.njk i partneri.njk
   Stil: src/assets/css/stranice/pocetna.css
   ========================================================================== */
(function () {
  "use strict";

  /* --- Podeljeni hero ------------------------------------------------------
     Samo na desktopu (od 960px). Prošireni deo dobija klasu .je-prosiren,
     drugi .je-sklopljen. Bez klasa: osnovno stanje (oba dela vidljiva).
     ------------------------------------------------------------------------ */
  function pokreniHero() {
    var podela = document.querySelector("[data-pocetna-hero]");
    if (!podela) return;
    var delovi = Array.prototype.slice.call(podela.querySelectorAll(".pocetna-hero__deo"));
    var mreza = podela.querySelector("[data-pocetna-mreza]");
    var aktivan = null;
    var tiho = false; // true dok JS sam pomera fokus (tada se deo ne širi)

    function jeDesktop() { return !(window.FH && FH.mobilni.matches); }

    // Proširi izabrani deo, suzi drugi
    function prosiri(deo) {
      if (!jeDesktop() || aktivan === deo) return;
      aktivan = deo;
      delovi.forEach(function (d) {
        d.classList.toggle("je-prosiren", d === deo);
        d.classList.toggle("je-sklopljen", d !== deo);
      });
      // Svaki ulazak u onko deo ponovo pokreće formiranje mreže (kao u skici)
      if (mreza && deo.classList.contains("pocetna-hero__deo--onko")) {
        mreza.classList.add("ponovo");
        void mreza.offsetWidth; // osvežavanje, da animacija krene ispočetka
        mreza.classList.remove("ponovo");
      }
    }

    // Vrati oba dela u osnovno stanje
    function vrati() {
      if (!aktivan) return;
      aktivan = null;
      delovi.forEach(function (d) { d.classList.remove("je-prosiren", "je-sklopljen"); });
    }

    // Da li je fokus sa tastature unutar hero-a (tada ga ne zatvaramo mišem)
    function fokusUnutra() {
      var a = document.activeElement;
      return a && podela.contains(a) && a.matches(":focus-visible");
    }

    delovi.forEach(function (deo) {
      // Miš: ulazak u deo
      deo.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") prosiri(deo); });
      // Klik i dodir (telefon, tablet): proširuje deo; linkovi rade normalno
      deo.addEventListener("click", function () { prosiri(deo); });
      // Tastatura: fokus na link u delu
      deo.addEventListener("focusin", function () { if (!tiho) prosiri(deo); });
    });

    // Miš izašao iz hero-a
    podela.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse" && !fokusUnutra()) vrati();
    });
    // Fokus otišao van hero-a
    podela.addEventListener("focusout", function (e) {
      if (!podela.contains(e.relatedTarget) && !podela.matches(":hover")) vrati();
    });
    // Dodir ili klik van hero-a
    document.addEventListener("click", function (e) { if (!podela.contains(e.target)) vrati(); });
    // Escape vraća osnovno stanje. Ako je fokus bio na dodatnom linku (koji se
    // sada skriva), fokus prelazi na glavno dugme istog dela.
    podela.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !aktivan) return;
      var a = document.activeElement;
      if (a && a.closest(".pocetna-hero__dodatno")) {
        var dugme = a.closest(".pocetna-hero__deo").querySelector(".pocetna-hero__osnovno .dugme");
        tiho = true;
        if (dugme) dugme.focus();
        tiho = false;
      }
      vrati();
    });

    // Prelazak na mobilni raspored: bez širenja
    if (window.FH) FH.mobilni.addEventListener("change", function (e) { if (e.matches) vrati(); });
  }

  /* --- Traka partnera: Zaustavi / Pokreni ---------------------------------- */
  function pokreniTraku() {
    var sekcija = document.querySelector("[data-pocetna-traka]");
    if (!sekcija) return;
    var dugme = sekcija.querySelector(".pocetna-partneri__pauza");
    var traka = sekcija.querySelector(".pocetna-partneri__traka");
    if (!dugme || !traka) return;
    dugme.hidden = false; // dugme ima smisla samo uz JS
    dugme.addEventListener("click", function () {
      var zaustavljena = !traka.classList.contains("je-zaustavljena");
      traka.classList.toggle("je-zaustavljena", zaustavljena);
      dugme.setAttribute("aria-pressed", zaustavljena ? "true" : "false");
      dugme.textContent = zaustavljena ? dugme.dataset.tekstPokreni : dugme.dataset.tekstZaustavi;
    });
  }

  function pokreni() {
    pokreniHero();
    pokreniTraku();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pokreni);
  else pokreni();
})();
