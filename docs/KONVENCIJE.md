# Konvencije koda: kako je sajt organizovan

Ovaj dokument važi za svakoga ko menja kod (programer ili AI). Za urednike sadržaja dovoljan je CMS na `/admin/`.

## 1. Gde je šta

```
src/
  sadrzaj/                 SAV SADRŽAJ (ovo menja CMS)
    podesavanja.json       telefon, Viber, adresa, radno vreme, pravni red u futeru,
                           zajednički tekstovi ("tekstovi": dugmad, oznake koraka...)
    navigacija.json        meniji, padajući meniji, mobilni meni, futer
    stranice/<kljuc>.json  tekst svake stranice, po sekcijama
    analize/<slug>.json    onko analize (katalog + stranica po šablonu)
    blog/<slug>.md         članci bloga
  _data/                   učitava src/sadrzaj (ne menjati bez potrebe)
  _includes/
    layouts/osnova.njk     okvir svake stranice (head, zaglavlje, futer)
    partials/              zaglavlje, futer, mobilni meni, donja traka
    makroi/                komponente: logo, slika, koraci, česta pitanja, forme
    sekcije/<stranica>/    JEDAN FAJL PO SEKCIJI STRANICE  <-- ovde je HTML
    ilustracije/           SVG ilustracije (npr. za korake)
  stranice/<kljuc>.njk     stranica = front matter + redosled sekcija
  assets/
    css/01-tokeni.css      boje, fontovi, razmaci (CSS promenljive)
    css/02-osnova.css      reset, tipografija, dugmad, pomoćne klase
    css/komponente/*.css   zajedničke komponente
    css/stranice/<kljuc>.css  stil jedne stranice
    js/glavni.js           zajednički JS (meniji, koraci, tabovi)
    js/stranice/<kljuc>.js JS jedne stranice (kalkulatori, filteri...)
    slike/                 fotografije (dodaju se iz CMS-a)
  admin/                   Decap CMS: config.yml (fiksan), sr-latinica.js (prevod)
scripts/                   generator CMS konfiguracije, prevod CMS-a, onko mreža
```

## 2. Stranica = redosled sekcija

`src/stranice/harmony.njk`:

```njk
---
kljuc: harmony                       # -> src/sadrzaj/stranice/harmony.json
permalink: /trudnoca-i-beba/harmony/
zaglavlje:
  tema: mint                         # svetla | lavanda | mint | tamna | noc
  oblast: trudnoca                   # opsti | onko | trudnoca
  nazad: /trudnoca-i-beba/           # dugme "nazad" na mobilnom (opciono)
  linkovi: [...]                     # opciono: zamenjuje linkove oblasti
  dugme: { tekst: "...", link: "#kontakt" }   # opciono
donjaTraka: { tekst: "Zakažite vađenje krvi", link: "#kontakt" }   # ili false
skripte: ["stranice/harmony.js"]     # opciono
---
{% include "sekcije/harmony/hero.njk" %}
{% include "sekcije/harmony/poredjenje.njk" %}
...
```

Svaka sekcija je poseban fajl u `src/_includes/sekcije/<kljuc>/`. Na vrhu fajla stoji komentar: šta je sekcija, odakle čita sadržaj i gde joj je stil.

## 3. Sadržaj u JSON-u (to je ono što CMS uređuje)

`src/sadrzaj/stranice/<kljuc>.json`, ključevi po sekcijama, istim redom kao na stranici:

```json
{
  "_naziv": "Harmony",
  "seo": { "naslov": "…| Family Health", "opis": "do ~155 znakova" },
  "hero": { "nadnaslov": "…", "naslov": "…", "tekst": "…", "slika": "", "slikaOpis": "…" },
  "faq": { "naslov": "Česta pitanja", "pitanja": [{ "pitanje": "…", "odgovor": "…" }] }
}
```

U šablonu: `{% set d = stranice.harmony.hero %}` pa `{{ d.naslov }}`. Ime fajla sa crticom postaje camelCase: `cancer-neo.json` → `stranice.cancerNeo`.

