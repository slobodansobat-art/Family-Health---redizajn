/* =============================================================================
   Decap CMS: interfejs na srpskoj latinici (jezik "sr_Latn").
   Napravljeno skriptom scripts/sr-latinica.js iz decap-cms-locales@3.8.2 (sr_Cyrl).
   Ne menjati ručno: izmene idu u skriptu (POPRAVKE, PO_KLJUCU, DODATO).
   Učitava se u src/admin/index.html posle decap-cms.js; config.yml: locale: "sr_Latn".
   ============================================================================= */
CMS.registerLocale("sr_Latn", {
  "auth": {
    "login": "Prijava",
    "loggingIn": "Prijavljivanje...",
    "loginWithNetlifyIdentity": "Prijavite se preko Netlify Identity",
    "loginWithAzure": "Prijavite se preko Azure",
    "loginWithBitbucket": "Prijavite se preko Bitbucket",
    "loginWithGitHub": "Prijavite se preko GitHub",
    "loginWithGitLab": "Prijavite se preko GitLab",
    "loginWithGitea": "Prijavite se preko Gitea",
    "loginWithForgejo": "Prijavite se preko Forgejo",
    "errors": {
      "email": "Unesite svoju e-poštu.",
      "password": "Molimo unesite lozinku.",
      "identitySettings": "Nije moguće pristupiti podešavanjima identiteta. Kada koristite git-gateway backend, obavezno omogućite Identity service i Git Gateway."
    }
  },
  "app": {
    "header": {
      "content": "Sadržaj",
      "workflow": "Tok rada",
      "media": "Slike i fajlovi",
      "quickAdd": "Brzo dodavanje"
    },
    "app": {
      "errorHeader": "Greška pri učitavanju CMS konfiguracije",
      "configErrors": "Greška u konfiguraciji",
      "checkConfigYml": "Proverite fajl config.yml.",
      "loadingConfig": "Učitavanje konfiguracije...",
      "waitingBackend": "Čekanje na backend..."
    },
    "notFoundPage": {
      "header": "Stranica nije pronađena"
    }
  },
  "collection": {
    "sidebar": {
      "collections": "Sadržaj sajta",
      "allCollections": "Sav sadržaj",
      "searchAll": "Pretraži sve",
      "searchIn": "Pretraži u"
    },
    "collectionTop": {
      "sortBy": "Sortiraj po",
      "viewAs": "Pogledaj kao",
      "viewAsList": "Prikaz kao lista",
      "viewAsGrid": "Prikaz kao mreža",
      "newButton": "＋ %{collectionLabel}",
      "newButtonAriaLabel": "Napravi novi unos: %{collectionLabel}",
      "ascending": "Rastuće",
      "descending": "Opadajuće",
      "searchResults": "Rezultati pretrage za \"%{searchTerm}\"",
      "searchResultsInCollection": "Rezultati pretrage za \"%{searchTerm}\" u %{collection}",
      "filterBy": "Filtriraj po",
      "groupBy": "Grupiši po"
    },
    "entries": {
      "loadingEntries": "Učitavanje unosa...",
      "cachingEntries": "Keširanje unosa...",
      "longerLoading": "Ovo može potrajati nekoliko minuta",
      "noEntries": "Nema unosa",
      "unpublishedHeader": "Neobjavljeni unosi"
    },
    "groups": {
      "other": "Ostalo",
      "negateLabel": "Nije %{label}"
    },
    "defaultFields": {
      "author": {
        "label": "Autor"
      },
      "updatedOn": {
        "label": "Ažurirano"
      }
    }
  },
  "editor": {
    "editorControl": {
      "field": {
        "optional": "opciono",
        "widgetLabel": "%{widgetLabel} polje"
      }
    },
    "editorControlPane": {
      "widget": {
        "required": "%{fieldLabel} je obavezno.",
        "regexPattern": "%{fieldLabel} se ne podudara sa uzorkom: %{pattern}.",
        "processing": "%{fieldLabel} se obrađuje.",
        "range": "%{fieldLabel} mora biti između %{minValue} i %{maxValue}.",
        "min": "%{fieldLabel} mora biti najmanje %{minValue}.",
        "max": "%{fieldLabel} mora biti %{maxValue} ili manje.",
        "rangeCount": "%{fieldLabel} mora imati između %{minCount} i %{maxCount} stavki.",
        "rangeCountExact": "%{fieldLabel} mora imati tačno %{count} stavki.",
        "rangeMin": "%{fieldLabel} mora imati najmanje %{minCount} stavku/e.",
        "rangeMax": "%{fieldLabel} mora imati %{maxCount} ili manje stavki.",
        "invalidPath": "'%{path}' nije validna putanja",
        "pathExists": "Putanja '%{path}' već postoji"
      },
      "i18n": {
        "writingInLocale": "Pisanje na %{locale}",
        "copyFromLocale": "Popuni iz drugog jezika",
        "copyFromLocaleConfirm": "Da li želite da popunite podatke iz %{locale} lokala?\nSav postojeći sadržaj će biti prepisan."
      }
    },
    "editor": {
      "onLeavePage": "Da li ste sigurni da želite da napustite ovu stranicu?",
      "onUpdatingWithUnsavedChanges": "Imate nesačuvane izmene, molimo sačuvajte pre ažuriranja statusa.",
      "onPublishingNotReady": "Molimo ažurirajte status na „Spremno“ pre objavljivanja.",
      "onPublishingWithUnsavedChanges": "Imate nesačuvane izmene, molimo sačuvajte pre objavljivanja.",
      "onPublishing": "Da li ste sigurni da želite da objavite ovaj unos?",
      "onUnpublishing": "Da li ste sigurni da želite da uklonite ovaj unos iz objava?",
      "onDeleteWithUnsavedChanges": "Da li ste sigurni da želite da izbrišete ovaj objavljeni unos, kao i nesačuvane izmene iz trenutne sesije?",
      "onDeletePublishedEntry": "Da li ste sigurni da želite da izbrišete ovaj objavljeni unos?",
      "onDeleteUnpublishedChangesWithUnsavedChanges": "Ovo će izbrisati sve neobjavljene izmene na ovom unosu, kao i nesačuvane izmene iz trenutne sesije. Da li i dalje želite da izbrišete?",
      "onDeleteUnpublishedChanges": "Sve neobjavljene izmene na ovom unosu će biti izbrisane. Da li i dalje želite da izbrišete?",
      "loadingEntry": "Učitavanje unosa...",
      "confirmLoadBackup": "Pronađena je lokalna rezervna kopija za ovaj unos, da li želite da je koristite?"
    },
    "editorInterface": {
      "toggleI18n": "Uključi/isključi i18n",
      "togglePreview": "Uključi/isključi pregled",
      "toggleScrollSync": "Sinhronizacija skrolovanja",
      "toggleNotes": "Prikaži/sakrij beleške"
    },
    "editorNotesPane": {
      "title": "Beleške",
      "emptyState": "Još nema beležaka. Dodajte prvu belešku ispod.",
      "addNote": "Dodaj belešku",
      "addPlaceholder": "Dodajte belešku...",
      "editPlaceholder": "Izmenite belešku...",
      "save": "Sačuvaj",
      "cancel": "Otkaži",
      "edit": "Izmeni",
      "delete": "Obriši",
      "resolve": "Označi kao rešeno",
      "unresolve": "Vrati kao nerešeno",
      "confirmDelete": "Da li ste sigurni da želite da obrišete ovu belešku?",
      "shortcut": "Savet: Ctrl+Enter brzo dodaje belešku"
    },
    "editorToolbar": {
      "publishing": "Objavljivanje...",
      "publish": "Objavi",
      "published": "Objavljeno",
      "unpublish": "Ukloni iz objava",
      "duplicate": "Dupliraj",
      "unpublishing": "Uklanjanje iz objava...",
      "publishAndCreateNew": "Objavi i napravi novi",
      "publishAndDuplicate": "Objavi i dupliraj",
      "deleteUnpublishedChanges": "Izbriši neobjavljene izmene",
      "deleteUnpublishedEntry": "Izbriši neobjavljeni unos",
      "deletePublishedEntry": "Izbriši objavljeni unos",
      "deleteEntry": "Izbriši unos",
      "saving": "Čuvanje...",
      "save": "Sačuvaj",
      "statusInfoTooltipDraft": "Status unosa je postavljen na nacrt. Da biste ga finalizovali i poslali na pregled, postavite status na „Na pregledu“",
      "statusInfoTooltipInReview": "Unos je na pregledu, nisu potrebne dalje radnje. Međutim, i dalje možete da napravite dodatne izmene dok je na pregledu.",
      "deleting": "Brisanje...",
      "updating": "Ažuriranje...",
      "status": "Status: %{status}",
      "backCollection": "Uređujete: %{collectionLabel}",
      "unsavedChanges": "Nesačuvane izmene",
      "changesSaved": "Izmene sačuvane",
      "draft": "Nacrt",
      "inReview": "Na pregledu",
      "ready": "Spremno",
      "publishNow": "Objavi odmah",
      "deployPreviewPendingButtonLabel": "Proveri za pregled",
      "deployPreviewButtonLabel": "Pogledaj pregled",
      "deployButtonLabel": "Pogledaj na sajtu"
    },
    "editorWidgets": {
      "markdown": {
        "bold": "Podebljano",
        "italic": "Kurziv",
        "strikethrough": "Precrtano",
        "code": "Kod",
        "link": "Link",
        "linkPrompt": "Unesite adresu linka",
        "headings": "Naslovi",
        "quote": "Citat",
        "bulletedList": "Lista sa tačkama",
        "numberedList": "Numerisana lista",
        "addComponent": "Dodaj komponentu",
        "richText": "Formatiran tekst",
        "markdown": "Markdown",
        "toggleMode": {
          "rich": "Prebaci na formatiran tekst",
          "markdown": "Prebaci na Markdown režim"
        }
      },
      "image": {
        "choose": "Izaberi sliku",
        "chooseMultiple": "Izaberi slike",
        "chooseUrl": "Unesi adresu (URL)",
        "replaceUrl": "Zameni adresom (URL)",
        "promptUrl": "Unesite adresu (URL) slike",
        "chooseDifferent": "Izaberi drugu sliku",
        "addMore": "Dodaj još slika",
        "remove": "Ukloni sliku",
        "removeAll": "Ukloni sve slike"
      },
      "file": {
        "choose": "Izaberi fajl",
        "chooseUrl": "Unesi adresu (URL)",
        "chooseMultiple": "Izaberi fajlove",
        "replaceUrl": "Zameni adresom (URL)",
        "promptUrl": "Unesite adresu (URL) fajla",
        "chooseDifferent": "Izaberi drugi fajl",
        "addMore": "Dodaj još fajlova",
        "remove": "Ukloni fajl",
        "removeAll": "Ukloni sve fajlove"
      },
      "unknownControl": {
        "noControl": "Kontrola nije pronađena za vidžet '%{widget}'."
      },
      "unknownPreview": {
        "noPreview": "Prikaz nije pronađen za vidžet '%{widget}'."
      },
      "headingOptions": {
        "headingOne": "Naslov 1",
        "headingTwo": "Naslov 2",
        "headingThree": "Naslov 3",
        "headingFour": "Naslov 4",
        "headingFive": "Naslov 5",
        "headingSix": "Naslov 6"
      },
      "datetime": {
        "now": "Sada",
        "clear": "Obriši",
        "setToNow": "Postavi %{fieldLabel} na sada"
      },
      "list": {
        "add": "Dodaj %{item}",
        "addType": "Dodaj %{item}"
      },
      "object": {
        "expand": "Otvori",
        "collapse": "Zatvori"
      }
    }
  },
  "mediaLibrary": {
    "mediaLibraryCard": {
      "draft": "Nacrt",
      "copy": "Kopiraj",
      "copyUrl": "Kopiraj URL",
      "copyPath": "Kopiraj putanju",
      "copyName": "Kopiraj naziv",
      "copied": "Kopirano"
    },
    "mediaLibrary": {
      "onDelete": "Da li ste sigurni da želite da izbrišete izabrane fajlove?",
      "fileTooLarge": "Fajl je prevelik.\nNajveća dozvoljena veličina je %{size} kB."
    },
    "mediaLibraryModal": {
      "loading": "Učitavanje...",
      "close": "Zatvori",
      "noResults": "Nema rezultata.",
      "noAssetsFound": "Nema fajlova.",
      "noImagesFound": "Slike nisu pronađene.",
      "private": "Privatno ",
      "images": "Slike",
      "mediaAssets": "Slike i fajlovi",
      "search": "Pretraži...",
      "uploading": "Otpremanje...",
      "upload": "Otpremi",
      "download": "Preuzmi",
      "deleting": "Brisanje...",
      "deleteSelected": "Izbriši označeno",
      "chooseSelected": "Izaberi označeno"
    }
  },
  "ui": {
    "default": {
      "goBackToSite": "Nazad na sajt"
    },
    "errorBoundary": {
      "title": "Greška",
      "details": "Došlo je do greške - molimo ",
      "reportIt": "otvorite problem (issue) na GitHub-u.",
      "detailsHeading": "Detalji",
      "privacyWarning": "Otvaranje problema (issue) ga popunjava porukom o grešci i podacima za otklanjanje grešaka.\nMolimo proverite da li su informacije tačne i uklonite osetljive podatke ako postoje.",
      "recoveredEntry": {
        "heading": "Obnovljen dokument",
        "warning": "Molimo kopirajte/nalepite ovo negde pre odlaska!",
        "copyButtonLabel": "Kopiraj"
      }
    },
    "settingsDropdown": {
      "logOut": "Odjava",
      "account": "Opcije naloga"
    },
    "toast": {
      "onFailToLoadEntries": "Neuspelo učitavanje unosa: %{details}",
      "onFailToLoadDeployPreview": "Neuspelo učitavanje pregleda: %{details}",
      "onFailToPersist": "Neuspelo čuvanje unosa: %{details}",
      "onFailToDelete": "Neuspelo brisanje unosa: %{details}",
      "onFailToUpdateStatus": "Neuspelo ažuriranje statusa: %{details}",
      "missingRequiredField": "Ups, preskočili ste obavezno polje. Molimo popunite pre čuvanja.",
      "entrySaved": "Unos sačuvan",
      "entryPublished": "Unos objavljen",
      "entryUnpublished": "Unos uklonjen iz objava",
      "onFailToPublishEntry": "Neuspelo objavljivanje unosa: %{details}",
      "onFailToUnpublishEntry": "Neuspelo uklanjanje unosa iz objava: %{details}",
      "entryUpdated": "Status unosa ažuriran",
      "onDeleteUnpublishedChanges": "Neobjavljene izmene izbrisane",
      "noteAdded": "Beleška je dodata",
      "onFailToAddNote": "Beleška nije dodata: %{details}",
      "noteUpdated": "Beleška je izmenjena",
      "onFailToUpdateNote": "Beleška nije izmenjena: %{details}",
      "noteDeleted": "Beleška je obrisana",
      "onFailToDeleteNote": "Beleška nije obrisana: %{details}",
      "noteResolved": "Beleška je označena kao rešena",
      "noteReopened": "Beleška je ponovo otvorena",
      "onFailToToggleNote": "Status beleške nije promenjen: %{details}",
      "onFailToAuth": "%{details}",
      "onLoggedOut": "Odjavljeni ste, molimo sačuvajte sve podatke i prijavite se ponovo",
      "onBackendDown": "Servis za čuvanje trenutno ne radi. Više informacija: %{details}"
    }
  },
  "workflow": {
    "workflow": {
      "loading": "Učitavanje unosa uredničkog toka rada",
      "workflowHeading": "Urednički tok rada",
      "newPost": "Nova objava",
      "description": "%{smart_count} unos čeka pregled, %{readyCount} spreman za proizvodnju. |||| %{smart_count} unosa čeka pregled, %{readyCount} spremno za proizvodnju. ",
      "dateFormat": "MMMM D"
    },
    "workflowCard": {
      "lastChange": "%{date} od strane %{author}",
      "lastChangeNoAuthor": "%{date}",
      "lastChangeNoDate": "od strane %{author}",
      "deleteChanges": "Izbriši izmene",
      "deleteNewEntry": "Izbriši novi unos",
      "publishChanges": "Objavi izmene",
      "publishNewEntry": "Objavi novi unos"
    },
    "workflowList": {
      "onDeleteEntry": "Da li ste sigurni da želite da izbrišete ovaj unos?",
      "onPublishingNotReadyEntry": "Samo stavke sa statusom „Spremno“ mogu biti objavljene. Molimo prevucite karticu u kolonu „Spremno“ da biste omogućili objavljivanje.",
      "onPublishEntry": "Da li ste sigurni da želite da objavite ovaj unos?",
      "draftHeader": "Nacrti",
      "inReviewHeader": "Na pregledu",
      "readyHeader": "Spremno",
      "currentEntries": "%{smart_count} unos |||| %{smart_count} unosa"
    }
  }
});
