/* =============================================================================
   ZDRAVO MAMA (škola za trudnice): raspored po današnjem datumu posetioca
   -----------------------------------------------------------------------------
   HTML je napravljen za dan izrade sajta. Ova skripta isto računa za DANAŠNJI
   dan (ista pravila kao front matter u src/stranice/zdravo-mama.njk):
     - oznake termina: Održano / Danas / Sledeće / Uskoro (klasa zm-termin--…)
     - kartica "Sledeće predavanje" u heroju
     - izabrani mesec u rasporedu (tab sa sledećim terminom)
     - skriveno polje "ciklus" u formi + isti tekst iznad dugmeta:
       uvek SLEDEĆI kalendarski mesec (u decembru: januar sledeće godine)
   Podaci: <script id="zdravo-mama-podaci"> (stranice.zdravoMama u JSON-u).
   ========================================================================== */
(function () {
  "use strict";

  var podaci = window.FH && FH.podaci("zdravo-mama-podaci");
  if (!podaci || !document.querySelector("[data-zm-sled]")) return;

  var r = podaci.raspored;
  var lista = podaci.predavaci || [];

  // Današnji datum posetioca kao "gggg-mm-dd"
  var d0 = new Date();
  var danas = d0.getFullYear() + "-" + dva(d0.getMonth() + 1) + "-" + dva(d0.getDate());
  function dva(n) { return (n < 10 ? "0" : "") + n; }

  // Predavač po ključu ili imenu (velika/mala slova nisu bitna)
  function predavac(x) {
    var k = String(x || "").trim().toLowerCase();
    for (var i = 0; i < lista.length; i++) {
      if (String(lista[i].kljuc).toLowerCase() === k || String(lista[i].ime).toLowerCase() === k) return lista[i];
    }
    return { ime: String(x || "").trim(), zvanje: "", tema: "" };
  }
  // "2026-10-08" -> "Četvrtak, 8. oktobar"
  function nazivDana(iso) {
    var p = iso.split("-").map(Number);
    return r.daniUNedelji[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()] + ", " + p[2] + ". " + r.meseci[p[1] - 1];
  }

  // Ciklusi sa terminima poređanim po datumu
  var ciklusi = (r.ciklusi || []).map(function (c) {
    var termini = (c.termini || []).filter(function (t) { return t.datum; }).slice();
    termini.sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0; });
    return { naziv: c.naziv, termini: termini };
  });

  // Sledeći termin: prvi koji nije prošao (danas se računa)
  var sviDatumi = [];
  ciklusi.forEach(function (c) { c.termini.forEach(function (t) { sviDatumi.push(t.datum); }); });
  sviDatumi.sort();
  var sledeci = sviDatumi.filter(function (iso) { return iso >= danas; })[0] || null;

  function stanje(iso) {
    return iso === danas ? "danas" : iso < danas ? "odrzano" : iso === sledeci ? "sledece" : "uskoro";
  }

  /* --- Oznake na karticama termina ---------------------------------------- */
  document.querySelectorAll("[data-zm-termin]").forEach(function (li) {
    var s = stanje(li.getAttribute("data-zm-termin"));
    ["odrzano", "danas", "sledece", "uskoro"].forEach(function (x) { li.classList.toggle("zm-termin--" + x, x === s); });
    var oznaka = li.querySelector("[data-zm-oznaka]");
    if (oznaka) oznaka.textContent = r.oznake[s];
  });

  /* --- Kartica "Sledeće predavanje" --------------------------------------- */
  (function () {
    var h = podaci.sledece;
    var oznaka = h.nemaOznaka, dan = h.nemaDan, vreme = h.nemaVreme, predavaci = [];
    if (sledeci) {
      oznaka = sledeci === danas ? h.oznakaDanas : h.oznaka;
      dan = nazivDana(sledeci);
      vreme = h.vreme;
      ciklusi.forEach(function (c) {
        c.termini.forEach(function (t) { if (t.datum === sledeci) predavaci = (t.predavaci || []).map(predavac); });
      });
    }
    document.querySelector("[data-zm-sled-oznaka]").textContent = oznaka;
    document.querySelector("[data-zm-sled-dan]").textContent = dan;
    document.querySelector("[data-zm-sled-vreme]").textContent = vreme;
    var ul = document.querySelector("[data-zm-sled-lista]");
    ul.textContent = "";
    predavaci.forEach(function (p) {
      var li = document.createElement("li");
      var tema = document.createElement("span");
      tema.className = "zm-sled__tema";
      tema.textContent = p.tema || "";
      var ime = document.createElement("span");
      ime.className = "zm-sled__ime";
      ime.textContent = p.ime;
      if (p.zvanje) {
        var zvanje = document.createElement("span");
        zvanje.className = "zm-sled__zvanje";
        zvanje.textContent = ", " + p.zvanje;
        ime.appendChild(zvanje);
      }
      li.appendChild(tema);
      li.appendChild(ime);
      ul.appendChild(li);
    });
  })();

  /* --- Izabrani mesec u rasporedu ----------------------------------------- */
  (function () {
    var izabran = -1;
    ciklusi.forEach(function (c, i) {
      if (izabran < 0 && c.termini.some(function (t) { return t.datum === sledeci; })) izabran = i;
    });
    if (izabran < 0) izabran = Math.max(0, ciklusi.length - 1);
    // Adresa sa #zm-mesec-N ili #zm-ciklus-N ima prednost (glavni.js je već izabrao taj tab)
    var hes = decodeURIComponent((location.hash || "").slice(1));
    if (/^zm-(mesec|ciklus)-\d+$/.test(hes)) return;
    var tab = document.getElementById("zm-mesec-" + (izabran + 1));
    if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
  })();

  /* --- Ciklus za prijavu (skriveno polje + tekst iznad dugmeta) ------------ */
  (function () {
    var g = d0.getFullYear(), m = d0.getMonth() + 1;
    var sg = m === 12 ? g + 1 : g, sm = m === 12 ? 1 : m + 1;
    var mesec = sg + "-" + dva(sm);
    var cik = ciklusi.filter(function (c) { return c.termini.length && c.termini[0].datum.slice(0, 7) === mesec; })[0];
    var ime = r.meseci[sm - 1];
    var tekst = cik
      ? cik.naziv + " (" + cik.termini.map(function (t) { return Number(t.datum.slice(8)) + "."; }).join(", ") + ")"
      : ime.charAt(0).toUpperCase() + ime.slice(1) + " " + sg + " " + podaci.ciklusUskoro;
    document.querySelectorAll("[data-zm-ciklus-polje]").forEach(function (polje) { polje.value = tekst; });
    document.querySelectorAll("[data-zm-ciklus]").forEach(function (el) { el.textContent = tekst; });
  })();
})();
