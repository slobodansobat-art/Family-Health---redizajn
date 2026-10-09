/* =============================================================================
   CANCER NEO
   -----------------------------------------------------------------------------
   1. Upitnik "Da li je za vas" (#za-vas): tri pitanja Da/Ne. Drugi klik na isto
      dugme briše odgovor. Rezultat se bira iz zaVas.rezultati u JSON-u stranice
      (na stranici: <script id="neo-rezultati">).
   2. Hero animacija: stoji dok nije na ekranu (štedi bateriju na telefonu).
   Bez JS-a: vide se pitanja i početna poruka, animacija radi stalno.
   ========================================================================== */
(function () {
  "use strict";

  /* --- 1. Upitnik ----------------------------------------------------------- */
  function pokreniUpitnik() {
    var upitnik = document.querySelector("[data-neo-upitnik]");
    if (!upitnik) return;
    var rezultati = FH.podaci("neo-rezultati");
    var kutija = upitnik.querySelector("[data-neo-rezultat]");
    if (!rezultati || !kutija) return;

    var dugmad = Array.prototype.slice.call(upitnik.querySelectorAll("[data-pitanje]"));
    var brojPitanja = upitnik.querySelectorAll(".neo-zavas__pitanje").length;
    var odgovori = [];
    for (var i = 0; i < brojPitanja; i++) odgovori.push(null);   // null = bez odgovora

    var polja = {
      oznaka: kutija.querySelector('[data-polje="oznaka"]'),
      naslov: kutija.querySelector('[data-polje="naslov"]'),
      tekst: kutija.querySelector('[data-polje="tekst"]'),
      dugme: kutija.querySelector('[data-polje="dugme"]')
    };

    // Isti redosled provere kao u skici: 1. solidan tumor, 2. tkivo, 3. onkolog
    function izaberiRezultat() {
      var bezOdgovora = odgovori.filter(function (o) { return o === null; }).length;
      if (bezOdgovora) {
        var r = rezultati.nepotpun;
        var tekst = (bezOdgovora === 1 ? r.tekstJedno : r.tekst).replace("{n}", bezOdgovora);
        return { r: r, tekst: tekst };
      }
      if (odgovori.every(function (o) { return o === true; })) return { r: rezultati.kandidat };
      if (!odgovori[0]) return { r: rezultati.nijeSolidan };
      if (!odgovori[1]) return { r: rezultati.bezTkiva };
      return { r: rezultati.bezOnkologa };
    }

    function prikazi() {
      var izbor = izaberiRezultat();
      var r = izbor.r;
      polja.oznaka.textContent = r.oznaka;
      polja.naslov.textContent = r.naslov;
      polja.tekst.textContent = izbor.tekst || r.tekst;
      polja.dugme.hidden = !r.dugme;
      kutija.classList.toggle("neo-zavas__rezultat--tamna", !!r.tamna);
      // Kratka animacija pojave pri svakoj promeni
      kutija.classList.remove("pojava");
      void kutija.offsetWidth;
      kutija.classList.add("pojava");
    }

    dugmad.forEach(function (d) {
      d.addEventListener("click", function () {
        var i = Number(d.getAttribute("data-pitanje"));
        var vrednost = d.getAttribute("data-odgovor") === "da";
        odgovori[i] = odgovori[i] === vrednost ? null : vrednost;
        // Dugmad istog pitanja: pritisnuto je samo izabrano
        dugmad.forEach(function (x) {
          if (Number(x.getAttribute("data-pitanje")) !== i) return;
          var jeIzabrano = odgovori[i] !== null && (x.getAttribute("data-odgovor") === "da") === odgovori[i];
          x.setAttribute("aria-pressed", jeIzabrano ? "true" : "false");
        });
        prikazi();
      });
    });
  }

  /* --- 2. Animacija stoji van ekrana ---------------------------------------- */
  function pokreniAnimaciju() {
    var omotaci = document.querySelectorAll("[data-neo-animacija]");
    if (!omotaci.length || !("IntersectionObserver" in window)) return;
    var posmatrac = new IntersectionObserver(function (stavke) {
      stavke.forEach(function (s) { s.target.classList.toggle("je-pauzirana", !s.isIntersecting); });
    });
    omotaci.forEach(function (o) { posmatrac.observe(o); });
  }

  pokreniUpitnik();
  pokreniAnimaciju();
})();
