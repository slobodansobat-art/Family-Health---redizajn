/* =============================================================================
   ZA LEKARE (/za-lekare/)
   -----------------------------------------------------------------------------
   Animacija u heru (crtajKrv, kao u skici): crvena krvna zrnca polako plove i
   okreću se, a među njima svetlucaju sitni delovi DNK (tečna biopsija).
   Crta se na <canvas data-lekari-krv> (src/_includes/sekcije/za-lekare/hero.njk).
   ========================================================================== */
(function () {
  "use strict";

  var platno = document.querySelector("[data-lekari-krv]");
  if (!platno) return;

  var smanjiPokrete = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobilni = (window.FH && FH.mobilni) || window.matchMedia("(max-width: 959px)");

  // Podešavanja iz skice: broj zrnaca, broj delova DNK, veličina, brzina, debljina DNK
  var OPCIJE_DESKTOP = { broj: 26, frag: 9, vel: 30, brzina: 1, skala: 1.2 };
  var OPCIJE_MOBILNI = { broj: 12, frag: 4, vel: 17, brzina: 0.7, skala: 0.9 };

  function slucajno(a, b) { return a + Math.random() * (b - a); }

  // Unapred nacrtano zrnce: disk sa svetlijim obodom i udubljenim središtem
  function zrnce(obod, sredina, dno, sjaj) {
    var s = 64, c = document.createElement("canvas");
    c.width = c.height = s * 2;
    var g = c.getContext("2d");
    var gr = g.createRadialGradient(s, s, s * 0.6, s, s, s);
    gr.addColorStop(0, sjaj); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s * 2, s * 2);
    gr = g.createRadialGradient(s, s, 0, s, s, s * 0.78);
    gr.addColorStop(0, dno); gr.addColorStop(0.42, sredina); gr.addColorStop(0.8, obod); gr.addColorStop(0.93, sredina); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(s, s, s * 0.78, 0, Math.PI * 2); g.fill();
    gr = g.createRadialGradient(s - s * 0.3, s - s * 0.34, 0, s - s * 0.3, s - s * 0.34, s * 0.36);
    gr.addColorStop(0, "rgba(255,235,242,0.32)"); gr.addColorStop(1, "rgba(255,235,242,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(s, s, s * 0.78, 0, Math.PI * 2); g.fill();
    return c;
  }
  var ZRNCA = null;   // pravi se pri prvom crtanju (dve boje: crvenkasto i ljubičasto)

  // Visina y (0..1) u okviru visine H, tako da predmet sa "poluprecnikom" pad ceo stane
  function uOkvir(y, od, doo, pad, H) {
    if (H <= 2 * pad) return H / 2;
    return pad + (y - od) / (doo - od) * (H - 2 * pad);
  }

  // Pravi crtež za data podešavanja; vraća funkciju crtaj(ctx, t, W, H)
  function napraviKrv(o) {
    if (!ZRNCA) ZRNCA = [zrnce("#D98AA8", "#A9567A", "#6E2C4C", "rgba(217,138,168,0.16)"), zrnce("#C995C9", "#8E5A97", "#55306A", "rgba(201,149,201,0.14)")];
    var cel = [], frag = [];
    for (var i = 0; i < o.broj; i++) {
      var d = Math.pow(Math.random(), 1.4);   // "dubina": bliža zrnca su veća, brža i jasnija
      cel.push({ x: slucajno(0, 1), y: slucajno(0.04, 0.96), d: d, r: o.vel * (0.45 + 0.75 * d), v: (6 + 16 * d) * o.brzina,
        ug: slucajno(0, 6.28), vu: slucajno(-0.12, 0.12), ob: slucajno(0, 6.28), vo: slucajno(0.15, 0.4), f: slucajno(0, 6.28), k: Math.random() < 0.72 ? 0 : 1 });
    }
    cel.sort(function (a, b) { return a.d - b.d; });
    for (var j = 0; j < o.frag; j++) {
      frag.push({ x: slucajno(0, 1), y: slucajno(0.08, 0.92), v: slucajno(8, 18) * o.brzina, ug: slucajno(0, 6.28), vu: slucajno(-0.3, 0.3),
        f: slucajno(0, 6.28), l: slucajno(10, 16) * o.skala, zl: Math.random() < 0.5 });
    }

    return function crtaj(ctx, t, W, H) {
      ctx.clearRect(0, 0, W, H);
      var span = W + 160;   // zrnca ulaze i izlaze 80px van okvira, pa se vraćaju sleva
      for (var i = 0; i < cel.length; i++) {
        var c = cel[i];
        var pad = c.r * 1.28 + 14 * c.d;   // zrnce sa sjajem i talasanjem gore-dole
        var x = ((c.x * span + t * c.v) % span) - 80;
        var y = uOkvir(c.y, 0.04, 0.96, pad, H) + Math.sin(t * 0.3 + c.f) * 14 * c.d;
        var nag = Math.abs(Math.cos(c.ob + t * c.vo)) * 0.82 + 0.18;   // okretanje: zrnce se vidi "iz profila"
        var vel = c.r * 2.56;
        ctx.save(); ctx.translate(x, y); ctx.rotate(c.ug + t * c.vu); ctx.scale(1, nag);
        ctx.globalAlpha = 0.22 + 0.6 * c.d;
        ctx.drawImage(ZRNCA[c.k], -vel / 2, -vel / 2, vel, vel);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      for (var k = 0; k < frag.length; k++) {
        // Deo DNK: dvostruka spirala sa sjajem, zlatna ili svetloljubičasta
        var p = frag[k];
        var fx = ((p.x * span + t * p.v) % span) - 80;
        var fy = uOkvir(p.y, 0.08, 0.92, p.l * 1.2 + 10, H) + Math.sin(t * 0.5 + p.f) * 10;
        var pul = 0.55 + 0.45 * Math.sin(t * 1.3 + p.f);
        var boja = p.zl ? "240,200,119" : "214,196,240";
        var g = ctx.createRadialGradient(fx, fy, 0, fx, fy, p.l * 1.2);
        g.addColorStop(0, "rgba(" + boja + "," + (0.22 * pul).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + boja + ",0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, p.l * 1.2, 0, 6.283); ctx.fill();
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(p.ug + t * p.vu);
        ctx.lineWidth = 1.1 * o.skala; ctx.lineCap = "round";
        for (var st = 0; st < 2; st++) {
          ctx.strokeStyle = "rgba(" + boja + "," + (0.5 + 0.45 * pul).toFixed(3) + ")";
          ctx.beginPath();
          for (var u = 0; u <= 12; u++) {
            var sx = -p.l / 2 + p.l * u / 12, sy = Math.sin(u / 12 * 6.283 * 1.5 + st * 3.14) * 2.2 * o.skala;
            if (u) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";
    };
  }

  /* --- Pokretanje: oštrina (devicePixelRatio), promena veličine, pauza van
         vidnog polja i u skrivenoj kartici, miran kadar uz smanjene pokrete --- */
  var ctx = platno.getContext && platno.getContext("2d");
  if (!ctx) return;
  var dpr = 1, W = 0, H = 0, crtaj = null;
  var raf = 0, t = 0, poslednje = 0, uVidu = true;
  var MIRAN_KADAR = 1.5;   // trenutak koji se prikazuje kad su pokreti isključeni (kao u skici)

  function opcije() { return mobilni.matches ? OPCIJE_MOBILNI : OPCIJE_DESKTOP; }
  function izmeri() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = platno.getBoundingClientRect();
    W = r.width; H = r.height;
    platno.width = Math.max(1, Math.round(W * dpr));
    platno.height = Math.max(1, Math.round(H * dpr));
  }
  function nacrtaj(vreme) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); crtaj(ctx, vreme, W, H); }
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
      if (smanjiPokrete.matches) nacrtaj(MIRAN_KADAR);
    }
  }

  izmeri();
  crtaj = napraviKrv(opcije());
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { izmeri(); nacrtaj(smanjiPokrete.matches ? MIRAN_KADAR : t); }).observe(platno);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (stavke) { uVidu = stavke[0].isIntersecting; osvezi(); }).observe(platno);
  }
  document.addEventListener("visibilitychange", osvezi);
  if (smanjiPokrete.addEventListener) smanjiPokrete.addEventListener("change", osvezi);
  if (mobilni.addEventListener) {
    // Telefon i desktop imaju različit broj i veličinu zrnaca
    mobilni.addEventListener("change", function () { crtaj = napraviKrv(opcije()); t = 0; nacrtaj(smanjiPokrete.matches ? MIRAN_KADAR : t); });
  }
  osvezi();
})();
