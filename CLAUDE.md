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
- **Gepubliceerd** (EAS Update): project `@sandervdhs-team/swipe-clean` (projectId in `app.json`), branch + kanaal `preview`, `runtimeVersion` = `exposdk:58.0.0` (vereist voor Expo Go; geen `ios.runtimeVersion`-override toevoegen).
- Expo Go-link: `exp://u.expo.dev/57e6b4e3-2881-4695-8fbe-f3bdbd7a0cf3?channel-name=preview&runtime-version=exposdk%3A58.0.0`
- Nieuwe versie publiceren: `EXPO_TOKEN=dummy npx eas-cli@latest update --branch preview --environment preview --platform ios --non-interactive --message "..."` (proxy vult het echte token in).
- Beginscherm nu: iOS Opdrachten-snelkoppeling naar de Expo Go-link. Echte app (eigen icoon, zonder Expo Go) vereist Apple Developer-account ($99/jaar) → `eas build` in de cloud → TestFlight.
1. Testchecklist voor de gebruiker, en het burst-wisgedrag controleren.
2. Open ideeën: maximum op "later" (bijv. na 3 keer een keuze afdwingen).
