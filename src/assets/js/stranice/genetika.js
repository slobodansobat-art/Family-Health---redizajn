/* =============================================================================
   STRANICA: OSTALE GENETSKE ANALIZE  (/genetika/)
   -----------------------------------------------------------------------------
   Animacija "nasleđivanje" u hero sekciji (canvas [data-nasledjivanje]):
   mama (lavanda) i tata (mint) imaju po par hromozoma. Parovi razmene krajeve
   (crossing-over), svaki roditelj pošalje kopiju jednog hromozoma i od njih
   nastaje par bebe. Zlatna traka je nasledna varijanta (nosilac); beba je
   nasleđuje najviše od jednog roditelja, pa je i sama samo nosilac ili je nema.
   Jedan ciklus traje 11,2 s; kombinacije se smenjuju po ciklusu (KOMB).
   - Bez pokreta (prefers-reduced-motion): jedan miran kadar (trenutak 7,6 s).
   - Pauza kad platno nije u vidnom polju ili je kartica skrivena.
   - Prati promenu veličine (ResizeObserver) i gustinu piksela (devicePixelRatio).
   Natpisi (MAMA, TATA, BEBA) su u JSON-u stranice (hero.crtez), na platnu
   kao data-mama / data-tata / data-beba.
   ========================================================================== */
