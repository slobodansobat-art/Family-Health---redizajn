/* =============================================================================
   TRUDNOĆA I BEBA (/trudnoca-i-beba/)
   -----------------------------------------------------------------------------
   1. Alat "U kojoj ste nedelji trudnoće?" (hero):
      - polje dozvoljava slobodno kucanje; opseg 4–42 se primenjuje tek na
        izlasku iz polja ili na Enter
      - pomera oznaku "Vi ste ovde" na vremenskoj liniji
      - "Pokaži mi" vodi na odgovarajuću sekciju i prikazuje poruku za tu nedelju
      - na mobilnom odmah menja "Sada je za vas važno"
      - popunjava polje "Nedelja trudnoće" u kontakt formi; korisnik ga može
        izmeniti (izmena u formi pomera i alat), opseg se proverava na izlasku
   2. Izbor prenatalnog paketa (tabela na desktopu, kartice na mobilnom):
      ukupna cena i rate (FH.evra) u kartici ispod.
   Podaci (tekstovi poruka, paketi): <script id="trudnoca-podaci"> iz JSON-a stranice.
   ========================================================================== */
(function () {
  "use strict";

  var podaci = window.FH && FH.podaci("trudnoca-podaci");
  if (!podaci) return;

  var MIN = 4, MAX = 42;
  var manjePokreta = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Zamena {oznaka} u tekstu iz JSON-a: zameni("U {n}. nedelji", { n: 12 })
  function zameni(tekst, vrednosti) {
    return String(tekst || "").replace(/\{(\w+)\}/g, function (ceo, kljuc) {
      return kljuc in vrednosti ? vrednosti[kljuc] : ceo;
    });
  }
  function ogranici(n) { return Math.max(MIN, Math.min(MAX, n)); }

  // Pravila (ista kao u šablonima):
  //   kuda vodimo: do 14. nedelje testovi, 15–21 škola, od 22. matične ćelije
  //   trenutna faza na liniji: do 14. faza 2, 15–21 faza 3, 22–36 faza 4, od 37. faza 5
  function ciljZa(n) { return n < 15 ? "testovi" : n < 22 ? "skola" : "maticne"; }
  function fazaZa(n) { return n < 15 ? 1 : n < 22 ? 2 : n < 37 ? 3 : 4; }

  // "za 1 nedelju / 2 nedelje / 5 nedelja" (FH.nedelja daje nominativ za 1)
  function zaNedelja(d) {
    var rec = FH.nedelja(d);
    if (d % 10 === 1 && d % 100 !== 11) rec = "nedelju";
    return d + " " + rec;
  }

  /* --- 1. Alat za nedelju trudnoće ----------------------------------------- */
  function pokreniAlat() {
    var alat = document.querySelector("[data-trudnoca-alat]");
    if (!alat) return;
    var a = podaci.alat || {};
    var linija = podaci.linija || {};
    var unos = alat.querySelector("[data-nedelja-unos]");
    var ciljLink = alat.querySelector("[data-nedelja-cilj]");
    var ciljTekst = alat.querySelector("[data-nedelja-cilj-tekst]");
    var ciljOkvir = alat.querySelector("[data-nedelja-vazno]");
    var faze = Array.prototype.slice.call(document.querySelectorAll("[data-linija] > li"));
    var formaPolje = document.querySelector("[data-nedelja-forma]");
    var nedelja = ogranici(parseInt(unos.value, 10) || a.podrazumevanaNedelja || 11);

    // Vremenska linija: trenutna, prošle i buduće faze
    function osveziLiniju() {
      var t = fazaZa(nedelja);
      faze.forEach(function (li, i) {
        li.classList.toggle("je-trenutna", i === t);
        li.classList.toggle("je-prosla", i < t);
        if (i === t) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
        var oznaka = li.querySelector("[data-faza-oznaka]");
        if (oznaka) oznaka.textContent = i !== t ? "" : (nedelja < 10 && i === 1 ? linija.oznakaSledeci : linija.oznakaOvde);
      });
    }

    // Mobilni: "Sada je za vas važno" (+ kratka animacija pri promeni)
    function osveziCilj() {
      if (!ciljLink || !a.ciljevi) return;
      var c = a.ciljevi[ciljZa(nedelja)];
      if (!c) return;
      if (ciljTekst.textContent !== c.tekst) {
        ciljTekst.textContent = c.tekst;
        ciljOkvir.classList.remove("pojava");
        void ciljOkvir.offsetWidth; // ponovo pokreni animaciju
        ciljOkvir.classList.add("pojava");
      }
      ciljLink.setAttribute("href", c.link);
    }

    // Promena nedelje (iz dugmadi, kucanja ili potvrde unosa)
    //   prepisiUnos: upiši broj i u polje alata
    //   izForme: promena dolazi iz kontakt forme, pa polje forme ne diramo
    function postavi(n, prepisiUnos, izForme) {
      nedelja = n;
      if (prepisiUnos) unos.value = String(n);
      if (formaPolje && !izForme) formaPolje.value = String(n);
      osveziLiniju();
      osveziCilj();
    }

    // Kraj unosa (izlazak iz polja ili Enter): broj se ograničava na 4–42
    function potvrdi() {
      var v = parseInt(unos.value, 10);
      var n = isNaN(v) ? nedelja : ogranici(v);
      if (n === nedelja && unos.value === String(n)) return; // ništa se nije promenilo
      postavi(n, true);
    }

    // Poruka u ciljnoj sekciji (ostale se brišu)
    function prikaziPoruku(cilj) {
      var p = a.poruke || {};
      var tekst;
      if (cilj === "testovi") {
        tekst = nedelja < 10
          ? zameni(p.preTesta, { n: nedelja, razlika: zaNedelja(10 - nedelja) })
          : zameni(p.testovi, { n: nedelja });
      } else if (cilj === "skola") {
        tekst = zameni(p.skola, { n: nedelja });
      } else {
        tekst = zameni(nedelja >= 37 ? p.porodjaj : p.maticne, { n: nedelja, telefon: podaci.telefon });
      }
      document.querySelectorAll("[data-poruka]").forEach(function (mesto) {
        mesto.textContent = "";
        if (mesto.getAttribute("data-poruka") !== cilj) return;
        var okvir = document.createElement("div");
        okvir.className = "trudnoca-poruka pojava";
        var tacka = document.createElement("span");
        tacka.className = "trudnoca-poruka__tacka";
        tacka.setAttribute("aria-hidden", "true");
        var p = document.createElement("p");
        p.className = "trudnoca-poruka__tekst";
        p.textContent = tekst;
        okvir.appendChild(tacka);
        okvir.appendChild(p);
        mesto.appendChild(okvir);
      });
    }

    function pokazi() {
      if (formaPolje) formaPolje.value = String(nedelja); // i potvrda iste nedelje popunjava formu
      var cilj = ciljZa(nedelja);
      prikaziPoruku(cilj);
      var sekcija = document.getElementById(cilj);
      if (sekcija) sekcija.scrollIntoView({ behavior: manjePokreta.matches ? "auto" : "smooth", block: "start" });
    }

    alat.querySelector("[data-nedelja-manje]").addEventListener("click", function () { postavi(ogranici(nedelja - 1), true); });
    alat.querySelector("[data-nedelja-vise]").addEventListener("click", function () { postavi(ogranici(nedelja + 1), true); });

    // Slobodno kucanje: važeći broj odmah osvežava liniju, polje se ne dira
    unos.addEventListener("input", function () {
      var v = parseInt(unos.value, 10);
      if (!isNaN(v) && v >= MIN && v <= MAX) postavi(v, false);
    });
    unos.addEventListener("blur", potvrdi);
    unos.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      potvrdi();
      if (!FH.mobilni.matches) pokazi();
    });

    var dugmePokazi = alat.querySelector("[data-nedelja-pokazi]");
    if (dugmePokazi) dugmePokazi.addEventListener("click", function () { potvrdi(); pokazi(); });

    // Mobilni link vodi na sidro na ovoj stranici: prikaži i poruku
    if (ciljLink) ciljLink.addEventListener("click", function () {
      if (formaPolje) formaPolje.value = String(nedelja);
      if ((ciljLink.getAttribute("href") || "").charAt(0) === "#") prikaziPoruku(ciljZa(nedelja));
    });

    // Polje "Nedelja trudnoće" u formi: popunjava ga alat (vidi postavi), a
    // korisnik ga može izmeniti. Važeći broj pomera i alat; opseg 4–42 se
    // primenjuje tek na izlasku iz polja. Prazno polje ostaje prazno.
    if (formaPolje) {
      formaPolje.addEventListener("input", function () {
        var v = parseInt(formaPolje.value, 10);
        if (!isNaN(v) && v >= MIN && v <= MAX) postavi(v, true, true);
      });
      formaPolje.addEventListener("blur", function () {
        var v = parseInt(formaPolje.value, 10);
        if (!isNaN(v)) { formaPolje.value = String(ogranici(v)); postavi(ogranici(v), true, true); }
      });
    }

    // Polje u formi se popunjava tek kad korisnik koristi alat (vidi postavi)
    osveziLiniju();
    osveziCilj();
  }

  /* --- 2. Izbor prenatalnog paketa ------------------------------------------ */
  function pokreniPakete() {
    var sekcija = document.querySelector("[data-testovi]");
    var t = podaci.testovi;
    if (!sekcija || !t || !t.paketi) return;
    var dugmad = Array.prototype.slice.call(sekcija.querySelectorAll("[data-paket]"));
    var celije = Array.prototype.slice.call(sekcija.querySelectorAll("[data-kolona]"));
    var izbor = sekcija.querySelector("[data-izbor]");
    function el(ime) { return izbor.querySelector("[data-izbor-" + ime + "]"); }
    var aktivan = Math.max(0, (t.podrazumevaniPaketRedniBroj || 1) - 1);

    function punNaziv(p) { return p.porodica === p.naziv ? p.naziv : p.porodica + " " + p.naziv; }

    function izaberi(i) {
      if (i === aktivan) return;
      aktivan = i;
      var p = t.paketi[i];
      var rata = FH.evra(p.cena / t.brojRata);

      dugmad.forEach(function (d) { d.setAttribute("aria-pressed", Number(d.getAttribute("data-paket")) === i ? "true" : "false"); });
      celije.forEach(function (c) { c.classList.toggle("je-izabrana", Number(c.getAttribute("data-kolona")) === i); });

      izbor.classList.toggle("trudnoca-izbor--harmony", p.porodica !== "Symphony");
      izbor.classList.toggle("trudnoca-izbor--symphony", p.porodica === "Symphony");
      el("naziv").textContent = punNaziv(p);
      el("opis").textContent = p.opis;
      if (el("opis-mobilni")) el("opis-mobilni").textContent = p.opisMobilni || p.opis;
      el("cena").textContent = FH.evra(p.cena);
      el("rata").textContent = zameni(t.rataTekst, { broj: t.brojRata, rata: rata });
      el("rezultat").textContent = zameni(t.rezultatTekst, { rezultat: p.rezultat });
      el("zakazi").textContent = zameni(t.dugmeZakazite, { paket: punNaziv(p) });
      el("link").textContent = zameni(t.dugmeVise, { porodica: p.porodica });
      el("link").setAttribute("href", p.link);

      // kratka animacija rate (da se vidi da se iznos promenio)
      var r = el("rata");
      r.classList.remove("je-nova");
      void r.offsetWidth;
      r.classList.add("je-nova");
    }

    dugmad.forEach(function (d) {
      d.addEventListener("click", function () { izaberi(Number(d.getAttribute("data-paket"))); });
    });
  }

  pokreniAlat();
  pokreniPakete();
})();
