/* =============================================================================
   ONKO ANALIZA (šablon stranice, uzor: Cancer Precision)
   -----------------------------------------------------------------------------
   1. Tabovi "Za lekare" / "Za pacijente" rade preko glavni.js (data-tabovi).
      Ovde je samo dopuna: promena taba kada je traka sa tabovima prilepljena
      uz vrh vraća stranicu na početak izabranog panela.
   2. Animacija u heru (crtajNiz): poređenje genetskog zapisa zdravog tkiva i
      tumora na <canvas>; isključuje se poljem hero.animacija = false u analizi.
   Oznake: src/_includes/sekcije/analiza/
   ========================================================================== */
(function () {
  "use strict";

  var smanjiPokrete = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobilni = (window.FH && FH.mobilni) || window.matchMedia("(max-width: 959px)");

  /* --- 1. Povratak na početak panela posle promene taba ------------------- */
  function pokreniTabove() {
    var telo = document.querySelector(".analiza__telo[data-tabovi]");
    if (!telo) return;
    telo.addEventListener("tab-izabran", function () {
      var vrh = telo.getBoundingClientRect().top;
      if (vrh < 0) {
        window.scrollTo({ top: window.scrollY + vrh, behavior: smanjiPokrete.matches ? "auto" : "smooth" });
      }
    });
  }

  /* --- 2. Animacija u heru: poređenje zapisa (kao u skici) ---------------- */
  // Parovi redova slova (zdravo tkivo iznad, tumor ispod) polako klize; gde se
  // slova razlikuju (mutacija), slovo tumora zasvetli, a nišan se zaključa na njega.
  // Podešavanja iz skice: desktop i telefon.
  var OPCIJE_DESKTOP = { parova: 5, slovo: 17, brzina: 1 };
  var OPCIJE_MOBILNI = { parova: 4, slovo: 13, brzina: 0.8, od: 0.62 };
  var SLOVA = "ACGT", N = 72;   // azbuka i dužina jednog reda (red se ponavlja ukrug)

  function slucajno(a, b) { return a + Math.random() * (b - a); }

  // Pravi crtež za data podešavanja; vraća funkciju crtaj(ctx, t, W, H)
  function napraviNiz(o) {
    var parovi = [];
    for (var p = 0; p < o.parova; p++) {
      var d = p % 2 ? slucajno(0.25, 0.55) : slucajno(0.65, 1);   // "dubina": bliži redovi su veći i svetliji
      var zd = [], tu = [], mu = {};
      for (var i = 0; i < N; i++) zd.push(SLOVA[Math.floor(Math.random() * 4)]);
      for (var j = 0; j < N; j++) tu.push(zd[j]);
      var broj = 2 + Math.floor(Math.random() * 2);
      for (var m = 0; m < broj; m++) {
        var k = Math.floor(slucajno(2, N - 2));
        tu[k] = SLOVA[(SLOVA.indexOf(zd[k]) + 1 + Math.floor(Math.random() * 3)) % 4];
        mu[k] = true;
      }
      parovi.push({ zd: zd, tu: tu, mu: mu, d: d, v: o.brzina * (6 + 8 * d), f: slucajno(0, 1) });
    }
    var nisan = null, sledeci = 0.8;

    return function crtaj(ctx, t, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var red = H / (o.parova + 0.4), mete = [];
      // Ako je okvir nizak, slova se smanje toliko da i donji red (sa sjajem mutacije) stane u okvir
      var skala = 1;
      for (var r = 0; r < parovi.length; r++) {
        var v0 = o.slovo * (0.7 + 0.45 * parovi[r].d);
        skala = Math.min(skala, (H - red * (r + 0.7)) / (v0 * 2.85));
      }
      skala = Math.max(0.4, skala);
      for (var p = 0; p < parovi.length; p++) {
        var pr = parovi[p];
        var vel = o.slovo * skala * (0.7 + 0.45 * pr.d), korak = vel * 1.45, duz = N * korak;
        var y0 = red * (p + 0.7), razmak = vel * 1.35;
        var pom = (pr.f * duz + t * pr.v) % duz;
        ctx.font = "500 " + vel.toFixed(1) + "px 'IBM Plex Sans', system-ui, sans-serif";
        for (var i = 0; i < N; i++) {
          var x = ((i * korak - pom) % duz + duz) % duz - korak;
          if (x < -korak || x > W + korak) continue;
          var a = 0.09 + 0.25 * pr.d;
          if (pr.mu[i]) {
            // Mutacija: zlatna linija između slova, sjaj i zlatno slovo tumora
            var sj = 0.65 + 0.35 * Math.sin(t * 1.5 + i);
            ctx.strokeStyle = "rgba(240,200,119," + (0.35 * sj).toFixed(3) + ")"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, y0 + vel * 0.55); ctx.lineTo(x, y0 + razmak - vel * 0.55); ctx.stroke();
            var g = ctx.createRadialGradient(x, y0 + razmak, 0, x, y0 + razmak, vel * 1.4);
            g.addColorStop(0, "rgba(240,200,119," + (0.32 * sj * pr.d).toFixed(3) + ")"); g.addColorStop(1, "rgba(240,200,119,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y0 + razmak, vel * 1.4, 0, 6.283); ctx.fill();
            ctx.fillStyle = "rgba(220,208,232," + Math.min(1, a + 0.15).toFixed(3) + ")"; ctx.fillText(pr.zd[i], x, y0);
            ctx.fillStyle = "rgba(246,214,148," + Math.min(1, 0.55 + 0.45 * pr.d).toFixed(3) + ")"; ctx.fillText(pr.tu[i], x, y0 + razmak);
            if (pr.d > 0.55) mete.push({ p: p, i: i, x: x, y: y0 + razmak, vel: vel });
          } else {
            ctx.fillStyle = "rgba(197,181,217," + a.toFixed(3) + ")"; ctx.fillText(pr.zd[i], x, y0);
            ctx.fillStyle = "rgba(222,178,202," + a.toFixed(3) + ")"; ctx.fillText(pr.tu[i], x, y0 + razmak);
          }
        }
      }
      // Nišan: bira mutaciju u sredini okvira, zaključa se na nju, pa prelazi na sledeću
      if (nisan) {
        var cilj = null;
        for (var c = 0; c < mete.length; c++) if (mete[c].p === nisan.p && mete[c].i === nisan.i) cilj = mete[c];
        if (!cilj || t - nisan.t > 3.4 || cilj.x < W * 0.08) nisan = null;
        else {
          var s = Math.min(1, (t - nisan.t) / 0.9), e = 1 - Math.pow(1 - s, 3);
          var izlaz = Math.max(0, (t - nisan.t - 2.8) / 0.6);
          var rr = cilj.vel * (2.6 - 1.4 * e), al = (0.25 + 0.6 * e) * (1 - izlaz);
          ctx.strokeStyle = "rgba(255,236,196," + al.toFixed(3) + ")"; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(cilj.x, cilj.y, rr, 0, 6.283); ctx.stroke();
          ctx.beginPath();
          for (var q = 0; q < 4; q++) {
            var u = q * Math.PI / 2;
            ctx.moveTo(cilj.x + Math.cos(u) * (rr + 3), cilj.y + Math.sin(u) * (rr + 3));
            ctx.lineTo(cilj.x + Math.cos(u) * (rr + 9), cilj.y + Math.sin(u) * (rr + 9));
          }
          ctx.stroke();
        }
      }
      if (!nisan && t > sledeci) {
        // Kandidati: mete u sredini okvira, čiji ceo nišan (i najveći, na početku) staje u okvir
        var kand = mete.filter(function (m) {
          var R = m.vel * 2.6 + 10;
          return m.x > W * (o.od || 0.3) && m.x < W * 0.86 && m.x + R < W && m.y - R > 0 && m.y + R < H;
        });
        if (kand.length) {
          var iz = kand[Math.floor(Math.random() * kand.length)];
          nisan = { p: iz.p, i: iz.i, t: t }; sledeci = t + 4.2;
        }
      }
    };
  }

  // Pokreće crtež na <canvas>: oštrina (devicePixelRatio), promena veličine,
  // pauza van vidnog polja i u skrivenoj kartici, miran kadar uz smanjene pokrete.
  function pokreniPlatno(platno, napravi, opcije, mirniKadrovi) {
    var ctx = platno.getContext && platno.getContext("2d");
    if (!ctx) return;
    var dpr = 1, W = 0, H = 0, crtaj = null;
    var raf = 0, t = 0, poslednje = 0, uVidu = true;

    function izmeri() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = platno.getBoundingClientRect();
      W = r.width; H = r.height;
      platno.width = Math.max(1, Math.round(W * dpr));
      platno.height = Math.max(1, Math.round(H * dpr));
    }
    function nacrtaj(vreme) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); crtaj(ctx, vreme, W, H); }
    function mirnaSlika() {
      // Miran kadar kao u skici (više poziva da se npr. nišan zaključa)
      crtaj = napravi(opcije());
      mirniKadrovi.forEach(nacrtaj);
    }
    function radi() { return !smanjiPokrete.matches && uVidu && !document.hidden; }
    function kadar(sad) {
      raf = 0;
      t += Math.min(0.1, Math.max(0, (sad - poslednje) / 1000));   // posle pauze nema skoka
      poslednje = sad;
      nacrtaj(t);
      if (radi()) raf = requestAnimationFrame(kadar);
    }
    function osvezi() {
      if (radi()) {
        if (!raf) { poslednje = performance.now(); raf = requestAnimationFrame(kadar); }
      } else {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (smanjiPokrete.matches) mirnaSlika();
      }
    }
    function iznova() { crtaj = napravi(opcije()); t = 0; if (!radi()) osvezi(); else nacrtaj(t); }

    izmeri();
    crtaj = napravi(opcije());
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { izmeri(); if (smanjiPokrete.matches) mirnaSlika(); else nacrtaj(t); }).observe(platno);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (stavke) { uVidu = stavke[0].isIntersecting; osvezi(); }).observe(platno);
    }
    document.addEventListener("visibilitychange", osvezi);
    if (smanjiPokrete.addEventListener) smanjiPokrete.addEventListener("change", osvezi);
    if (mobilni.addEventListener) mobilni.addEventListener("change", iznova);   // druga podešavanja za telefon
    osvezi();
  }

  function pokreniNiz() {
    var platno = document.querySelector("[data-analiza-niz]");
    if (!platno) return;
    pokreniPlatno(platno, napraviNiz, function () {
      return mobilni.matches ? OPCIJE_MOBILNI : OPCIJE_DESKTOP;
    }, [1, 2.6]);
  }

  pokreniTabove();
  pokreniNiz();
})();
