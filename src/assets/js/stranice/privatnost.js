/* =============================================================================
   POLITIKA PRIVATNOSTI: harmonika na mobilnom
   -----------------------------------------------------------------------------
   Desktop: svi odeljci su otvoreni, naslovi su obični naslovi.
   Mobilni (ispod 960px): naslov odeljka postaje dugme, otvoren je jedan po
   jedan odeljak (prvi, ili onaj na koji vodi #adresa).
   Bez JS-a su svi odeljci otvoreni (sadržaj je uvek čitljiv).
   ========================================================================== */
(function () {
  "use strict";

  var omot = document.querySelector("[data-privatnost-odeljci]");
  if (!omot) return;

  var PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"></path></svg>';

  var odeljci = Array.prototype.slice.call(omot.querySelectorAll("[data-odeljak]")).map(function (s) {
    var naslov = s.querySelector("[data-odeljak-naslov]");
    return { sekcija: s, naslov: naslov, tekst: s.querySelector("[data-odeljak-tekst]"), original: naslov.textContent };
  });
  if (!odeljci.length) return;

  function postavi(o, otvoren) {
    o.sekcija.classList.toggle("je-zatvoren", !otvoren);
    var dugme = o.naslov.querySelector("button");
    if (dugme) dugme.setAttribute("aria-expanded", otvoren ? "true" : "false");
  }

  // Otvara jedan odeljak, ostale zatvara (i = -1 zatvara sve)
  function otvori(i) {
    odeljci.forEach(function (o, j) { postavi(o, j === i); });
  }

  // Indeks odeljka na koji vodi #adresa (ili -1)
  function izAdrese() {
    var hes = decodeURIComponent((location.hash || "").slice(1));
    for (var i = 0; i < odeljci.length; i++) if (odeljci[i].sekcija.id === hes) return i;
    return -1;
  }

  function naMobilni() {
    odeljci.forEach(function (o, i) {
      var dugme = document.createElement("button");
      dugme.type = "button";
      dugme.className = "privatnost-odeljak__dugme";
      dugme.setAttribute("aria-controls", o.tekst.id);
      dugme.innerHTML = '<span></span><span class="privatnost-odeljak__ikonica">' + PLUS + "</span>";
      dugme.firstChild.textContent = o.original;
      dugme.addEventListener("click", function () {
        otvori(o.sekcija.classList.contains("je-zatvoren") ? i : -1);
      });
      o.naslov.textContent = "";
      o.naslov.appendChild(dugme);
    });
    var i = izAdrese();
    otvori(i === -1 ? 0 : i);
  }

  function naDesktop() {
    odeljci.forEach(function (o) {
      o.naslov.textContent = o.original;
      o.sekcija.classList.remove("je-zatvoren");
    });
  }

  function primeni() { FH.mobilni.matches ? naMobilni() : naDesktop(); }

  // Klik na link ka odeljku (#kolacici) na mobilnom otvara taj odeljak
  window.addEventListener("hashchange", function () {
    var i = izAdrese();
    if (FH.mobilni.matches && i !== -1) otvori(i);
  });
  FH.mobilni.addEventListener("change", function () { naDesktop(); primeni(); });
  primeni();
})();