Pravila (CMS ih koristi da izabere vrstu polja):
- **Svaki vidljiv tekst je u JSON-u**, ne u šablonu: naslovi, pasusi, dugmad, liste, cene, napomene, oznake tabela. U šablonu ostaju samo tehničke stvari (aria-label za ikonice i slično).
- Polje koje počinje sa `slika` ili se završava sa `Slika` je fotografija (putanja ili prazno). Uz svaku sliku ide polje `…Opis` (alt tekst, npr. `slikaOpis`, `slikaMapeOpis`; u CMS-u obično tekst polje). Prazna slika se prikazuje kao obojeno polje sa opisom (makro `slika`).
- Polje koje se završava sa `Mobilni` je kraći tekst za telefon (`tekstMobilni` uz `tekst`). U CMS-u stoji odmah posle osnovnog polja, sa oznakom „(telefon)". Prikaz: `<span class="samo-desktop">…</span><span class="samo-mobilni">…</span>`.
- Prazna lista (`[]`) je dozvoljena: stranica tada samo ne prikazuje stavke. Redosled ključeva u JSON-u nije bitan (CMS ga menja pri čuvanju).
- Polje koje se završava sa `Md` sadrži Markdown (podebljano `**x**`, link `[tekst](url)`). Prikaz: `{{ d.tekstMd | mdRed | safe }}` u jednom redu, `{{ d.tekstMd | md | safe }}` za više pasusa.
- Brojevi (cene) su brojevi, ne tekst: `"cena": 390`. Prikaz: `{{ 390 | evra }}` → `390 €`, `1980` → `1.980 €`.
- Linkovi su konačne adrese sajta (tabela u odeljku 7).
- Tekst u `[zagradama]` znači: firma treba da dostavi/potvrdi. Prenosi se tačno kako je u skici.
- Bez HTML-a u JSON-u.

## 4. CSS

- Bez inline `style` atributa. Izuzetak: CSS promenljive za podatke (npr. `style="--kasnjenje: 120ms"`).
- Boje, fontovi i razmaci isključivo preko promenljivih iz `01-tokeni.css` (`var(--ljubicasta-600)`, `var(--font-naslov)`, `var(--margina)`...). Nove promenljive stranice definišu se na korenskom elementu stranice.
- Klase stranice počinju prefiksom stranice (BEM): `.harmony-hero`, `.harmony-hero__naslov`, `.harmony-hero--uzano`. Prefiksi: `pocetna`, `onko`, `analize`, `analiza`, `neo`, `lekari`, `trudnoca`, `harmony`, `symphony`, `mc`, `genetika`, `onama`, `kontakt`, `privatnost`, `greska`, `blog`, `clanak`, `hvala`.
- Zajedničke klase (koriste se, ne menjaju se u stranici): `.kontejner`, `.sekcija`, `.naslov-xl/-l/-m/-s`, `.nadnaslov`, `.blag`, `.mali-tekst`, `.dugme` (+ `--belo`, `--obrub`, `--mint`, `--zlatno`, `--tamno`, `--puno`, `--malo`), `.okruglo-dugme`, `.cip`/`.cipovi`, `.oznaka`, `.oznaka-premium`, `.napomena`, `.slika` (+ `--krug`, `--zaobljena`), `.sr-only`, `.samo-desktop`, `.samo-mobilni`, `.tekst-md`, `.forma`, `.forma--bela`, `.polje`, `.unos`, `.saglasnost`, `.povrsina-tamna`, `.povrsina-svetla`.
- Okvir fokusa (tastatura) je `outline: 3px solid var(--fokus)`. Sekcija sa TAMNOM pozadinom mora da promeni boju okvira, inače se ne vidi: klasa `povrsina-tamna` na sekciji (`<section class="neo-proces povrsina-tamna">`) ili u CSS-u sekcije `--fokus: var(--fokus-na-tamnom);`. Bela kartica/forma unutar tamne sekcije: `povrsina-svetla` (`.forma--bela` to već radi). Zaglavlje (tamna/noc), futer, gornja traka i mobilni meni to već imaju.
- Granica za mobilni: **959px**. Desktop stil je osnovni, mobilni ide u `@media (max-width: 959px) { … }` na kraju fajla. Proveriti i širine između (tablet 768px, mali laptop 1024px): ništa ne sme da izlazi van ekrana.
- Animacije: poštovati `prefers-reduced-motion` (globalno već isključuje animacije, ali ne oslanjati se na animaciju za prikaz sadržaja: krajnje stanje mora biti vidljivo).

