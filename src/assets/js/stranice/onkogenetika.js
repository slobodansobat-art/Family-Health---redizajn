/* =============================================================================
   ONKOGENETIKA: izbor situacije ("Sa kojim pitanjem dolazite")
   -----------------------------------------------------------------------------
   Desktop: klik ili fokus na pitanju prikazuje opis u tamnoj kartici desno
            (aria-pressed). Prelaz mišem ne menja izbor.
   Mobilni: harmonika, opis se otvara ispod pitanja (aria-expanded); može i
            da se zatvori ponovnim klikom.
   Adresa #situacija-1 … #situacija-6 otvara tu situaciju (i sa druge stranice).
   Bez JS-a svi opisi su vidljivi ispod pitanja.
   Oznake: src/_includes/sekcije/onkogenetika/situacije.njk
   ========================================================================== */
(function () {
  "use strict";

  var koren = document.querySelector("[data-situacije]");
  if (!koren) return;

  var MOBILNI = (window.FH && window.FH.mobilni) || window.matchMedia("(max-width: 959px)");
  var stavke = Array.prototype.slice.call(koren.querySelectorAll(".onko-situacije__stavka"));
  var dugmad = stavke.map(function (s) { return s.querySelector(".onko-situacije__dugme"); });
  var paneli = stavke.map(function (s) { return s.querySelector(".onko-situacija"); });
  var mestoPanela = koren.querySelector("[data-situacije-panel]");
  var aktivna = 0;   // redni broj izabrane situacije (od 0); -1 = sve zatvorene (samo mobilni)

  // Broj situacije iz adrese (#situacija-3 -> 2), ili null
  function izAdrese() {
    var m = (location.hash || "").match(/^#situacija-(\d+)$/);
    if (!m) return null;
    return Math.max(0, Math.min(stavke.length - 1, parseInt(m[1], 10) - 1));
  }

  // Prikaži izabranu situaciju i podesi aria oznake
  function prikazi(i, animacija) {
    aktivna = i;
    var mobilni = MOBILNI.matches;
    stavke.forEach(function (s, j) {
      var izabrana = j === i;
      s.classList.toggle("je-izabrana", izabrana);
      paneli[j].hidden = !izabrana;
      if (mobilni) {
        dugmad[j].setAttribute("aria-expanded", izabrana ? "true" : "false");
        dugmad[j].removeAttribute("aria-pressed");
      } else {
        dugmad[j].setAttribute("aria-pressed", izabrana ? "true" : "false");
        dugmad[j].removeAttribute("aria-expanded");
      }
    });
    if (animacija && i >= 0) {
      var p = paneli[i];
      p.classList.remove("pojava");
      void p.offsetWidth;   // ponovo pokreni animaciju pojave
      p.classList.add("pojava");
    }
  }

  // Desktop: opisi idu u desnu kolonu. Mobilni: svaki opis ispod svog pitanja.
  function rasporedi() {
    if (MOBILNI.matches) {
      paneli.forEach(function (p, j) { stavke[j].appendChild(p); });
    } else {
      paneli.forEach(function (p) { mestoPanela.appendChild(p); });
      if (aktivna < 0) aktivna = 0;
    }
    prikazi(aktivna);
  }

  dugmad.forEach(function (d, j) {
    d.addEventListener("click", function () {
      if (MOBILNI.matches) prikazi(aktivna === j ? -1 : j, true);
      else if (aktivna !== j) prikazi(j, true);
    });
    // Desktop: i fokus sa tastature (Tab) bira situaciju; prelaz mišem ne menja ništa
    d.addEventListener("focus", function () {
      if (!MOBILNI.matches && aktivna !== j) prikazi(j, true);
    });
  });

  // Skrol do situacije iz adrese (posle premeštanja opisa raspored se promeni).
  // Desktop: naslov sekcije, da se vide i lista i opis. Mobilni: samo pitanje.
  var naslovSekcije = document.querySelector(".onko-situacije__zaglavlje") || koren;
  function skrolujDo(i) {
    var cilj = MOBILNI.matches ? stavke[i] : naslovSekcije;
    cilj.scrollIntoView({ block: "start" });
  }

  window.addEventListener("hashchange", function () {
    var i = izAdrese();
    if (i === null) return;
    prikazi(i, true);
    skrolujDo(i);
  });
  MOBILNI.addEventListener("change", rasporedi);

  var izLinka = izAdrese();
  if (izLinka !== null) aktivna = izLinka;
  rasporedi();
  if (izLinka !== null) {
    // Pregledač sam skače na #situacija-N pri učitavanju; naš skrol ide posle toga
    var skrol = function () { setTimeout(function () { skrolujDo(izLinka); }, 0); };
    if (document.readyState === "complete") skrol();
    else window.addEventListener("load", skrol);
  }
})();
