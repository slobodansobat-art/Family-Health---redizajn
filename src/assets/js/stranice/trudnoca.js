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
   2. Prenatalni testovi:
      - vodič kroz izbor testa (4 pitanja, izbor hromozoma kod odstupanja,
        poseban savet za iščezlog blizanca) daje preporuku po stalnim
        pravilima (funkcija preporuka, prepisana iz skice)
      - izbor paketa (tabela na desktopu, kartice na mobilnom); dok korisnik
        ne izabere paket, označen je paket koji preporučuje vodič
      - ukupna cena i rate (FH.evra) u kartici ispod
   Nedelja trudnoće je zajednička za alat u hero sekciji i vodič.
   Podaci (tekstovi poruka, paketi, vodič): <script id="trudnoca-podaci"> iz JSON-a stranice.
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
  function svi(koren, selektor) { return Array.prototype.slice.call(koren.querySelectorAll(selektor)); }

  // Nedelja trudnoće, zajednička za alat i vodič:
  //   javiNedelju(n) obaveštava sve koji prate promenu (npr. vodič)
  //   promeniNedelju(n) postavlja alat (ako ga ima na stranici)
  var trenutnaNedelja = ogranici((podaci.alat && podaci.alat.podrazumevanaNedelja) || 11);
  var pratiociNedelje = [];
  var promeniNedelju = null;
  function javiNedelju(n) {
    trenutnaNedelja = n;
    pratiociNedelje.forEach(function (fn) { fn(n); });
  }

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
      javiNedelju(n);
    }
    promeniNedelju = function (n) { postavi(ogranici(n), true); };

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
    javiNedelju(nedelja);
  }


  /* --- 2. Prenatalni testovi: vodič i izbor paketa -------------------------- */

  // Pravila preporuke (iz skice; isti odgovori uvek daju istu preporuku).
  //   odg: { bebe, godine, nalaz, prioritet }, hrom: izabrani hromozomi redom klika
  //   Vraća { m: glavni paket, a: druga opcija ili null, r: ključ razloga u
  //   vodic.razlozi, v: vrednosti za {oznake} u razlogu }.
  //   Paketi se navode po nazivu: Trio, Kvartet, Plus, Symphony.
  //   Kod blizanaca dolaze u obzir samo Harmony Trio i Symphony.
  var CESTE_TRIZOMIJE = ["13", "18", "21"];
  function lista(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " i " + a[a.length - 1]; }
  function preporuka(odg, hrom, razlozi) {
    var blizanci = odg.bebe === "dve", odst = odg.nalaz === "odstupanje", st35 = odg.godine === "35", pr = odg.prioritet;
    var sum = odst ? (hrom || []) : [];
    var tris = sum.filter(function (n) { return CESTE_TRIZOMIJE.indexOf(n) > -1; });
    var pol = sum.filter(function (n) { return n === "X" || n === "Y"; });
    var ost = sum.filter(function (n) { return CESTE_TRIZOMIJE.indexOf(n) < 0 && n !== "X" && n !== "Y"; });
    function hr(a) { return zameni(a.length > 1 ? razlozi.hromozomVise : razlozi.hromozomJedan, { lista: lista(a) }); }

    if (blizanci && (pol.length || ost.length)) return { m: "Symphony", a: null, r: "blizanciVanHarmony", v: { hromozomi: hr(pol.concat(ost)) } };
    if (!blizanci && ost.length) return { m: "Symphony", a: null, r: "vanHarmony", v: { hromozomi: hr(ost) } };
    // Sumnja na trizomiju 21 (bez hromozoma koje Harmony ne proverava): glavni predlog je Harmony
    if (blizanci && tris.indexOf("21") > -1) return { m: "Trio", a: "Symphony", r: "blizanciTrizomija21" };
    if (!blizanci && tris.indexOf("21") > -1) return { m: "Plus", a: "Symphony", r: "trizomija21" };
    if (!blizanci && pol.length) return { m: "Symphony", a: tris.length ? "Plus" : "Kvartet", r: tris.length ? "polniITrizomije" : "polni" };
    if (!blizanci && tris.length) return { m: "Symphony", a: "Plus", r: tris.length > 1 ? "trizomije" : "trizomija", v: { trizomije: lista(tris) } };
    if (blizanci) {
      if (!odst && (pr === "cena" || (pr === "brzina" && !st35))) return { m: "Trio", a: "Symphony", r: "blizanciPovoljno" };
      return { m: "Symphony", a: "Trio", r: "blizanci" };
    }
    if (odst) return { m: "Symphony", a: "Plus", r: "odstupanje" };
    if (pr === "sirok") return { m: "Symphony", a: "Plus", r: "najsiri" };
    if (st35 && pr === "brzina") return { m: "Symphony", a: "Plus", r: "posle35Brzina" };
    if (st35) return { m: "Plus", a: "Symphony", r: "posle35" };
    if (pr === "cena") return { m: "Kvartet", a: "Symphony", r: "cena" };
    return { m: "Plus", a: "Symphony", r: "ostalo" };
  }

  function pokreniTestove() {
    var sekcija = document.querySelector("[data-testovi]");
    var t = podaci.testovi;
    if (!sekcija || !t || !t.paketi) return;
    var v = podaci.vodic || {};
    var vodic = sekcija.querySelector("[data-vodic]");

    function punNaziv(p) { return p.porodica === p.naziv ? p.naziv : p.porodica + " " + p.naziv; }
    function indeksPaketa(naziv) {
      for (var i = 0; i < t.paketi.length; i++) if (t.paketi[i].naziv === naziv) return i;
      return null;
    }
    function rata(tekst, p) { return zameni(tekst, { broj: t.brojRata, rata: FH.evra(p.cena / t.brojRata) }); }

    // Stanje: odgovori vodiča, hromozomi, ručno izabran paket (null = nije)
    var stanje = { odg: {}, hrom: [], hromNe: false, paket: null };
    var kljucevi = (v.pitanja || []).map(function (q) { return q.kljuc; });

    // --- Elementi -----------------------------------------------------------
    var dugmadPaketa = svi(sekcija, "[data-paket]");
    var celije = svi(sekcija, "[data-kolona]");
    var oznakePaketa = svi(sekcija, "[data-paket-oznaka]");
    var izbor = sekcija.querySelector("[data-izbor]");
    var mesto = sekcija.querySelector("[data-paket-mesto]");
    function el(ime) { return izbor.querySelector("[data-izbor-" + ime + "]"); }

    var grupe = vodic ? svi(vodic, "[data-vodic-pitanje]") : [];
    var hromPanel = vodic && vodic.querySelector("[data-vodic-hromozomi]");
    var hromDugmad = vodic ? svi(vodic, "[data-hromozom]") : [];
    var neZnam = vodic && vodic.querySelector("[data-hromozom-ne-znam]");
    var paneli = {};
    if (vodic) svi(vodic, "[data-vodic-panel]").forEach(function (p) { paneli[p.getAttribute("data-vodic-panel")] = p; });
    function vp(ime) { return vodic.querySelector('[data-vp="' + ime + '"]'); }

    // --- Prikaz ---------------------------------------------------------------
    // Kartica izabranog paketa (animacija: da se vidi da se iznos promenio)
    function popuniIzbor(i, animiraj) {
      var p = t.paketi[i];
      izbor.classList.toggle("trudnoca-izbor--harmony", p.porodica !== "Symphony");
      izbor.classList.toggle("trudnoca-izbor--symphony", p.porodica === "Symphony");
      el("naziv").textContent = punNaziv(p);
      el("opis").textContent = p.opis;
      if (el("opis-mobilni")) el("opis-mobilni").textContent = p.opisMobilni || p.opis;
      el("cena").textContent = FH.evra(p.cena);
      el("rata").textContent = rata(t.rataTekst, p);
      el("rezultat").textContent = zameni(t.rezultatTekst, { rezultat: p.rokRezultata || p.rezultat });
      el("zakazi").textContent = zameni(t.dugmeZakazite, { paket: punNaziv(p) });
      el("link").textContent = zameni(t.dugmeVise, { porodica: p.porodica });
      el("link").setAttribute("href", p.link);
      if (animiraj) {
        var r = el("rata");
        r.classList.remove("je-nova");
        void r.offsetWidth;
        r.classList.add("je-nova");
      }
    }

    function osvezi(animiraj) {
      var odg = stanje.odg;
      var iscezli = odg.bebe === "iscezli";
      var odgovoreno = kljucevi.filter(function (k) { return odg[k]; }).length;
      var spreman = !!vodic && !iscezli && kljucevi.length > 0 && odgovoreno === kljucevi.length;
      var rec = null;
      if (spreman) {
        var r = preporuka(odg, stanje.hrom, v.razlozi || {});
        rec = { m: indeksPaketa(r.m), a: r.a ? indeksPaketa(r.a) : null, r: r };
      }

      if (vodic) {
        // Pitanja: izabrani odgovori; kod iščezlog blizanca ostala pitanja se ne prikazuju
        grupe.forEach(function (g) {
          var k = g.getAttribute("data-vodic-pitanje");
          g.hidden = iscezli && k !== kljucevi[0];
          svi(g, "[data-vodic-odgovor]").forEach(function (b) {
            b.setAttribute("aria-pressed", odg[k] === b.getAttribute("data-vodic-odgovor") ? "true" : "false");
          });
        });
        // Hromozomi: samo kod odstupanja na kombinovanom testu ili ultrazvuku
        if (hromPanel) hromPanel.hidden = odg.nalaz !== "odstupanje";
        hromDugmad.forEach(function (b) {
          b.setAttribute("aria-pressed", stanje.hrom.indexOf(b.getAttribute("data-hromozom")) > -1 ? "true" : "false");
        });
        if (neZnam) neZnam.setAttribute("aria-pressed", stanje.hromNe ? "true" : "false");

        // Paneli rezultata
        if (paneli.cekanje) paneli.cekanje.hidden = spreman || iscezli;
        if (paneli.iscezli) paneli.iscezli.hidden = !iscezli;
        if (paneli.preporuka) paneli.preporuka.hidden = !spreman;

        if (!spreman && !iscezli && v.cekanje) {
          vodic.querySelector("[data-vodic-odgovoreno]").textContent = zameni(v.cekanje.naslov, { n: odgovoreno, ukupno: kljucevi.length });
          svi(vodic, "[data-vodic-segment]").forEach(function (s, i) { s.classList.toggle("je-odgovoreno", i < odgovoreno); });
        }

        if (rec && rec.m != null) {
          var m = t.paketi[rec.m], a = rec.a != null ? t.paketi[rec.a] : null, pr = v.preporuka || {};
          var w = trenutnaNedelja;
          var nedeljaTekst = w < 10
            ? zameni(pr.nedeljaPre, { razlika: zaNedelja(10 - w) })
            : zameni(pr.nedeljaSada, { n: w });
          vp("naziv").textContent = punNaziv(m);
          vp("opis").textContent = m.opis;
          vp("opis-mobilni").textContent = m.opisMobilni || m.opis;
          vp("cena").textContent = FH.evra(m.cena);
          vp("rata").textContent = rata(pr.rate, m);
          vp("razlog").textContent = zameni((v.razlozi || {})[rec.r.r], rec.r.v || {});
          vp("nedelja").textContent = nedeljaTekst + " " + zameni(pr.rezultat, { rok: m.rokRezultata || m.rezultat });
          vp("izaberi").textContent = zameni(pr.dugmeIzaberite, { paket: punNaziv(m) });
          vp("druga").hidden = !a;
          if (a) {
            vp("druga-naziv").textContent = punNaziv(a);
            vp("druga-opis").textContent = a.opis;
            vp("druga-opis-mobilni").textContent = a.opisMobilni || a.opis;
            vp("druga-cena").textContent = FH.evra(a.cena);
          }
        }
      }

      // Paket označen u tabeli: ručni izbor, a ako ga nema, preporuka vodiča
      var ef = stanje.paket != null ? stanje.paket : (rec ? rec.m : null);
      dugmadPaketa.forEach(function (d) { d.setAttribute("aria-pressed", Number(d.getAttribute("data-paket")) === ef ? "true" : "false"); });
      celije.forEach(function (c) { c.classList.toggle("je-izabrana", Number(c.getAttribute("data-kolona")) === ef); });
      oznakePaketa.forEach(function (o) {
        var i = Number(o.closest("[data-paket]").getAttribute("data-paket"));
        var tekst = !rec ? "" : i === rec.m ? t.oznakaPreporuka : i === rec.a ? t.oznakaDrugaOpcija : "";
        o.textContent = tekst || "";
        o.classList.toggle("je-preporuka", !!rec && i === rec.m);
      });
      sekcija.classList.toggle("ima-izbor", ef != null);
      if (ef != null) popuniIzbor(ef, animiraj);
      stanje.preporuka = rec;   // za dugmad "Izaberite …" i "Druga opcija"
    }

    // --- Događaji -------------------------------------------------------------
    function skrolujDoPaketa() {
      if (mesto) mesto.scrollIntoView({ behavior: manjePokreta.matches ? "auto" : "smooth", block: "center" });
    }
    function izaberiPaket(i, skroluj) {
      if (i == null) return;
      var promena = stanje.paket !== i;
      stanje.paket = i;
      osvezi(promena || skroluj);
      if (skroluj) skrolujDoPaketa();
    }

    dugmadPaketa.forEach(function (d) {
      d.addEventListener("click", function () {
        var i = Number(d.getAttribute("data-paket"));
        if (stanje.paket !== i) izaberiPaket(i, false);
      });
    });

    if (vodic) {
      // Nedelja: dugmad u vodiču menjaju i alat u hero sekciji (i obrnuto)
      var nedeljaIzlaz = vodic.querySelector("[data-vodic-nedelja]");
      svi(vodic, "[data-vodic-korak]").forEach(function (b) {
        b.addEventListener("click", function () {
          var n = ogranici(trenutnaNedelja + Number(b.getAttribute("data-vodic-korak")));
          if (promeniNedelju) promeniNedelju(n); else javiNedelju(n);
        });
      });
      pratiociNedelje.push(function (n) {
        nedeljaIzlaz.textContent = n + ".";
        if (stanje.preporuka) osvezi(false);   // tekst o nedelji u preporuci
      });
      nedeljaIzlaz.textContent = trenutnaNedelja + ".";

      grupe.forEach(function (g) {
        var k = g.getAttribute("data-vodic-pitanje");
        svi(g, "[data-vodic-odgovor]").forEach(function (b) {
          b.addEventListener("click", function () {
            stanje.odg[k] = b.getAttribute("data-vodic-odgovor");
            osvezi(false);
          });
        });
      });
      hromDugmad.forEach(function (b) {
        b.addEventListener("click", function () {
          var n = b.getAttribute("data-hromozom");
          var i = stanje.hrom.indexOf(n);
          if (i > -1) stanje.hrom.splice(i, 1); else stanje.hrom.push(n);
          stanje.hromNe = false;
          osvezi(false);
        });
      });
      if (neZnam) neZnam.addEventListener("click", function () {
        stanje.hromNe = !stanje.hromNe;
        stanje.hrom = [];
        osvezi(false);
      });

      // Preporuka: "Izaberite …" i druga opcija biraju paket i vode do njega
      vp("izaberi").addEventListener("click", function () { if (stanje.preporuka) izaberiPaket(stanje.preporuka.m, true); });
      vp("druga-dugme").addEventListener("click", function () { if (stanje.preporuka) izaberiPaket(stanje.preporuka.a, true); });

      // Počnite ispočetka: brišu se odgovori i izbor paketa; fokus na prvo pitanje
      svi(vodic, "[data-vodic-ispocetka]").forEach(function (b) {
        b.addEventListener("click", function () {
          stanje = { odg: {}, hrom: [], hromNe: false, paket: null };
          osvezi(false);
          var prvi = vodic.querySelector("[data-vodic-odgovor]");
          if (prvi) prvi.focus();
        });
      });
      vodic.classList.add("je-pokrenut");
    }

    osvezi(false);
  }

  pokreniAlat();
  pokreniTestove();
})();
