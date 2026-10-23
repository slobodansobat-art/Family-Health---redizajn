/* =============================================================================
   SVE ONKO ANALIZE: filteri kataloga (/onkogenetika/analize/)
   -----------------------------------------------------------------------------
   Sve kartice su već u HTML-u. Ovde se samo sakrivaju one koje ne odgovaraju:
     - cilju      (dugmad data-cilj; kartica ima data-ciljevi="ter pra")
     - uzorku     (dugmad data-uzorak; kartica ima data-tkivo / data-krv)
     - pretrazi   (naziv + opis, bez obzira na velika slova i kvačice)
   Adresa #cilj-ter (bez, pra, nas, imu, tum) unapred bira cilj.
   Adresa #<slug> (npr. #mrd-pracenje) skroluje do te analize.
   Na vrhu fajla: animirani DNK lanac u heroju (canvas).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
     DNK LANAC U HEROJU (<canvas data-analize-dnk>)
     Lavanda i ruža, sporo se okreće; pojedini parovi baza tiho zasvetle toplom
     bojom ("mutacija"). U pozadini lebde mutni krugovi i iskre povezane nitima.
     Lanac uvek staje ceo u svoj okvir, na svakoj širini (nikad nije odsečen).
     Animacija staje kad hero nije u vidnom polju ili je kartica skrivena.
     Uz "smanji pokrete" (prefers-reduced-motion) crta se jedan miran kadar.
     ------------------------------------------------------------------------ */
  // R: poluprečnik spirale, cx/cy: željeni centar (deo širine/visine okvira),
  // duzina: dužina lanca (deo visine), zavoja: broj zavoja, nagib: ugao (rad),
  // brzina: okretanje, korak: gustina kuglica, rb: veličina kuglice,
  // bokeh/iskre: broj čestica u pozadini, mut: redni brojevi "mutiranih" parova
  var DNK_DESKTOP = { R: 52, cx: 0.58, cy: 0.5, duzina: 1.25, zavoja: 3.6, nagib: 1.05, brzina: 0.28, korak: 3, rb: 4.8, bokeh: 14, iskre: 30, mut: [10, 27] };
  var DNK_MOBILNI = { R: 30, cx: 0.55, cy: 0.5, duzina: 1.0, zavoja: 2.8, nagib: 0.3, brzina: 0.28, korak: 2.4, rb: 3.2, bokeh: 6, iskre: 12, mut: [7, 19] };

  function pokreniDNK() {
    var platno = document.querySelector("[data-analize-dnk]");
    if (!platno || !platno.getContext) return;
    var ctx = platno.getContext("2d");
    if (!ctx) return;

    var mobilni = window.FH && window.FH.mobilni;
    var mirno = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = 1, W = 0, H = 0;
    var o = null, bokeh = [], iskre = [];
    var t = 1.5, prethodno = 0, raf = 0, uVidu = true;

    // Kuglica sa sjajem, nacrtana jednom na malom platnu (posle se samo kopira)
    function kugla(svetlo, sredina, senka, sjaj) {
      var s = 64, c = document.createElement("canvas");
      c.width = c.height = s * 2;
      var g = c.getContext("2d");
      var gr = g.createRadialGradient(s, s, s * 0.3, s, s, s);
      gr.addColorStop(0, sjaj); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, s * 2, s * 2);
      gr = g.createRadialGradient(s - s * 0.16, s - s * 0.16, s * 0.03, s, s, s * 0.42);
      gr.addColorStop(0, svetlo); gr.addColorStop(0.5, sredina); gr.addColorStop(1, senka);
      g.fillStyle = gr; g.beginPath(); g.arc(s, s, s * 0.42, 0, Math.PI * 2); g.fill();
      return c;
    }
    var K = {
      a: kugla("#FFFFFF", "#D6C8EA", "#6E4A99", "rgba(197,181,217,0.28)"),   // prvi lanac (lavanda)
      b: kugla("#FFF6F9", "#E6C2D3", "#7A3D63", "rgba(230,194,211,0.24)"),   // drugi lanac (ruža)
      pa: kugla("#F7F0FF", "#B790DD", "#4E2477", "rgba(162,123,201,0.20)"),  // baza, prva polovina
      pb: kugla("#FFF2F7", "#D6A1BC", "#6A2C52", "rgba(214,161,188,0.18)"),  // baza, druga polovina
      m: kugla("#FFFBEF", "#F0C877", "#9A6A1E", "rgba(240,200,119,0.50)")    // "mutacija" (toplo)
    };

    function rnd(a, b) { return a + Math.random() * (b - a); }

    // Opcije i čestice za trenutnu širinu (desktop ili telefon)
    function postaviOpcije() {
      o = mobilni && mobilni.matches ? DNK_MOBILNI : DNK_DESKTOP;
      bokeh = []; iskre = [];
      for (var i = 0; i < o.bokeh; i++) bokeh.push({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(4, 20), a: rnd(0.04, 0.11), v: rnd(3, 8), f: rnd(0, 6.28), roza: Math.random() < 0.4 });
      for (var j = 0; j < o.iskre; j++) iskre.push({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(0.6, 1.5), v: rnd(2, 6), f: rnd(0, 6.28), s: rnd(0.5, 1.4) });
    }

    // Veličina platna prema okviru i gustini piksela ekrana
    function prilagodi() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = platno.getBoundingClientRect();
      W = r.width; H = r.height;
      platno.width = Math.max(1, Math.round(W * dpr));
      platno.height = Math.max(1, Math.round(H * dpr));
    }

    // Jedan kadar u trenutku t (sekunde)
    function kadar() {
      if (W < 1 || H < 1) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Pozadina: mutni krugovi i iskre koje polako plove naviše
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < bokeh.length; i++) {
        var b = bokeh[i];
        var y = ((b.y * H - t * b.v) % (H + 60) + H + 60) % (H + 60) - 30;
        var x = b.x * W + Math.sin(t * 0.25 + b.f) * 10;
        var g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, b.roza ? "rgba(230,194,211," + b.a + ")" : "rgba(197,181,217," + b.a + ")");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.283); ctx.fill();
      }
      var pts = [];
      for (var k = 0; k < iskre.length; k++) {
        var p = iskre[k];
        var py = ((p.y * H - t * p.v) % (H + 20) + H + 20) % (H + 20) - 10;
        var px = p.x * W + Math.sin(t * 0.2 + p.f) * 6;
        var al = 0.2 + 0.45 * (0.5 + 0.5 * Math.sin(t * p.s + p.f));
        pts.push([px, py]);
        ctx.fillStyle = "rgba(255,255,255," + al.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, 6.283); ctx.fill();
      }
      // Tanke niti između bliskih iskri
      ctx.lineWidth = 0.6;
      for (var m = 0; m < pts.length; m++) for (var n = m + 1; n < pts.length; n++) {
        var dx = pts[m][0] - pts[n][0], dy = pts[m][1] - pts[n][1], d2 = dx * dx + dy * dy;
        if (d2 < 5600) {
          ctx.strokeStyle = "rgba(220,208,232," + (0.12 * (1 - d2 / 5600)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(pts[m][0], pts[m][1]); ctx.lineTo(pts[n][0], pts[n][1]); ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // Geometrija lanca: osa pod nagibom; dužina i centar se skraćuju/pomeraju
      // tako da ceo lanac (sa kuglicama) uvek stane u okvir
      var L = H * o.duzina, R = o.R, ugao = o.nagib;
      var dX = Math.sin(ugao), dY = Math.cos(ugao), nX = Math.cos(ugao), nY = -Math.sin(ugao);
      var ivica = R + o.rb * 2.5;
      L = Math.max(0, Math.min(L,
        (W - 2 * ivica - 8) / Math.max(Math.abs(dX), 0.05),
        (H - 2 * ivica - 8) / Math.max(Math.abs(dY), 0.05)));
      var P = H * o.duzina / o.zavoja; // korak zavoja ostaje isti i kad se lanac skrati
      var hx = Math.abs(dX) * L / 2 + ivica, hy = Math.abs(dY) * L / 2 + ivica;
      var cx = Math.min(Math.max(W * o.cx, hx), W - hx), cy = Math.min(Math.max(H * o.cy, hy), H - hy);
      var x0 = cx - dX * L / 2, y0 = cy - dY * L / 2;
      var w = t * o.brzina, zleb = 2.35;
      var puls = 0.7 + 0.3 * Math.sin(t * 1.4);
      var stvari = [];

      function tacka(s, faza) {
        var f = 2 * Math.PI * s / P + w + faza, lat = R * Math.cos(f), z = Math.sin(f);
        return { x: x0 + dX * s + nX * lat, y: y0 + dY * s + nY * lat, z: z };
      }
      function dubina(z) { return 0.62 + 0.38 * (z + 1) / 2; }

      // Dva lanca od kuglica
      for (var s = 0; s <= L; s += o.korak) {
        var A = tacka(s, 0), B = tacka(s, zleb);
        stvari.push({ z: A.z, k: K.a, x: A.x, y: A.y, r: o.rb * dubina(A.z), a: 0.3 + 0.7 * (A.z + 1) / 2 });
        stvari.push({ z: B.z, k: K.b, x: B.x, y: B.y, r: o.rb * dubina(B.z), a: 0.3 + 0.7 * (B.z + 1) / 2 });
      }
      // Parovi baza (prečke); "mutirani" parovi pulsiraju toplom bojom
      var korakBaza = P / 10.5, pi = 0;
      for (var s2 = korakBaza / 2; s2 < L; s2 += korakBaza, pi++) {
        var A2 = tacka(s2, 0), B2 = tacka(s2, zleb);
        var mut = o.mut.indexOf(pi) !== -1;
        for (var q = 1; q <= 6; q++) {
          var u = q / 7, z = A2.z + (B2.z - A2.z) * u;
          stvari.push({
            z: z - 0.05, k: mut ? K.m : (u < 0.5 ? K.pa : K.pb),
            x: A2.x + (B2.x - A2.x) * u, y: A2.y + (B2.y - A2.y) * u,
            r: o.rb * (mut ? 0.8 : 0.68) * dubina(z),
            a: (0.25 + 0.6 * (z + 1) / 2) * (mut ? 0.55 + 0.45 * puls : 1)
          });
        }
        stvari.push({ z: (A2.z + B2.z) / 2 - 0.1, linija: true, A: A2, B: B2, mut: mut });
      }

      // Crtanje od zadnjeg ka prednjem (dubina)
      stvari.sort(function (p1, p2) { return p1.z - p2.z; });
      for (var i2 = 0; i2 < stvari.length; i2++) {
        var e = stvari[i2];
        if (e.linija) {
          var gl = ctx.createLinearGradient(e.A.x, e.A.y, e.B.x, e.B.y);
          var aa = 0.2 + 0.42 * (e.z + 1) / 2;
          if (e.mut) {
            var am = aa * (0.6 + 0.5 * puls);
            gl.addColorStop(0, "rgba(240,200,119," + am + ")"); gl.addColorStop(0.5, "rgba(255,240,205," + am + ")"); gl.addColorStop(1, "rgba(240,200,119," + am + ")");
          } else {
            gl.addColorStop(0, "rgba(197,170,230," + aa + ")"); gl.addColorStop(0.5, "rgba(255,255,255," + aa * 0.55 + ")"); gl.addColorStop(1, "rgba(222,170,196," + aa + ")");
          }
          ctx.strokeStyle = gl; ctx.lineWidth = o.rb * 1.05 * dubina(e.z); ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(e.A.x, e.A.y); ctx.lineTo(e.B.x, e.B.y); ctx.stroke();
        } else {
          var vel = e.r / 0.42 * 2;
          ctx.globalAlpha = Math.min(1, e.a);
          ctx.drawImage(e.k, e.x - vel / 2, e.y - vel / 2, vel, vel);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Petlja animacije; vreme teče samo dok se animacija vidi (bez skokova)
    function petlja(sada) {
      if (prethodno) t += Math.min(sada - prethodno, 100) / 1000;
      prethodno = sada;
      kadar();
      raf = requestAnimationFrame(petlja);
    }
    function kreni() {
      if (mirno || raf || !uVidu || document.hidden) return;
      prethodno = 0;
      raf = requestAnimationFrame(petlja);
    }
    function stani() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    postaviOpcije();
    prilagodi();
    kadar();

    // Promena veličine okvira: novo platno i odmah jedan kadar (da ne trepne)
    if (window.ResizeObserver) {
      new ResizeObserver(function () { prilagodi(); kadar(); }).observe(platno);
    } else {
      window.addEventListener("resize", function () { prilagodi(); kadar(); });
    }
    // Prelaz desktop <-> telefon: druge mere lanca
    if (mobilni && mobilni.addEventListener) {
      mobilni.addEventListener("change", function () { postaviOpcije(); prilagodi(); kadar(); });
    }
    if (mirno) return;

    // Pauza van vidnog polja i kad je kartica pregledača skrivena
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (unosi) {
        uVidu = unosi[0].isIntersecting;
        if (uVidu) kreni(); else stani();
      }).observe(platno);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stani(); else kreni();
    });
    kreni();
  }
  pokreniDNK();

  /* ---------------------------------------------------------------------------
     FILTERI KATALOGA
     ------------------------------------------------------------------------ */
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
