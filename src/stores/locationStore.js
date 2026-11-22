import { createSignal } from 'solid-js';

const LIVE_LOC_STORAGE_KEY = 'ridehub_live_device_location_v2';

const BLOCKED_REGION_TOKENS = new Set([
  'bhopal',
  'bhopal district',
  'bhopal division',
  'bhopal municipal corporation',
  'madhya pradesh',
  'mp',
  'm.p.',
  'india',
]);

function isBlockedRegionLabel(val, city = '', state = '') {
  const norm = String(val || '').trim().toLowerCase();
  if (!norm) return true;
  if (BLOCKED_REGION_TOKENS.has(norm)) return true;
  if (norm.includes('madhya pradesh')) return true;
  if (norm === 'bhopal' || norm.startsWith('bhopal district') || norm.startsWith('bhopal division')) {
    return true;
  }
  const normCity = String(city || '').trim().toLowerCase();
  const normState = String(state || '').trim().toLowerCase();
  if (normState && norm === normState) return true;
  if (normCity && norm === normCity) return true;
  return false;
}

export function stripCityStateFromAddress(rawText, city = '', state = '') {
  const parts = String(rawText || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const seen = new Set();
  const cleaned = [];
  for (const part of parts) {
    if (isBlockedRegionLabel(part, city, state)) continue;
    // Skip standalone 6-digit Indian pincode tokens so only readable area names show
    if (/^\d{5,6}$/.test(part)) continue;
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(part);
  }
  return cleaned.join(', ');
}

function buildAreaParts(candidates, { city = '', state = '' } = {}) {
  const seen = new Set();
  const result = [];
  for (const item of candidates) {
    const subParts = String(item || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of subParts) {
      if (isBlockedRegionLabel(part, city, state)) continue;
      if (/^\d{5,6}$/.test(part)) continue;
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(part);
    }
  }
  return result;
}

function loadCachedLocation() {
  try {
    const raw = localStorage.getItem(LIVE_LOC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      const cleanFull = stripCityStateFromAddress(parsed.fullAddress, parsed.city, parsed.state);
      const cleanShort = stripCityStateFromAddress(parsed.shortAddress, parsed.city, parsed.state);
      const cleanArea = stripCityStateFromAddress(parsed.area, parsed.city, parsed.state);
      if (!cleanArea && !cleanFull) return null;
      return {
        ...parsed,
        area: cleanArea || cleanShort.split(',')[0] || 'Current Area',
        shortAddress: cleanShort || cleanFull,
        fullAddress: cleanFull || cleanShort,
      };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function saveCachedLocation(loc) {
  try {
    localStorage.setItem(LIVE_LOC_STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // ignore storage errors
  }
}

const [liveLocation, setLiveLocation] = createSignal(loadCachedLocation());
const [locationLoading, setLocationLoading] = createSignal(false);
const [locationError, setLocationError] = createSignal('');
const [permissionStatus, setPermissionStatus] = createSignal('prompt');

let watchId = null;
let lastGeocodedLat = null;
let lastGeocodedLng = null;
let geocodeInFlight = false;

function movedEnough(lat, lng) {
  if (lastGeocodedLat === null || lastGeocodedLng === null) return true;
  const dLat = Math.abs(lat - lastGeocodedLat);
  const dLng = Math.abs(lng - lastGeocodedLng);
  // ~25 meters threshold
  return dLat > 0.00025 || dLng > 0.00025;
}

async function reverseGeocode(lat, lng) {
  // Primary: OpenStreetMap Nominatim (street, colony, suburb, village & area-level accuracy)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || '';
      const state = addr.state || '';
      const postalCode = addr.postcode || '';

      const road = [addr.house_number, addr.road].filter(Boolean).join(' ');
      const primaryAreaCandidates = [
        addr.neighbourhood,
        addr.suburb,
        addr.quarter,
        addr.residential,
        addr.hamlet,
        addr.village,
        addr.town,
        addr.locality,
        addr.commercial,
        addr.industrial,
        addr.city_district,
        addr.county,
        data.name,
        road,
      ];

      const areaParts = buildAreaParts(primaryAreaCandidates, { city, state });
      const detailedParts = buildAreaParts(
        [
          road,
          addr.neighbourhood,
          addr.quarter,
          addr.residential,
          addr.suburb,
          addr.hamlet,
          addr.village,
          addr.town,
          addr.locality,
          addr.city_district,
          addr.county,
        ],
        { city, state }
      );

      // If structured fields were empty, parse display_name segments while stripping city/state
      const fallbackParts =
        detailedParts.length > 0
          ? detailedParts
          : buildAreaParts((data.display_name || '').split(','), { city, state });

      if (fallbackParts.length > 0) {
        const headlineArea = areaParts[0] || fallbackParts[0];
        const shortAddress = fallbackParts.slice(0, 2).join(', ');
        const fullAddress = fallbackParts.slice(0, 3).join(', ');
        return {
          area: headlineArea,
          line1: fullAddress,
          city,
          state,
          postalCode,
          shortAddress,
          fullAddress,
        };
      }
    }
  } catch {
    // fall through to Photon
  }

  // Secondary: Photon by Komoot (fast CORS-enabled OSM area/street reverse geocoder)
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    );
    if (res.ok) {
      const data = await res.json();
      const props = data?.features?.[0]?.properties || {};
      const city = props.city || '';
      const state = props.state || '';
      const postalCode = props.postcode || '';

      const areaParts = buildAreaParts(
        [props.locality, props.district, props.name, props.street, props.county],
        { city, state }
      );

      if (areaParts.length > 0) {
        const headlineArea = areaParts[0];
        const shortAddress = areaParts.slice(0, 2).join(', ');
        const fullAddress = areaParts.slice(0, 3).join(', ');
        return {
          area: headlineArea,
          line1: fullAddress,
          city,
          state,
          postalCode,
          shortAddress,
          fullAddress,
        };
      }
    }
  } catch {
    // fall through to BigDataCloud
  }

  // Tertiary: BigDataCloud (extract finest sub-locality/ward/tehsil, never Bhopal/Madhya Pradesh)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
        lat
      )}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || '';
      const state = data.principalSubdivision || '';
      const postalCode = data.postcode || '';

      const adminEntries = [...(data.localityInfo?.administrative || [])]
        .sort((a, b) => (b.adminLevel || b.order || 0) - (a.adminLevel || a.order || 0))
        .filter((e) => (e.adminLevel ? e.adminLevel >= 6 : true))
        .map((e) => e.name);

      const infoEntries = [...(data.localityInfo?.informative || [])]
        .filter((e) => e.name && !/time zone|utc|asia/i.test(e.description || e.name))
        .map((e) => e.name);

      const areaParts = buildAreaParts([data.locality, ...adminEntries, ...infoEntries], {
        city,
        state,
      });

      if (areaParts.length > 0) {
        const headlineArea = areaParts[0];
        const shortAddress = areaParts.slice(0, 2).join(', ');
        const fullAddress = areaParts.slice(0, 3).join(', ');
        return {
          area: headlineArea,
          line1: fullAddress,
          city,
          state,
          postalCode,
          shortAddress,
          fullAddress,
        };
      }
    }
  } catch {
    // fallback to coordinates
  }

  return {
    area: 'LIVE AREA',
    line1: `Area (${lat}, ${lng})`,
    city: '',
    state: '',
    postalCode: '',
    shortAddress: `${lat}, ${lng}`,
    fullAddress: `GPS: ${lat}, ${lng}`,
  };
}

