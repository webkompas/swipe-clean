import { Asset, AssetField, MediaType, Query, type AssetMetadata } from 'expo-media-library';
import { File } from 'expo-file-system';
import * as Location from 'expo-location';

const PAGE = 5000;

/** Haalt de lichte metadata van ALLE foto's en video's op. */
export async function loadAllMetadata(): Promise<AssetMetadata[]> {
  const all: AssetMetadata[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await new Query()
      .within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO])
      .orderBy(AssetField.CREATION_TIME)
      .offset(offset)
      .limit(PAGE)
      .exeForMetadata();
    all.push(...page);
    if (page.length < PAGE) break;
  }
  return all;
}

/** URI voor expo-image (PhotoKit-thumbnail, snel en zonder download). */
export function imageSource(id: string): string {
  return id.startsWith('ph://') ? id : `ph://${id}`;
}

/** Bestandsgrootte, alleen als het bestand lokaal op de iPhone staat (geen iCloud-download). */
export async function getAssetSize(id: string): Promise<number | null> {
  try {
    const asset = new Asset(id);
    if (await asset.getIsInCloud()) return null;
    const uri = await asset.getUri();
    let size = new File(uri).info().size ?? 0;
    const live = await asset.getLivePhotoVideoUri().catch(() => null);
    if (live) size += new File(live).info().size ?? 0;
    return size || null;
  } catch {
    return null;
  }
}

export async function deleteAssets(ids: string[]): Promise<void> {
  await Asset.delete(ids.map((id) => new Asset(id)));
}

// ---------- Plaatsnamen ----------
const placeCache = new Map<string, string | null>();
let locationAllowed: boolean | null = null;

export async function requestLocationPermission() {
  try {
    const res = await Location.requestForegroundPermissionsAsync();
    locationAllowed = res.granted;
  } catch {
    locationAllowed = false;
  }
}

export async function getPlaceName(id: string): Promise<string | null> {
  try {
    if (locationAllowed === null) {
      locationAllowed = (await Location.getForegroundPermissionsAsync()).granted;
    }
    if (!locationAllowed) return null;
    const loc = await new Asset(id).getLocation();
    if (!loc || (loc.latitude === 0 && loc.longitude === 0)) return null;
    const key = `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;
    if (placeCache.has(key)) return placeCache.get(key)!;
    const [addr] = await Location.reverseGeocodeAsync(loc);
    const name = addr ? addr.city ?? addr.subregion ?? addr.region ?? addr.country ?? null : null;
    placeCache.set(key, name);
    return name;
  } catch {
    return null;
  }
}
