/* =============================================================================
   KONTAKT (/kontakt/): izbor teme u formi "kontakt-upit"
   -----------------------------------------------------------------------------
   Tema je radio dugme (name="tema") koje izgleda kao čip i šalje se sa formom.
   Kad se tema promeni:
     - prikazuje se kratko uputstvo za tu temu (data-savet)
     - prikazuje se dodatno polje te teme, ako ga ima (data-za-temu), a polja ostalih tema
       se sakrivaju i isključuju (disabled), pa se ne šalju
   Bez JavaScript-a sva dodatna polja su vidljiva i forma radi normalno.
   ========================================================================== */
(function () {
  "use strict";

  var teme = document.querySelector("[data-kontakt-teme]");
  if (!teme) return;
  var forma = teme.closest("form");
  var radio = Array.prototype.slice.call(teme.querySelectorAll('input[name="tema"]'));
  var saveti = Array.prototype.slice.call(forma.querySelectorAll("[data-savet]"));
  var dodatna = Array.prototype.slice.call(forma.querySelectorAll("[data-za-temu]"));

  // Ponovo pokreće kratku animaciju pojave na elementu
  function pojava(el) {
    el.classList.remove("pojava");
    void el.offsetWidth;
    el.classList.add("pojava");
  }

  function primeni(animacija) {
    var izabrana = radio.filter(function (r) { return r.checked; })[0];
    if (!izabrana) return;
    var polje = izabrana.getAttribute("data-tema-polje");

    saveti.forEach(function (s) {
      var vidljiv = s.getAttribute("data-savet") === polje;
      s.hidden = !vidljiv;
      if (vidljiv && animacija) pojava(s);
    });

    dodatna.forEach(function (blok) {
      var vidljiv = blok.getAttribute("data-za-temu") === polje;
      blok.hidden = !vidljiv;
      blok.querySelectorAll("input, textarea, select").forEach(function (u) { u.disabled = !vidljiv; });
      if (vidljiv && animacija) pojava(blok);
    });
  }

  radio.forEach(function (r) {
    r.addEventListener("change", function () { primeni(true); });
  });
  primeni(false);
})();
