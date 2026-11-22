import { createMemo } from 'solid-js';
import {
  liveLocation,
  locationError,
  locationLoading,
  permissionStatus,
  refreshDeviceLocation,
} from '../stores/locationStore.js';

export function useGeolocation() {
  const coords = createMemo(() => {
    const loc = liveLocation();
    if (!loc) return null;
    return {
      lat: loc.lat,
      lng: loc.lng,
      accuracy: loc.accuracy || 0,
    };
  });

  const permissionNote = createMemo(() => {
    const loc = liveLocation();
    if (loc?.fullAddress) {
      return `Live GPS: ${loc.fullAddress}`;
    }
    return '';
  });

  return {
    coords,
    liveLocation,
    loading: locationLoading,
    error: locationError,
    permissionStatus,
    permissionNote,
    detectLocation: refreshDeviceLocation,
  };
}
