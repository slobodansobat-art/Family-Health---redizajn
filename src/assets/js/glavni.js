/* =============================================================================
   GLAVNI JAVASCRIPT (učitava se na svim stranicama)
   -----------------------------------------------------------------------------
   Svaka funkcija pokreće jednu komponentu, samo ako je ima na stranici:
     pokreniPadajuceMenije()  padajući meni u zaglavlju (miš, klik, tastatura)
     pokreniMobilniMeni()     meni preko celog ekrana na telefonu
     pokreniKorake()          "stepper" (desktop) / harmonika (mobilni)
     pokreniTabove()          tabovi sa strelicama na tastaturi i #adresom
     pokreniFajlPolja()       ime izabranog fajla u formama
   Skripte pojedinačnih stranica su u src/assets/js/stranice/.
   ========================================================================== */
(function () {
  "use strict";

  var MOBILNI = window.matchMedia("(max-width: 959px)");

  /* --- Padajući meni ------------------------------------------------------- */
  function pokreniPadajuceMenije() {
    document.querySelectorAll("[data-padajuci]").forEach(function (meni) {
      var dugme = meni.querySelector(".padajuci__dugme");
      var tajmer;
      function otvori() { clearTimeout(tajmer); meni.classList.add("je-otvoren"); dugme.setAttribute("aria-expanded", "true"); }
      function zatvori() { meni.classList.remove("je-otvoren"); dugme.setAttribute("aria-expanded", "false"); }

      meni.addEventListener("mouseenter", function () { if (!MOBILNI.matches) otvori(); });
      meni.addEventListener("mouseleave", function () { tajmer = setTimeout(zatvori, 120); });
      dugme.addEventListener("click", function () { meni.classList.contains("je-otvoren") ? zatvori() : otvori(); });
      meni.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && meni.classList.contains("je-otvoren")) { zatvori(); dugme.focus(); }
      });
      meni.addEventListener("focusout", function (e) { if (!meni.contains(e.relatedTarget)) zatvori(); });
      document.addEventListener("click", function (e) { if (!meni.contains(e.target)) zatvori(); });
    });
  }

  /* --- Mobilni meni -------------------------------------------------------- */
  function pokreniMobilniMeni() {
    var meni = document.getElementById("mobilni-meni");
    if (!meni) return;
    var otvarac = null;
    function otvori(dugme) {
      otvarac = dugme;
      meni.hidden = false;
      document.documentElement.classList.add("meni-otvoren");
      document.body.classList.add("meni-otvoren");
      document.querySelectorAll("[data-otvori-meni]").forEach(function (d) { d.setAttribute("aria-expanded", "true"); });
      var zatvori = meni.querySelector("[data-zatvori-meni]");
      if (zatvori) zatvori.focus();
    }
    function zatvori() {
      meni.hidden = true;
      document.documentElement.classList.remove("meni-otvoren");
      document.body.classList.remove("meni-otvoren");
      document.querySelectorAll("[data-otvori-meni]").forEach(function (d) { d.setAttribute("aria-expanded", "false"); });
      if (otvarac) otvarac.focus();
    }
    document.querySelectorAll("[data-otvori-meni]").forEach(function (d) {
      d.addEventListener("click", function () { otvori(d); });
    });
    meni.querySelectorAll("[data-zatvori-meni]").forEach(function (d) { d.addEventListener("click", zatvori); });
    meni.addEventListener("keydown", function (e) {
      if (e.key === "Escape") zatvori();
      if (e.key === "Tab") {           // fokus ostaje unutar menija
        var f = meni.querySelectorAll("a[href], button");
        var prvi = f[0], poslednji = f[f.length - 1];
        if (e.shiftKey && document.activeElement === prvi) { e.preventDefault(); poslednji.focus(); }
        else if (!e.shiftKey && document.activeElement === poslednji) { e.preventDefault(); prvi.focus(); }
      }
    });
    // Klik na sidro (#kontakt) na istoj stranici zatvara meni
    meni.querySelectorAll('a[href*="#"]').forEach(function (a) { a.addEventListener("click", zatvori); });
    MOBILNI.addEventListener("change", function (e) { if (!e.matches && !meni.hidden) zatvori(); });
  }

  /* --- Koraci (stepper) ---------------------------------------------------- */
  function pokreniKorake() {
    document.querySelectorAll("[data-koraci]").forEach(function (koraci) {
      var stavke = Array.prototype.slice.call(koraci.querySelectorAll(".koraci__stavka"));
      var dugmad = stavke.map(function (s) { return s.querySelector(".koraci__dugme"); });
      var paneli = dugmad.map(function (d) { return document.getElementById(d.getAttribute("aria-controls")); });
      var kontejnerPanela = koraci.querySelector(".koraci__paneli");
      var aktivan = 0;

      // Desktop: jedan aktivan korak, opis desno
      function izaberi(i, fokus) {
        aktivan = Math.max(0, Math.min(i, stavke.length - 1));
        koraci.style.setProperty("--aktivan", aktivan);
        stavke.forEach(function (s, j) {
          s.classList.toggle("je-aktivan", j === aktivan);
          s.classList.toggle("je-zavrsen", j < aktivan);
          dugmad[j].setAttribute("aria-expanded", j === aktivan ? "true" : "false");
          if (j === aktivan) dugmad[j].setAttribute("aria-current", "step"); else dugmad[j].removeAttribute("aria-current");
          paneli[j].hidden = j !== aktivan;
        });
        if (fokus) dugmad[aktivan].focus();
      }

      // Mobilni: harmonika, svaki korak se otvara/zatvara posebno
      function prebaciNaMobilni() {
        stavke.forEach(function (s, j) {
          s.appendChild(paneli[j]);
          var otvoren = j === 0;
          s.classList.toggle("je-otvoren", otvoren);
          s.classList.remove("je-aktivan", "je-zavrsen");
          dugmad[j].setAttribute("aria-expanded", otvoren ? "true" : "false");
          dugmad[j].removeAttribute("aria-current");
          paneli[j].hidden = !otvoren;
        });
      }
      function prebaciNaDesktop() {
        paneli.forEach(function (p) { kontejnerPanela.appendChild(p); });
        stavke.forEach(function (s) { s.classList.remove("je-otvoren"); });
        izaberi(aktivan);
      }

      dugmad.forEach(function (d, j) {
        d.addEventListener("click", function () {
          if (MOBILNI.matches) {
            var otvoren = !stavke[j].classList.contains("je-otvoren");
            stavke[j].classList.toggle("je-otvoren", otvoren);
            d.setAttribute("aria-expanded", otvoren ? "true" : "false");
            paneli[j].hidden = !otvoren;
          } else {
            izaberi(j);
          }
        });
        d.addEventListener("keydown", function (e) {
          if (MOBILNI.matches) return;
          if (e.key === "ArrowDown") { e.preventDefault(); izaberi(j + 1, true); }
          if (e.key === "ArrowUp") { e.preventDefault(); izaberi(j - 1, true); }
        });
      });
      koraci.querySelectorAll("[data-koraci-dalje]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (!MOBILNI.matches) { izaberi(aktivan + 1); return; }
          // Mobilni: zatvori trenutni korak i otvori sledeći
          var j = stavke.indexOf(b.closest(".koraci__stavka"));
          if (j < 0 || j + 1 >= stavke.length) return;
          [[j, false], [j + 1, true]].forEach(function (p) {
            stavke[p[0]].classList.toggle("je-otvoren", p[1]);
            dugmad[p[0]].setAttribute("aria-expanded", p[1] ? "true" : "false");
            paneli[p[0]].hidden = !p[1];
          });
          dugmad[j + 1].focus({ preventScroll: true });
          if (stavke[j + 1].getBoundingClientRect().top < 0) stavke[j + 1].scrollIntoView({ block: "start" });
        });
      });

      function primeni() { MOBILNI.matches ? prebaciNaMobilni() : prebaciNaDesktop(); }
      MOBILNI.addEventListener("change", primeni);
      primeni();
    });
  }

  /* --- Polje za fajl: prikazuje ime izabranog fajla ----------------------- */
  function pokreniFajlPolja() {
    document.querySelectorAll("[data-fajl]").forEach(function (f) {
      var unos = f.querySelector("input[type=file]");
      var ime = f.querySelector("[data-fajl-ime]");
      var prazno = ime.textContent;
      unos.addEventListener("change", function () {
        ime.textContent = unos.files.length ? Array.prototype.map.call(unos.files, function (x) { return x.name; }).join(", ") : prazno;
      });
    });
  }

  /* --- Tabovi --------------------------------------------------------------
     Oznake: <div data-tabovi> <div role="tablist"> <button role="tab"
     aria-controls="id-panela" aria-selected="true|false"> ... </div>
     <div role="tabpanel" id="id-panela"> ... </div> </div>
     Ako adresa ima #id-taba ili #id-panela, otvara se taj tab.
     ------------------------------------------------------------------------ */
  function pokreniTabove() {
    document.querySelectorAll("[data-tabovi]").forEach(function (grupa) {
      var tabovi = Array.prototype.slice.call(grupa.querySelectorAll('[role="tab"]'));
      if (!tabovi.length) return;
      function izaberi(tab, fokus) {
        tabovi.forEach(function (t) {
          var izabran = t === tab;
          t.setAttribute("aria-selected", izabran ? "true" : "false");
          t.tabIndex = izabran ? 0 : -1;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !izabran;
        });
        if (fokus) tab.focus();
        grupa.dispatchEvent(new CustomEvent("tab-izabran", { detail: { tab: tab } }));
      }
      tabovi.forEach(function (t, i) {
        t.addEventListener("click", function () { izaberi(t); });
        t.addEventListener("keydown", function (e) {
          var n = tabovi.length, novi = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") novi = tabovi[(i + 1) % n];
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") novi = tabovi[(i - 1 + n) % n];
          if (e.key === "Home") novi = tabovi[0];
          if (e.key === "End") novi = tabovi[n - 1];
          if (novi) { e.preventDefault(); izaberi(novi, true); }
        });
      });
      var hes = decodeURIComponent((location.hash || "").slice(1));
      var izHesa = hes && tabovi.filter(function (t) { return t.id === hes || t.getAttribute("aria-controls") === hes; })[0];
      var podrazumevani = izHesa || tabovi.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabovi[0];
      izaberi(podrazumevani);
    });
  }

  /* --- Onko mreža: ponovo pokreni animaciju kad se sekcija pojavi --------- */
  function pokreniMreze() {
    if (!("IntersectionObserver" in window)) return;
    var mreze = document.querySelectorAll("[data-mreza-ponovo]");
    if (!mreze.length) return;
    var vidjena = new WeakSet();
    var posmatrac = new IntersectionObserver(function (unosi) {
      unosi.forEach(function (u) {
        if (!u.isIntersecting) return;
        if (!vidjena.has(u.target)) { vidjena.add(u.target); return; }
        u.target.classList.add("ponovo");
        void u.target.offsetWidth; // prisilno osvežavanje da bi animacija krenula ispočetka
        u.target.classList.remove("ponovo");
      });
    }, { threshold: 0.3 });
    mreze.forEach(function (m) { posmatrac.observe(m); });
  }

  function pokreni() {
    pokreniPadajuceMenije();
    pokreniMobilniMeni();
    pokreniKorake();
    pokreniTabove();
    pokreniFajlPolja();
    pokreniMreze();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pokreni);
  else pokreni();

  // Zajedničke pomoćne funkcije za skripte stranica
  window.FH = {
    mobilni: MOBILNI,
    evra: function (iznos) {
      var z = Math.round(Number(iznos) * 100) / 100;
      var d = z.toFixed(2).split(".");
      var ceo = d[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return (d[1] === "00" ? ceo : ceo + "," + d[1]) + " €";
    },
    // Padež za "nedelja": 1 nedelja, 2-4 nedelje, 5+ nedelja (11-14 nedelja)
    nedelja: function (n) {
      var m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return "nedelja";
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "nedelje";
      return "nedelja";
    },
    podaci: function (id) {
      var el = document.getElementById(id);
      try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; }
    }
  };
})();
