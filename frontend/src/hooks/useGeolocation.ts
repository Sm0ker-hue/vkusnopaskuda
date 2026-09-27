import { useState, useEffect, useCallback } from 'react';

export interface GeoLocationState {
  lat: number;
  lng: number;
  city: string;
  isCustom: boolean;
  status: 'idle' | 'loading' | 'success' | 'fallback' | 'denied';
  error: string | null;
}

export const CZECH_CITIES = [
  { name: 'Plzeň (Centrum)', lat: 49.7431, lng: 13.3765 },
  { name: 'Plzeň (Bory / Doudlevce)', lat: 49.7285, lng: 13.3710 },
  { name: 'Plzeň (Borská pole)', lat: 49.7311, lng: 13.3505 },
  { name: 'Plzeň (Slovany)', lat: 49.7367, lng: 13.3871 },
  { name: 'Plzeň (Lochotín / Roudná)', lat: 49.7538, lng: 13.3779 },
  { name: 'Plzeň (Košutka / Bolevec)', lat: 49.7788, lng: 13.3688 },
  { name: 'Plzeň (Skvrňany)', lat: 49.7442, lng: 13.3401 },
  { name: 'Plzeň (Doubravka)', lat: 49.7497, lng: 13.4042 },
  { name: 'Plzeň (Černice / Olympia)', lat: 49.7025, lng: 13.4140 },
  { name: 'Praha (Centrum)', lat: 50.0878, lng: 14.4205 },
  { name: 'Brno (Centrum)', lat: 49.1951, lng: 16.6068 },
];

export const useGeolocation = () => {
  const [geoState, setGeoState] = useState<GeoLocationState>(() => {
    // Check localStorage for saved city or coordinates
    try {
      const saved = localStorage.getItem('vkusno_user_geo');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy Praha fallback
        if (parsed?.city && parsed.city.toLowerCase().includes('praha')) {
          localStorage.removeItem('vkusno_user_geo');
        } else if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch (err) {
      console.debug('Failed to parse saved geo:', err);
    }

    return {
      lat: CZECH_CITIES[0].lat,
      lng: CZECH_CITIES[0].lng,
      city: CZECH_CITIES[0].name,
      isCustom: false,
      status: 'idle',
      error: null,
    };
  });

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=cs`,
        { headers: { 'User-Agent': 'VkusnoPaskudaApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const locality =
          address.suburb ||
          address.city_district ||
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          'Česká republika';
        const cityPart = address.city || address.town || '';
        return locality !== cityPart && cityPart ? `${cityPart}, ${locality}` : locality;
      }
    } catch {
      // ignore network errors
    }
    return `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
  };

  const setCityManually = useCallback((cityName: string) => {
    const found = CZECH_CITIES.find((c) => c.name === cityName);
    if (found) {
      const updated: GeoLocationState = {
        lat: found.lat,
        lng: found.lng,
        city: `${found.name}`,
        isCustom: true,
        status: 'success',
        error: null,
      };
      setGeoState(updated);
      localStorage.setItem('vkusno_user_geo', JSON.stringify(updated));
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState((prev) => ({
        ...prev,
        status: 'fallback',
        error: 'Geolokace není podporována vaším prohlížečem',
      }));
      return;
    }

    setGeoState((prev) => ({ ...prev, status: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const detectedName = await reverseGeocode(latitude, longitude);

        const updated: GeoLocationState = {
          lat: latitude,
          lng: longitude,
          city: detectedName,
          isCustom: true,
          status: 'success',
          error: null,
        };

        setGeoState(updated);
        localStorage.setItem('vkusno_user_geo', JSON.stringify(updated));
      },
      (err) => {
        let msg = 'Přístup k poloze byl odepřen';
        if (err.code === err.TIMEOUT) msg = 'Vypršel čas zjištění polohy';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Informace o poloze nejsou dostupné';

        setGeoState((prev) => ({
          ...prev,
          status: 'denied',
          error: msg,
          city: prev.city && !prev.city.toLowerCase().includes('praha') ? prev.city : 'Plzeň (Centrum)',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    // If geoState was never confirmed with GPS or manually selected, trigger browser GPS prompt immediately
    if (!geoState.isCustom || geoState.status === 'idle') {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...geoState, requestLocation, setCityManually };
};
