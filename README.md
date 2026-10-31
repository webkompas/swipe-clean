# Swipe Clean

Ruim je iPhone-galerij op door te swipen. Foto's en video's komen volledig willekeurig één voor één voorbij.

| Gebaar | Actie |
|---|---|
| ← naar links | Naar de prullenbak (wordt pas echt gewist als je de prullenbak leegt) |
| → naar rechts | Behouden: komt nooit meer terug |
| ↑ omhoog | Later beslissen: komt later willekeurig terug |
| ↶ knop | Laatste swipe ongedaan maken (tot 50 stappen) |
| Live Photo ingedrukt houden | Beweging afspelen |
| Tik op een video | Geluid aan/uit |

## Hoe het werkt
- **Echt willekeurig:** bij de start worden alle foto-/video-ID's opgehaald, al beoordeelde items gaan eruit en de rest wordt geschud met Fisher–Yates. Datum en album spelen geen rol.
- **Geheugen:** beslissingen staan in een lokale SQLite-database op je iPhone (`src/db.ts`).
- **Wissen:** via de prullenbak, in één keer. iOS toont één bevestigingsvenster en de items blijven 30 dagen in "Recent verwijderd".
- **Voortgang:** "x / y bekeken", ruimte die je kunt vrijmaken, en het totaal dat je al hebt opgeruimd.
- **Nieuwe foto's** die je maakt terwijl de app openstaat, worden willekeurig in de stapel gestoken.

## Testen op je iPhone (zonder Mac)
1. Installeer **Expo Go** uit de App Store.
2. Publiceer een update: `npx eas-cli@latest update --branch preview` (vereist `EXPO_TOKEN`).
3. Open de link of QR-code die daarbij hoort in Expo Go.
4. Geef bij de toestemmingsvraag **"Volledige toegang"** tot je foto's.

## Ontwikkeling
```bash
npm install
npx expo start          # dev-server
npx tsc --noEmit        # typecheck
npx expo lint           # lint
```

## Structuur
- `App.tsx`: toestemmingen en het hoofdscherm
- `src/useDeck.ts`: stapel, swipes, ongedaan maken, prullenbak
- `src/library.ts`: galerij ophalen, bestandsgrootte, wissen, plaatsnamen
- `src/components/CardStack.tsx`: swipe-kaarten en animaties
- `src/components/MediaView.tsx`: foto, video en Live Photo
