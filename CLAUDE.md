# Swipe Clean: projectcontext voor Claude

Lees ook `AGENTS.md` (Expo-regels) en `README.md` (functies en structuur).

## Gebruiker
- Marketeer, geen developer. Spreek hem/haar aan met **"boss"**, antwoord kort en in het **Nederlands**.
- Eindig elk antwoord met **3 vervolgvragen** om het resultaat te verbeteren.
- Heeft een **iPhone**, **geen Mac** en **geen Apple Developer-account**. Testen gebeurt via **Expo Go** + **EAS Update**.
- Werkt vaak vanaf de telefoon: geef stappen die op mobiel werken.

## Afgesproken specificatie v1 (gebouwd)
- Tinder-achtig: ← = prullenbak, → = behouden (komt nooit meer terug), ↑ = later beslissen (komt willekeurig terug, telt niet als bekeken).
- **Volledig willekeurig** (Fisher–Yates over alle foto's en video's), geen categorieën/filters, datum en album spelen geen rol.
- Echt wissen via de prullenbak (één iOS-bevestiging, items 30 dagen in "Recent verwijderd").
- Ongedaan maken (50 stappen), voortgang "x / y bekeken", vrij te maken ruimte, felicitatie na het legen, herinnering per 50 items in de prullenbak.
- Video's (autoplay zonder geluid, tik voor geluid), Live Photos (ingedrukt houden), bursts (als één kaart; wisgedrag nog niet geverifieerd).
- Donker minimalistisch thema, Nederlandstalig, datum + plaatsnaam op de kaart, "Galerij doorgewerkt!"-scherm, reset behouden in Overzicht.
- Eigen app-icoon en opstartscherm (`assets/`).

## Technisch
- Expo SDK 58, nieuwe `expo-media-library` API (Query/Asset), gesture-handler v3 (`usePanGesture`), Reanimated 4, expo-sqlite voor beslissingen.
- Geen Expo Router (bewust: één scherm + modals).
- `npx tsc --noEmit` en `npx expo lint` zijn groen; iOS-bundle (`expo export`) bouwt.
- In de vorige sessie blokkeerde het netwerk `*.expo.dev`; gebruik `EXPO_OFFLINE=1` voor `expo install`/`export` als dat nog zo is.

## Status en volgende stappen
1. De gebruiker heeft een Expo-token toegevoegd als **netwerk-secret** (Bearer, `*.expo.dev`). De proxy voegt het Authorization-header toe; `EXPO_TOKEN` zelf is mogelijk niet als variabele zichtbaar. Test `npx eas-cli@latest whoami` (zo nodig met een dummy-`EXPO_TOKEN` zodat de CLI een verzoek doet).
2. `eas init` (projectId in app.json) → `eas update --branch preview` → geef de gebruiker de link/QR voor Expo Go.
3. Lukt het uploaden niet, meld dan precies welk domein geblokkeerd is (bijv. `storage.googleapis.com`).
4. Daarna: testchecklist voor de gebruiker, en het burst-wisgedrag controleren.
5. Open ideeën: maximum op "later" (bijv. na 3 keer een keuze afdwingen).