## 5. JavaScript

- Bez biblioteka. Fajl `src/assets/js/stranice/<kljuc>.js`, ceo u `(function () { "use strict"; … })();`.
- Pokreće se samo ako na stranici postoji odgovarajući element (`document.querySelector('[data-…]')`).
- Podaci za kalkulatore idu iz JSON-a stranice preko: `<script type="application/json" id="harmony-podaci">{{ stranice.harmony.paketi | uJson | safe }}</script>` i u JS `FH.podaci("harmony-podaci")`.
- Pomoćne funkcije: `FH.evra(390)`, `FH.nedelja(n)` (padež), `FH.mobilni.matches`.
- Bez hover-only ponašanja: sve što radi na prelaz mišem radi i na klik/fokus/dodir.
- Stranica mora da bude čitljiva i bez JS-a (npr. svi paneli vidljivi), a JS dodaje interakciju. Ne stavljati `hidden` u statički HTML za sadržaj koji JS prikazuje; neka ga JS sakrije. Layout postavlja klasu `js` na `<html>` pre CSS-a: pravila tipa `.js .x:not(.je-pokrenut) …` sprečavaju „skakanje" dok se JS ne pokrene.
- Padajući meni: prelaz otvara samo za pravi miš (`pointerType === "mouse"`); klik/dodir/tastatura rade preko dugmeta.

## 6. Komponente (makroi)

```njk
{% from "makroi/osnovni.njk" import slika, strelica, kvacica, plus, telefonIkonica %}
{% from "makroi/komponente.njk" import koraci, faq, forma, polje, izbor, tekstPolje, fajlPolje, saglasnost, posalji with context %}
```
(`with context` je obavezan za `komponente.njk`, jer forme čitaju `podesavanja`.)

