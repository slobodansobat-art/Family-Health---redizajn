/* =============================================================================
   MATIČNE ĆELIJE (/maticne-celije/)
   -----------------------------------------------------------------------------
     pokreniPitanja()  lista pitanja za banku: klik prikazuje odgovor, brojač
                       "Pročitano X od 6", dugme "Sledeće pitanje"
     pokreniRok()      slajder nedelje trudnoće (miš, tastatura, dodir, −/+)
                       i poruka "do kada da odlučite"
     pokreniKorake()   na mobilnom je otvoren samo jedan korak (kao u skici);
                       sam stepper je zajednički (glavni.js)
     pokreniPakete()   kalkulator paketa: dužina čuvanja + TotiCyte + popust
                       uz prenatalni test -> cena, rata i polje "Izabrani paket"
   Podaci: src/sadrzaj/stranice/maticne-celije.json (na stranici u
   <script id="mc-rok-podaci"> i <script id="mc-paketi-podaci">).
   Bez JS-a: vide se svi odgovori, poruka i cena za početno stanje.
   ========================================================================== */
(function () {
  "use strict";

  // Zameni {kljuc} u tekstu iz JSON-a: popuni("Pročitano {x}", { x: 2 })
  function popuni(sablon, vrednosti) {
    return String(sablon || "").replace(/\{(\w+)\}/g, function (ceo, kljuc) {
      return Object.prototype.hasOwnProperty.call(vrednosti, kljuc) ? vrednosti[kljuc] : ceo;
    });
  }

  // Ponovo pokreni animaciju ulaska (klasa .pojava iz 02-osnova.css)
  function animiraj(el) {
    el.classList.remove("pojava");
    void el.offsetWidth;
    el.classList.add("pojava");
  }

  /* --- Pitanja za banku ---------------------------------------------------- */
  function pokreniPitanja() {
    var sekcija = document.querySelector("[data-mc-pitanja]");
    if (!sekcija) return;
    var dugmad = Array.prototype.slice.call(sekcija.querySelectorAll("[data-mc-pitanje]"));
    var odgovori = Array.prototype.slice.call(sekcija.querySelectorAll("[data-mc-odgovor]"));
    var brojac = sekcija.querySelector("[data-mc-procitano]");
    var redni = sekcija.querySelector("[data-mc-redni]");
    var dno = sekcija.querySelector("[data-mc-dno]");
    var sledece = sekcija.querySelector("[data-mc-sledece]");
    var ukupno = dugmad.length;
    var procitana = [0];   // prvo pitanje je otvoreno od početka
    var aktivno = -1;

    function izaberi(i) {
      if (i === aktivno) return;
      aktivno = i;
      if (procitana.indexOf(i) === -1) procitana.push(i);
      dugmad.forEach(function (d, j) {
        d.setAttribute("aria-pressed", j === i ? "true" : "false");
        d.classList.toggle("je-procitano", procitana.indexOf(j) !== -1);
      });
      odgovori.forEach(function (o, j) { o.hidden = j !== i; });
      animiraj(odgovori[i]);
      brojac.textContent = popuni(brojac.getAttribute("data-sablon"), { procitano: procitana.length, ukupno: ukupno });
      redni.textContent = popuni(redni.getAttribute("data-sablon"), { broj: i + 1, ukupno: ukupno });
    }

    dugmad.forEach(function (d, j) {
      d.addEventListener("click", function () { izaberi(j); });
    });
    sledece.addEventListener("click", function () { izaberi((aktivno + 1) % ukupno); });

    sekcija.classList.add("je-spremno");
    dno.hidden = false;
    izaberi(0);
  }

  /* --- Rok za odluku: slajder nedelje -------------------------------------- */
  function pokreniRok() {
    var alat = document.querySelector("[data-mc-rok]");
    var d = FH.podaci("mc-rok-podaci");
    if (!alat || !d) return;
    var klizac = alat.querySelector("[data-mc-rok-klizac]");
    var vrednost = alat.querySelector("[data-mc-rok-vrednost]");
    var poruka = alat.querySelector("[data-mc-rok-poruka]");
    var porukaNaslov = poruka.querySelector(".mc-rok__poruka-naslov");
    var porukaTekst = poruka.querySelector(".mc-rok__poruka-tekst");
    var nedelja = Number(klizac.value);
    var prethodna = null;

    // Prva poruka čiji je prag ("doNedelje") veći od izabrane nedelje
    function porukaZa(n) {
      for (var i = 0; i < d.poruke.length; i++) {
        if (n < d.poruke[i].doNedelje) return d.poruke[i];
      }
      return d.poruke[d.poruke.length - 1];
    }

    function postavi(n) {
      nedelja = Math.max(d.najmanje, Math.min(d.najvise, n));
      klizac.value = nedelja;
      klizac.setAttribute("aria-valuetext", popuni(klizac.getAttribute("data-sablon"), { nedelja: nedelja }));
      vrednost.textContent = nedelja + ".";

      var preostalo = Math.max(0, d.termin - nedelja);
      var p = porukaZa(nedelja);
      porukaNaslov.textContent = p.naslov;
      porukaTekst.textContent = popuni(p.tekst, { preostalo: preostalo, nedelja: FH.nedelja(preostalo) });
      if (prethodna && p !== prethodna) animiraj(poruka);
      prethodna = p;
    }

    // "input" stiže dok se klizač vuče (miš, dodir) i na strelice tastature
    klizac.addEventListener("input", function () { postavi(Number(klizac.value)); });
    alat.querySelector("[data-mc-rok-minus]").addEventListener("click", function () { postavi(nedelja - 1); });
    alat.querySelector("[data-mc-rok-plus]").addEventListener("click", function () { postavi(nedelja + 1); });
    postavi(nedelja);
  }

  /* --- Koraci: na mobilnom samo jedan otvoren ------------------------------ */
  function pokreniKorake() {
    var lista = document.querySelector(".mc-proces .koraci__lista");
    if (!lista) return;
    // Osluškuje se na listi, pa se izvršava posle zajedničkog klika (glavni.js)
    lista.addEventListener("click", function (e) {
      var dugme = e.target.closest(".koraci__dugme");
      if (!dugme || !FH.mobilni.matches || dugme.getAttribute("aria-expanded") !== "true") return;
      lista.querySelectorAll(".koraci__stavka").forEach(function (s) {
        var d = s.querySelector(".koraci__dugme");
        if (d === dugme) return;
        s.classList.remove("je-otvoren");
        d.setAttribute("aria-expanded", "false");
        var panel = document.getElementById(d.getAttribute("aria-controls"));
        if (panel) panel.hidden = true;
      });
    });
  }

  /* --- Kalkulator paketa ---------------------------------------------------- */
  function pokreniPakete() {
    var sekcija = document.querySelector("[data-mc-paketi]");
    var d = FH.podaci("mc-paketi-podaci");
    if (!sekcija || !d) return;
    var o = d.obracun;
    var opcije = Array.prototype.slice.call(sekcija.querySelectorAll("[data-mc-paket]"));
    var prekidac = sekcija.querySelector("[data-mc-toti]");
    var prekidacPopust = sekcija.querySelector("[data-mc-prenatalni]");
    var popustEl = sekcija.querySelector("[data-mc-popust]");
    var naslov = sekcija.querySelector("[data-mc-naslov]");
    var ukupnoEl = sekcija.querySelector("[data-mc-ukupno]");
    var rate = sekcija.querySelector("[data-mc-rate]");
    var poljeForme = document.querySelector("[data-mc-paket-polje]");
    var izabran = 0;
    var saToti = !!d.toti.ukljucenNaPocetku;
    var saPopustom = !!(d.prenatalni && d.prenatalni.ukljucenNaPocetku);

    function osvezi() {
      var paket = d.stavke[izabran];
      // Popust uz prenatalni test umanjuje osnovnu cenu paketa
      var ukupno = paket.cena - (saPopustom ? d.prenatalni.popust : 0) + (saToti ? d.toti.cena : 0);
      var ime = popuni(o.naslovPaketa, { godina: paket.godina }) + (saToti ? o.dodatakToti : "");

      opcije.forEach(function (b, j) { b.setAttribute("aria-pressed", j === izabran ? "true" : "false"); });
      prekidac.setAttribute("aria-checked", saToti ? "true" : "false");
      if (prekidacPopust) prekidacPopust.setAttribute("aria-checked", saPopustom ? "true" : "false");
      if (popustEl) popustEl.hidden = !saPopustom;
      naslov.textContent = ime;
      ukupnoEl.textContent = FH.evra(ukupno);
      rate.textContent = popuni(o.rate, { brojRata: o.brojRata, iznosRate: FH.evra(ukupno / o.brojRata) });
      if (poljeForme) poljeForme.value = ime;
    }

    opcije.forEach(function (b, j) {
      b.addEventListener("click", function () { izabran = j; osvezi(); });
    });
    prekidac.addEventListener("click", function () { saToti = !saToti; osvezi(); });
    if (prekidacPopust) prekidacPopust.addEventListener("click", function () { saPopustom = !saPopustom; osvezi(); });
    osvezi();
  }

  pokreniPitanja();
  pokreniRok();
  pokreniKorake();
  pokreniPakete();
})();