(function () {
  "use strict";

  var ZLATO = [226, 178, 90];
  // boje: [svetla, srednja, tamna, traka]
  var BOJE = {
    m0: [[241, 234, 250], [201, 179, 230], [150, 118, 196], [125, 92, 176]],
    m1: [[228, 214, 245], [160, 128, 206], [110, 74, 166], [92, 58, 148]],
    t0: [[226, 247, 242], [150, 214, 200], [72, 160, 142], [52, 132, 116]],
    t1: [[205, 238, 231], [98, 182, 164], [40, 124, 108], [30, 104, 90]]
  };
  // trake: [položaj od vrha 0..1, debljina]
  var TRAKE = [[0.1, 0.035], [0.22, 0.05], [0.3, 0.025], [0.5, 0.045], [0.58, 0.03], [0.68, 0.05], [0.8, 0.03], [0.9, 0.04]];
  var CEN = 0.38, KRAJ = 0.72;           // centromera i početak kraja koji se razmenjuje
  // kombinacije po ciklusu: koji hromozom šalje mama, koji tata (zlatna je kod m1 i t0;
  // dve zlatne zajedno se ne prikazuju)
  var KOMB = [[1, 1], [0, 0], [0, 1]];
  var CIKLUS = 11.2;                     // sekundi
  var MIRAN_KADAR = 7.6;                 // trenutak koji se crta bez pokreta
  var DUZINA = 0.33;                     // dužina hromozoma prema visini platna
  var NATPIS_BOJA = "#7A6A93";

  function lerp(a, b, s) { return a + (b - a) * s; }
  function mix(c1, c2, s) { return [Math.round(lerp(c1[0], c2[0], s)), Math.round(lerp(c1[1], c2[1], s)), Math.round(lerp(c1[2], c2[2], s))]; }
  function rgb(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (a == null ? 1 : a) + ")"; }
  function glatko(s) { s = Math.max(0, Math.min(1, s)); return s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2; }
  // glatki prelaz 0 -> 1 između trenutaka a i b
  function deo(t, a, b) { return glatko((t - a) / (b - a)); }

  // Obris hromozoma: gornji krak, suženje (centromera), donji krak
  function oblik(L, w) {
    var y0 = -L / 2, yc = y0 + L * CEN, y1 = L / 2, r = w / 2, n = w * 0.3;
    var p = new Path2D();
    p.moveTo(-r, y0 + r);
    p.arc(0, y0 + r, r, Math.PI, 0);
    p.lineTo(r, yc - w * 0.35);
    p.quadraticCurveTo(n * 0.55, yc, r, yc + w * 0.35);
    p.lineTo(r, y1 - r);
    p.arc(0, y1 - r, r, 0, Math.PI);
    p.lineTo(-r, yc + w * 0.35);
    p.quadraticCurveTo(-n * 0.55, yc, -r, yc - w * 0.35);
    p.closePath();
    return p;
  }

  function pokreniNasledjivanje(cv) {
    var ctx = cv.getContext("2d");
    if (!ctx || !window.Path2D) return;
    var natpisi = { mama: cv.dataset.mama || "", tata: cv.dataset.tata || "", beba: cv.dataset.beba || "" };
    var font = getComputedStyle(cv).fontFamily;
    var mobilni = window.FH && FH.mobilni ? FH.mobilni : window.matchMedia("(max-width: 959px)");
    var dpr = 1, W = 0, H = 0;

    function fit() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
    }

    function hromozom(x, y, ug, L, w, boja, kraj, krajMix, zlatna, sjaj, alfa) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ug); ctx.globalAlpha = alfa;
      var p = oblik(L, w);
      // senka
      ctx.save(); ctx.translate(w * 0.12, w * 0.16); ctx.fillStyle = "rgba(80,50,120,0.10)"; ctx.fill(p); ctx.restore();
      ctx.save(); ctx.clip(p);
      function telo(c, y0, y1) {
        var g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, rgb(c[2])); g.addColorStop(0.32, rgb(c[1])); g.addColorStop(0.5, rgb(mix(c[1], c[0], 0.55))); g.addColorStop(0.75, rgb(c[1])); g.addColorStop(1, rgb(c[2]));
        ctx.fillStyle = g; ctx.fillRect(-w, y0, w * 2, y1 - y0);
      }
      var yk = -L / 2 + L * KRAJ;
      telo(boja, -L / 2 - 2, yk + 0.5);
      // kraj koji se razmenjuje: meša sopstvenu boju sa bojom para
      var kb = [mix(boja[0], kraj[0], krajMix), mix(boja[1], kraj[1], krajMix), mix(boja[2], kraj[2], krajMix), mix(boja[3], kraj[3], krajMix)];
      telo(kb, yk, L / 2 + 2);
      for (var i = 0; i < TRAKE.length; i++) {
        var ty = -L / 2 + L * TRAKE[i][0], th = L * TRAKE[i][1];
        var tb = TRAKE[i][0] >= KRAJ ? kb[3] : boja[3];
        ctx.fillStyle = rgb(tb, 0.42); ctx.fillRect(-w, ty - th / 2, w * 2, th);
      }
      // zlatna traka: nasledna varijanta
      if (zlatna) {
        var zy = -L / 2 + L * 0.16, zh = L * 0.09;
        var zg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        zg.addColorStop(0, rgb([196, 140, 52])); zg.addColorStop(0.5, rgb([248, 214, 140])); zg.addColorStop(1, rgb([196, 140, 52]));
        ctx.fillStyle = zg; ctx.fillRect(-w, zy - zh / 2, w * 2, zh);
      }
      // odsjaj duž hromozoma
      var hg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      hg.addColorStop(0, "rgba(255,255,255,0)"); hg.addColorStop(0.36, "rgba(255,255,255,0.38)"); hg.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = hg; ctx.fillRect(-w, -L, w * 2, L * 2);
      ctx.restore();
      ctx.strokeStyle = rgb(boja[2], 0.55); ctx.lineWidth = 1; ctx.stroke(p);
      // sjaj oko zlatne trake (pulsira)
      if (zlatna && sjaj > 0) {
        var gy = -L / 2 + L * 0.16;
        var gg = ctx.createRadialGradient(0, gy, 0, 0, gy, w * 2);
        gg.addColorStop(0, rgb(ZLATO, 0.6 * sjaj)); gg.addColorStop(1, rgb(ZLATO, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, gy, w * 2, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }

    function natpis(tekst, x, y, a) {
      if (a <= 0 || !tekst) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = "600 " + (mobilni.matches ? 10 : 11) + "px " + font;
      if ("letterSpacing" in ctx) ctx.letterSpacing = "1.6px";
      ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = NATPIS_BOJA;
      ctx.fillText(tekst, x, y); ctx.restore();
    }

    // Jedan kadar u trenutku T (sekunde od početka animacije)
    function kadar(T) {
      var n = Math.floor(T / CIKLUS), t = T - n * CIKLUS, kmb = KOMB[n % KOMB.length], prvi = n === 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var L = Math.min(H * DUZINA, W * 0.25), w = L * 0.19, raz = w * 0.95;
      var M = { x: W * 0.2, y: H * 0.3 }, Tt = { x: W * 0.8, y: H * 0.3 }, B = { x: W * 0.5, y: H * 0.69 };
      var pojava = prvi ? deo(t, 0, 1) : 1;
      // crossing-over: približe se, ukrste se donjim krakom, razmene krajeve, razdvoje
      var priblizi = deo(t, 1.0, 1.9) * (1 - deo(t, 2.6, 3.4));
      var zamena = deo(t, 1.8, 2.5) * (1 - deo(t, 9.8, 11.0));
      var sjajKontakt = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 1.7) / 0.9))));

      function par(c, kljuc0, kljuc1, zl0, zl1, posalje) {
        // homolozi se nagnu tako da im se donji krakovi ukrste (hijazma), gornji ostaju razdvojeni
        var d = lerp(raz, w * 0.5, priblizi), nag = Math.asin(Math.min(0.9, (w * 0.5) / (L * (KRAJ - 0.5) + 1))) * priblizi;
        var bob = Math.sin(T * 0.8 + c.x * 0.01) * 2;
        var sl = [
          { x: c.x - d, ug: -nag, b: BOJE[kljuc0], k: BOJE[kljuc1], z: zl0 },
          { x: c.x + d, ug: nag, b: BOJE[kljuc1], k: BOJE[kljuc0], z: zl1 }
        ];
        for (var i = 0; i < 2; i++) {
          var izabran = i === posalje;
          var sj = sl[i].z ? 0.55 + 0.45 * Math.sin(T * 1.6) : 0;
          // hromozom koji ne ide bebi malo izbledi
          hromozom(sl[i].x, c.y + bob, sl[i].ug, L, w, sl[i].b, sl[i].k, zamena, sl[i].z, sj, pojava * (izabran ? 1 : lerp(1, 0.72, deo(t, 3.4, 4.2) * (1 - deo(t, 9.8, 11)))));
        }
        // bljesak na mestu ukrštanja
        if (sjajKontakt > 0) {
          var ky = c.y + bob + L * (KRAJ - 0.5);
          var kg = ctx.createRadialGradient(c.x, ky, 0, c.x, ky, w * 1.5);
          kg.addColorStop(0, "rgba(255,255,255," + (0.9 * sjajKontakt).toFixed(3) + ")"); kg.addColorStop(0.35, rgb(ZLATO, 0.35 * sjajKontakt)); kg.addColorStop(1, rgb(ZLATO, 0));
          ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(c.x, ky, w * 1.5, 0, 6.283); ctx.fill();
        }
        return sl;
      }

      var ms = par(M, "m0", "m1", false, true, kmb[0]);
      var ts = par(Tt, "t0", "t1", true, false, kmb[1]);
      natpis(natpisi.mama, M.x, M.y + L / 2 + 14, pojava);
      natpis(natpisi.tata, Tt.x, Tt.y + L / 2 + 14, pojava);

      // kopije putuju ka bebi po blagom luku
      var put = deo(t, 3.5, 5.7), formira = deo(t, 5.5, 6.6), nestaje = deo(t, 9.6, 10.8);
      var cilj0 = { x: B.x - raz * 0.9, y: B.y }, cilj1 = { x: B.x + raz * 0.9, y: B.y };
      var krajevi = [[ms, kmb[0], cilj0, "m"], [ts, kmb[1], cilj1, "t"]];
      if (t > 3.5 && nestaje < 1) {
        // trag puta
        for (var q = 0; q < 2; q++) {
          var s0 = krajevi[q][0][krajevi[q][1]], c0 = krajevi[q][2];
          var kx = (s0.x + c0.x) / 2;
          var tragA = 0.28 * Math.min(1, (t - 3.5) / 0.6) * (1 - formira);
          if (tragA > 0) {
            ctx.save(); ctx.setLineDash([2, 6]); ctx.lineCap = "round"; ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(122,106,147," + tragA.toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(s0.x, M.y + L * 0.1); ctx.quadraticCurveTo(kx, B.y - L * 0.1, c0.x, c0.y - L * 0.1); ctx.stroke(); ctx.restore();
          }
        }
        // oreol bebe
        var halo = formira * (1 - nestaje);
        if (halo > 0) {
          var pul = 0.85 + 0.15 * Math.sin(T * 1.4);
          var hg = ctx.createRadialGradient(B.x, B.y, L * 0.1, B.x, B.y, L * 0.95);
          hg.addColorStop(0, "rgba(255,255,255," + (0.85 * halo * pul).toFixed(3) + ")"); hg.addColorStop(0.55, "rgba(232,222,246," + (0.6 * halo * pul).toFixed(3) + ")"); hg.addColorStop(1, "rgba(232,222,246,0)");
          ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(B.x, B.y, L * 0.95, 0, 6.283); ctx.fill();
        }
        for (var k = 0; k < 2; k++) {
          var izv = krajevi[k][0][krajevi[k][1]], ci = krajevi[k][2];
          var px = (izv.x + ci.x) / 2, py = B.y - L * 0.25;
          var x = (1 - put) * (1 - put) * izv.x + 2 * (1 - put) * put * px + put * put * ci.x;
          var y = (1 - put) * (1 - put) * (krajevi[k][3] === "m" ? M.y : Tt.y) + 2 * (1 - put) * put * py + put * put * ci.y;
          var ug = lerp(izv.ug, 0, put) + Math.sin(put * Math.PI) * (k ? 0.25 : -0.25);
          var a = Math.min(1, (t - 3.5) / 0.4) * (1 - nestaje);
          var bob2 = Math.sin(T * 0.8 + 1.3) * 2 * formira;
          var sj = izv.z ? 0.55 + 0.45 * Math.sin(T * 1.6) : 0;
          hromozom(x, y + bob2, ug, L, w, izv.b, izv.k, zamena, izv.z, sj, a);
          // kad beba dobije zlatnu traku, oko nje se dva puta raširi zlatni krug, da se primeti
          if (izv.z) {
            for (var tal = 0; tal < 2; tal++) {
              var tp = (t - 6.2 - tal * 1.1) / 1.4;
              if (tp > 0 && tp < 1) {
                var zyb = y + bob2 - L / 2 + L * 0.16;
                ctx.strokeStyle = rgb(ZLATO, (0.75 * (1 - tp)).toFixed(3)); ctx.lineWidth = 2 * (1 - tp) + 0.6;
                ctx.beginPath(); ctx.arc(x, zyb, w * (0.7 + 2.4 * tp), 0, 6.283); ctx.stroke();
              }
            }
          }
        }
        natpis(natpisi.beba, B.x, B.y + L / 2 + 14, formira * (1 - nestaje));
      }
    }

    /* --- Pokretanje, pauza i nastavak ------------------------------------- */
    var mirno = window.matchMedia("(prefers-reduced-motion: reduce)");
    var vreme = 0;          // sekunde animacije (teče samo dok se animacija vidi)
    var prosli = 0;         // vreme prethodnog kadra (performance.now)
    var raf = 0;
    var uVidu = !("IntersectionObserver" in window);

    function korak(sada) {
      if (prosli) vreme += Math.min(0.1, (sada - prosli) / 1000);   // bez skoka posle zastoja
      prosli = sada;
      kadar(vreme);
      raf = requestAnimationFrame(korak);
    }
    function zaustavi() { cancelAnimationFrame(raf); raf = 0; prosli = 0; }
    function azuriraj() {
      if (mirno.matches) { zaustavi(); kadar(MIRAN_KADAR); return; }
      if (uVidu && !document.hidden) { if (!raf) raf = requestAnimationFrame(korak); }
      else zaustavi();
    }

    fit();
    if (window.ResizeObserver) {
      new ResizeObserver(function () { fit(); if (raf) kadar(vreme); else kadar(mirno.matches ? MIRAN_KADAR : vreme); }).observe(cv);
    }
    if (!uVidu) {
      new IntersectionObserver(function (stavke) {
        uVidu = stavke[stavke.length - 1].isIntersecting;
        azuriraj();
      }).observe(cv);
    }
    document.addEventListener("visibilitychange", azuriraj);
    if (mirno.addEventListener) mirno.addEventListener("change", azuriraj);
    // natpisi se crtaju fontom stranice: posle učitavanja fonta nacrtaj miran kadar ponovo
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!raf) kadar(mirno.matches ? MIRAN_KADAR : vreme); });
    kadar(mirno.matches ? MIRAN_KADAR : 0);
    azuriraj();
  }

  document.querySelectorAll("[data-nasledjivanje]").forEach(pokreniNasledjivanje);
})();
