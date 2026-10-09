/* =============================================================================
   SVE ONKO ANALIZE: filteri kataloga (/onkogenetika/analize/)
   -----------------------------------------------------------------------------
   Sve kartice su već u HTML-u. Ovde se samo sakrivaju one koje ne odgovaraju:
     - cilju      (dugmad data-cilj; kartica ima data-ciljevi="ter pra")
     - uzorku     (dugmad data-uzorak; kartica ima data-tkivo / data-krv)
     - pretrazi   (naziv + opis, bez obzira na velika slova i kvačice)
   Adresa #cilj-ter (bez, pra, nas, imu, tum) unapred bira cilj.
   Adresa #<slug> (npr. #mrd-pracenje) skroluje do te analize.
   ========================================================================== */
(function () {
  "use strict";

  var koren = document.querySelector("[data-analize]");
  if (!koren) return;

  var kartice = Array.prototype.slice.call(koren.querySelectorAll(".analize-kartica"));
  var dugmadCilj = Array.prototype.slice.call(koren.querySelectorAll("[data-cilj]"));
  var dugmadUzorak = Array.prototype.slice.call(koren.querySelectorAll("[data-uzorak]"));
  var brojac = koren.querySelector("[data-analize-brojac]");
  var prazno = koren.querySelector("[data-analize-prazno]");
  var ponisti = koren.querySelector("[data-analize-ponisti]");
  var pretraga = document.querySelector("[data-analize-pretraga]");

  var stanje = { cilj: "sve", uzorak: "sve", upit: "" };

  // Tekst za pretragu: mala slova, bez kvačica (č, ć, š, ž, đ)
  function normalizuj(tekst) {
    return String(tekst || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "dj").trim();
  }
  kartice.forEach(function (k) {
    var naziv = k.querySelector(".analize-kartica__naziv");
    var opis = k.querySelector(".analize-kartica__opis");
    k._tekst = normalizuj((naziv ? naziv.textContent : "") + " " + (opis ? opis.textContent : ""));
    k._ciljevi = (k.getAttribute("data-ciljevi") || "").split(" ");
  });

  function odgovara(k) {
    if (stanje.cilj !== "sve" && k._ciljevi.indexOf(stanje.cilj) === -1) return false;
    if (stanje.uzorak === "tkivo" && k.getAttribute("data-tkivo") !== "da") return false;
    if (stanje.uzorak === "krv" && k.getAttribute("data-krv") !== "da") return false;
    if (stanje.upit && k._tekst.indexOf(stanje.upit) === -1) return false;
    return true;
  }

  function oznaciDugmad(dugmad, atribut, vrednost) {
    dugmad.forEach(function (d) {
      var izabrano = d.getAttribute(atribut) === vrednost;
      d.setAttribute("aria-pressed", izabrano ? "true" : "false");
      // Mobilni: red čipova se skroluje vodoravno; izabrani čip mora da se vidi
      var red = d.parentElement;
      if (izabrano && red.scrollWidth > red.clientWidth) {
        var levo = d.getBoundingClientRect().left - red.getBoundingClientRect().left + red.scrollLeft;
        if (levo < red.scrollLeft || levo + d.offsetWidth > red.scrollLeft + red.clientWidth) {
          red.scrollLeft = Math.max(0, levo - 16);
        }
      }
    });
  }

  // Primeni filtere: sakrij/prikaži kartice, ponovo pokreni animaciju pojave
  function primeni() {
    oznaciDugmad(dugmadCilj, "data-cilj", stanje.cilj);
    oznaciDugmad(dugmadUzorak, "data-uzorak", stanje.uzorak);
    var prikazano = 0;
    kartice.forEach(function (k) {
      var vidljiva = odgovara(k);
      k.hidden = !vidljiva;
      if (vidljiva) {
        k.style.setProperty("--kasnjenje", prikazano * 40 + "ms");
        k.style.animationName = "none";
        void k.offsetWidth; // osvežavanje, da animacija krene ispočetka
        k.style.animationName = "";
        prikazano++;
      }
    });
    if (brojac) {
      brojac.textContent = (brojac.getAttribute("data-sablon") || "")
        .replace("{prikazano}", prikazano)
        .replace("{ukupno}", kartice.length);
    }
    if (prazno) prazno.hidden = prikazano > 0;
  }

  dugmadCilj.forEach(function (d) {
    d.addEventListener("click", function () { stanje.cilj = d.getAttribute("data-cilj"); primeni(); });
  });
  dugmadUzorak.forEach(function (d) {
    d.addEventListener("click", function () { stanje.uzorak = d.getAttribute("data-uzorak"); primeni(); });
  });
  if (pretraga) {
    pretraga.addEventListener("input", function () { stanje.upit = normalizuj(pretraga.value); primeni(); });
    // Kraći placeholder na telefonu
    var dugi = pretraga.getAttribute("placeholder");
    var kratki = pretraga.getAttribute("data-placeholder-mobilni") || dugi;
    var postaviPlaceholder = function () { pretraga.setAttribute("placeholder", FH.mobilni.matches ? kratki : dugi); };
    FH.mobilni.addEventListener("change", postaviPlaceholder);
    postaviPlaceholder();
  }
  if (ponisti) {
    ponisti.addEventListener("click", function () {
      stanje = { cilj: "sve", uzorak: "sve", upit: "" };
      if (pretraga) pretraga.value = "";
      primeni();
    });
  }

  // Adresa: #cilj-xxx bira cilj; #slug prikazuje i skroluje do analize
  function izAdrese(skroluj) {
    var hes = decodeURIComponent((location.hash || "").slice(1));
    if (!hes) return;
    var m = hes.match(/^cilj-([a-z]+)$/);
    if (m && dugmadCilj.some(function (d) { return d.getAttribute("data-cilj") === m[1]; })) {
      stanje.cilj = m[1];
      primeni();
      if (skroluj) koren.scrollIntoView({ block: "start" });
      return;
    }
    var kartica = document.getElementById(hes);
    if (kartica && kartice.indexOf(kartica) !== -1 && kartica.hidden) {
      stanje = { cilj: "sve", uzorak: "sve", upit: "" };
      if (pretraga) pretraga.value = "";
      primeni();
      kartica.scrollIntoView({ block: "center" });
    }
  }
  window.addEventListener("hashchange", function () { izAdrese(true); });

  // Pretraga koju je pregledač zapamtio (dugme "nazad")
  if (pretraga && pretraga.value) stanje.upit = normalizuj(pretraga.value);
  izAdrese(false);
  primeni();
})();
