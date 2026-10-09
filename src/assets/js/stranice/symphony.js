/* =============================================================================
   SYMPHONY: interaktivni kariogram (sekcija "Šta Symphony pregleda")
   -----------------------------------------------------------------------------
   Dugme režima (Harmony Kvartet / Harmony Plus / Symphony) boji hromozome koje
   taj test pregleda i menja sažetak ispod slike.
   Podaci o režimima: src/sadrzaj/stranice/symphony.json -> kariogram.rezimi
   (na stranici u <script id="symphony-rezimi">).
   Bez JS-a stranica prikazuje podrazumevani režim (Symphony).
   ========================================================================== */
(function () {
  "use strict";

  var sekcija = document.querySelector("[data-kariogram]");
  if (!sekcija) return;

  var rezimi = FH.podaci("symphony-rezimi");
  if (!rezimi || !rezimi.length) return;

  var dugmad = Array.prototype.slice.call(sekcija.querySelectorAll("[data-rezim]"));
  var okvir = sekcija.querySelector("[data-kariogram-okvir]");
  var slika = sekcija.querySelector("[data-kariogram-slika]");
  var hromozomi = Array.prototype.slice.call(sekcija.querySelectorAll("[data-hromozom]"));
  var sazetak = sekcija.querySelector("[data-kariogram-sazetak]");
  var opis = sekcija.querySelector("[data-kariogram-opis]");

  function izaberi(i) {
    var r = rezimi[i];
    if (!r) return;

    // Dugmad: samo izabrano je "pritisnuto"
    dugmad.forEach(function (d, j) { d.setAttribute("aria-pressed", j === i ? "true" : "false"); });

    // Boja režima (mint za Harmony, ljubičasta za Symphony)
    rezimi.forEach(function (x) { okvir.classList.remove("symphony-kariogram__okvir--" + x.boja); });
    okvir.classList.add("symphony-kariogram__okvir--" + r.boja);

    // Hromozomi: pokriven (obojen) i označen (mikrodelecija, npr. 22q11.2)
    hromozomi.forEach(function (h) {
      var oznaka = h.getAttribute("data-hromozom");
      h.classList.toggle("je-pokriven", r.hromozomi.indexOf(oznaka) !== -1);
      h.classList.toggle("je-oznacen", (r.oznaceni || []).indexOf(oznaka) !== -1);
    });

    // Tekst ispod slike + opis slike za čitače ekrana
    slika.setAttribute("aria-label", r.naziv + ": " + r.sazetak);
    sazetak.textContent = r.sazetak;
    opis.textContent = r.opis;
    sazetak.classList.remove("pojava");
    void sazetak.offsetWidth; // ponovo pokreni animaciju ulaska
    sazetak.classList.add("pojava");
  }

  dugmad.forEach(function (d) {
    d.addEventListener("click", function () {
      if (d.getAttribute("aria-pressed") === "true") return;
      izaberi(Number(d.getAttribute("data-rezim")));
    });
  });
})();