- `slika(d.slika, d.slikaOpis, "slika--krug onko-hero__foto")`; hero slika (vidljiva odmah): `slika(d.slika, d.slikaOpis, "trudnoca-hero__foto", ucitavanje="eager")`
- Tekst koji ponavljaju partiali i makroi (Pozovite, Viber, „Korak {n} od {N}", Sledeći korak, Preskoči na sadržaj, Politika privatnosti, podrazumevano dugme donje trake) je u `podesavanja.tekstovi`.
- `koraci("harmony-koraci", d.koraci, "mint", { tekst: "Zakažite", link: "#kontakt" })`, stavke: `{ naslov, podnaslov, oznaka, glava, tekst | tekstMd, tekstMobilni, cinjenice[], ilustracija }` (`oznaka` = mala pilula uz podnaslov, klasa `.koraci__znak`); ilustracija je putanja u `src/_includes/ilustracije` bez `.njk` (npr. `"harmony/vadjenje"`).
- `faq("harmony-faq", d.pitanja, "mint")`, pitanja: `{ pitanje, odgovor }` (odgovor je Markdown).
- Tabovi: `<div data-tabovi><div role="tablist" aria-label="…"><button role="tab" id="t1" aria-controls="p1" aria-selected="true">…</button>…</div><div role="tabpanel" id="p1" aria-labelledby="t1">…</div>…</div>`. JS je već u glavni.js (strelice, #adresa).
- Forme (Netlify Forms, posle slanja ide na /hvala/):
  ```njk
  {% call forma("harmony-zakazivanje", "forma forma--bela") %}
    {{ polje("hm-ime", "ime", "Ime i prezime", autocomplete="name", obavezno=true) }}
    {{ polje("hm-tel", "telefon", "Telefon", tip="tel", autocomplete="tel", obavezno=true) }}
    {{ polje("hm-email", "email", "Email", tip="email", autocomplete="email", obavezno=true) }}
    {{ izbor("hm-tema", "tema", "Šta vas zanima", ["Harmony", "Symphony"]) }}
    {{ saglasnost("hm-ok") }}
    {{ posalji("Pošaljite, javljamo se istog radnog dana") }}
  {% endcall %}
  ```
  Ime forme je jedinstveno na celom sajtu: `<kljuc>-<svrha>`. SVAKA forma obavezno traži ime, telefon i email (`obavezno=true`). Forma sa prilozima: `forma("onko-nalaz", "forma", true)` + `fajlPolje(...)`.
- Onko animacija: `{% onkoMreza "seme", 1 %}` (SVG; omotaču dati `data-mreza-ponovo` ako treba da se ponovi kad se vrati u vidno polje).
- Kontakt podaci uvek iz `podesavanja.kontakt` (telefon, mobilni, email, adresa, radnoVreme), nikad prepisani u JSON stranice.

## 7. Adrese stranica

| Skica | Adresa |
|---|---|
| Main / Mobile | `/` |
| Onkogenetika | `/onkogenetika/` |
| OnkoAnalize | `/onkogenetika/analize/` (filter: `#cilj-ter`, `#cilj-bez`, `#cilj-pra`, `#cilj-nas`, `#cilj-imu`, `#cilj-tum`) |
| CancerPrecision | `/onkogenetika/analize/cancer-precision/` (šablon za sve analize) |
| CancerNeo | `/onkogenetika/cancer-neo/` |
| ZaLekare | `/za-lekare/` |
| Trudnoca | `/trudnoca-i-beba/` |
| Harmony | `/trudnoca-i-beba/harmony/` |
| Symphony | `/trudnoca-i-beba/symphony/` |
| MaticneCelije | `/maticne-celije/` |
| Genetika | `/genetika/` |
| ONama | `/o-nama/` |
| Blog | `/blog/` |
| BlogClanak | `/blog/kako-se-racuna-starost-trudnoce/` |
| Kontakt | `/kontakt/` (forma: `#forma`) |
| Hvala | `/hvala/` |
| Greska404 | `/404.html` |
| Privatnost | `/politika-privatnosti/` |

Situacije na onko stranici: `/onkogenetika/#situacija-1` … `#situacija-6`.

## 8. Pristupačnost i SEO (obavezno na svakoj stranici)

- Tačno jedan `<h1>`, naslovi redom (h2 pa h3), bez preskakanja.
- `seo.naslov` (do ~60 znakova, završava sa „| Family Health”) i `seo.opis` (do ~155 znakova).
- Svaka slika ima opis (alt). Dekorativni SVG: `aria-hidden="true" focusable="false"`.
- Dugmad za akcije su `<button>`, linkovi su `<a href>`. Ikonica bez teksta ima `aria-label`.
- Svako polje forme ima `<label>`.
- Kontrast teksta najmanje 4.5:1 (siva `--tekst-blag` na beloj je u redu).
- Sekcije: `<section aria-labelledby="id-naslova">`.

## 9. CMS (Decap)

- `src/admin/config.yml` je FIKSAN fajl u repou; ne pravi se pri izradi sajta. Kad programer doda polje u JSON ili novu stranicu: `npm run cms-konfiguracija` pa pregledati `git diff src/admin/config.yml`. Skripta čuva redosled i šemu iz postojećeg config.yml (prazne liste ne menjaju tip), redosled sekcija uzima iz include-ova stranice.
- Interfejs je na srpskoj latinici: `src/admin/sr-latinica.js` (`npm run cms-prevod`, iz `decap-cms-locales` iste verzije kao Decap u `src/admin/index.html`).
- Kategorije bloga su samo u `stranice/blog.json` → `lista.kategorije` (CMS ih nudi kao izbor). Članak sa `sakrij: true` ne ide u listu, srodne članke ni mapu sajta.
- Lokalno uređivanje bez GitHub-a: `npm run cms:lokalno` i `npm start`, pa `http://localhost:8080/admin/`.
