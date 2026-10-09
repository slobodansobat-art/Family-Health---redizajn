// =============================================================================
// Animirana "mreža" za onkogenetiku (zaglavlja onko stranica i početna).
// Tačke izleću iz centra, slažu se u krug, pa se iscrtavaju niti ka centru.
// Pozicije se računaju iz "semena", pa je slika ista pri svakoj izradi.
// Stil i animacija: src/assets/css/komponente/onko-mreza.css
// =============================================================================

function prng(seme) {
  let h = 1779033703 ^ seme.length;
  for (let i = 0; i < seme.length; i++) {
    h = Math.imul(h ^ seme.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const BOJE = [
  ["#C5B5D9", 0.55], ["#C5B5D9", 1], ["#E9E0F2", 0.55], ["#E9E0F2", 1], ["#FFFFFF", 1],
  ["#C5B5D9", 0.7], ["#E9E0F2", 0.7], ["#A27BC9", 1], ["#FFFFFF", 0.85], ["#A27BC9", 0.7],
];
const VELICINE = [2, 2, 2.5, 3, 3, 3, 4, 4, 5, 6, 6, 7, 9];

export function onkoMreza(seme = "fh", brzina = 1) {
  const r = prng(String(seme));
  const C = 260;
  const tacke = [];
  for (let i = 0; i < 58; i++) {
    const ugao = Math.round(r() * 360 - 180);
    const poluprecnik = Math.round(66 + r() * 168);
    const [boja, prozirnost] = BOJE[Math.floor(r() * BOJE.length)];
    const velicina = VELICINE[Math.floor(r() * VELICINE.length)];
    const trajanje = ((2.1 + (poluprecnik / 234) * 1.0 + r() * 0.3) * brzina).toFixed(2);
    const kasnjenje = (r() * 0.6).toFixed(2);
    const okret = (r() < 0.5 ? -1 : 1) * (360 + Math.round(r() * 4) * 120);
    tacke.push({ ugao, poluprecnik, boja, prozirnost, velicina, trajanje, kasnjenje, okret });
  }

  const niti = tacke
    .filter((_, i) => i % 4 !== 3)
    .map((t) => {
      const rad = (t.ugao * Math.PI) / 180;
      const x = Math.round(C + Math.cos(rad) * t.poluprecnik);
      const y = Math.round(C + Math.sin(rad) * t.poluprecnik);
      return `<line class="onko-mreza__nit" x1="${C}" y1="${C}" x2="${x}" y2="${y}" style="--l:${t.poluprecnik};--trajanje:${t.trajanje}s;--kasnjenje:${t.kasnjenje}s"></line>`;
    })
    .join("");

  const kugle = tacke
    .map(
      (t) =>
        `<g class="onko-mreza__tacka" style="--ugao:${t.ugao}deg;--r:${t.poluprecnik}px;--okret:${t.okret}deg;--trajanje:${t.trajanje}s;--kasnjenje:${t.kasnjenje}s"><circle cx="${C}" cy="${C}" r="${t.velicina}" fill="${t.boja}"${t.prozirnost < 1 ? ` fill-opacity="${t.prozirnost}"` : ""}></circle></g>`
    )
    .join("");

  return `<svg class="onko-mreza" viewBox="0 0 520 520" aria-hidden="true" focusable="false"><g class="onko-mreza__rotacija"><g class="onko-mreza__animacija"><g stroke="#FFFFFF" stroke-opacity="0.13" stroke-width="1">${niti}</g>${kugle}<g class="onko-mreza__centar"><circle cx="${C}" cy="${C}" r="11" fill="#FFFFFF"></circle><circle cx="${C}" cy="${C}" r="20" fill="none" stroke="#FFFFFF" stroke-opacity="0.25"></circle></g><g class="onko-mreza__prsten-omotac"><circle class="onko-mreza__prsten" cx="411" cy="125" r="15" fill="none" stroke="#C5B5D9" stroke-width="2"></circle></g></g></g></svg>`;
}