async function handlePosition(position, forceGeocode = false) {
  const lat = Number(position.coords.latitude.toFixed(5));
  const lng = Number(position.coords.longitude.toFixed(5));
  const accuracy = Math.round(position.coords.accuracy || 0);
  const nowIso = new Date().toISOString();

  setPermissionStatus('granted');
  setLocationError('');

  const existing = liveLocation();
  // Immediately update coordinates so UI reacts with zero delay
  setLiveLocation({
    area: existing?.area || 'LIVE AREA',
    line1: existing?.line1 || `GPS: ${lat}, ${lng}`,
    city: existing?.city || '',
    state: existing?.state || '',
    postalCode: existing?.postalCode || '',
    shortAddress: existing?.shortAddress || `${lat}, ${lng}`,
    fullAddress: existing?.fullAddress || `GPS: ${lat}, ${lng}`,
    lat,
    lng,
    accuracy,
    updatedAt: nowIso,
    isLive: true,
  });

  if ((forceGeocode || movedEnough(lat, lng) || !existing?.fullAddress) && !geocodeInFlight) {
    geocodeInFlight = true;
    try {
      const resolved = await reverseGeocode(lat, lng);
      lastGeocodedLat = lat;
      lastGeocodedLng = lng;
      const updated = {
        ...resolved,
        lat,
        lng,
        accuracy,
        updatedAt: new Date().toISOString(),
        isLive: true,
      };
      setLiveLocation(updated);
      saveCachedLocation(updated);
    } finally {
      geocodeInFlight = false;
      setLocationLoading(false);
    }
  } else {
    setLocationLoading(false);
  }
}

function handleGeoError(geoErr) {
  setLocationLoading(false);
  if (geoErr?.code === 1) {
    setPermissionStatus('denied');
    setLocationError('Location permission denied. Allow GPS access in your browser settings.');
  } else if (geoErr?.code === 2) {
    setLocationError('Device GPS signal unavailable. Please enable Location/GPS on your device.');
  } else {
    setLocationError('Location fetch timed out. Tap GPS icon to retry.');
  }
}

export function refreshDeviceLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    setPermissionStatus('unsupported');
    setLocationError('Geolocation is not supported on this device/browser.');
    return Promise.resolve(null);
  }

  setLocationError('');
  setLocationLoading(true);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePosition(pos, true);
        resolve(liveLocation());
      },
      (err) => {
        handleGeoError(err);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

export function startLiveLocationTracking() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    setPermissionStatus('unsupported');
    return;
  }

  // Always fetch an immediate high-accuracy fix on launch
  refreshDeviceLocation();

  // Start continuous watchPosition so device movement updates location automatically
  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        handlePosition(pos, false);
      },
      (err) => {
        if (err?.code === 1) {
          setPermissionStatus('denied');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }
}

export function stopLiveLocationTracking() {
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

export function setManualOverrideLocation(loc) {
  const cleanLine = stripCityStateFromAddress(loc.fullAddress || loc.line1 || '', loc.city, loc.state);
  const cleanArea =
    stripCityStateFromAddress(loc.area || loc.label || '', loc.city, loc.state) ||
    cleanLine.split(',')[0]?.trim() ||
    'Selected Area';
  const cleanShort =
    stripCityStateFromAddress(loc.shortAddress || '', loc.city, loc.state) ||
    cleanLine.split(',').slice(0, 2).join(', ') ||
    cleanArea;

  const updated = {
    area: cleanArea,
    line1: cleanLine || cleanArea,
    city: loc.city || '',
    state: loc.state || '',
    postalCode: loc.postalCode || '',
    shortAddress: cleanShort,
    fullAddress: cleanLine || cleanShort,
    lat: loc.lat,
    lng: loc.lng,
    accuracy: loc.accuracy || 0,
    updatedAt: new Date().toISOString(),
    isLive: Boolean(loc.isLive),
  };
  setLiveLocation(updated);
  saveCachedLocation(updated);
}

export { liveLocation, locationLoading, locationError, permissionStatus };
