import { useEffect } from 'react';
import { useWeatherStore, type RealWeatherType, type TimeOfDay } from '../stores/weatherStore';

const FETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Map WMO weather code to our simplified types */
function wmoToWeather(code: number): RealWeatherType {
  // WMO Weather interpretation codes (WW)
  // 0: Clear sky, 1-3: Mainly clear/partly cloudy/overcast
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  // 45, 48: Fog
  if (code === 45 || code === 48) return 'fog';
  // 51-67: Drizzle/Rain
  if (code >= 51 && code <= 67) return 'rain';
  // 71-77: Snow
  if (code >= 71 && code <= 77) return 'snow';
  // 80-82: Rain showers
  if (code >= 80 && code <= 82) return 'rain';
  // 85-86: Snow showers
  if (code >= 85 && code <= 86) return 'snow';
  // 95-99: Thunderstorm
  if (code >= 95) return 'rain';
  return 'clear';
}

async function fetchWeather(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();
  return {
    temp: data.current?.temperature_2m ?? 20,
    weatherCode: data.current?.weather_code ?? 0,
  };
}

export function useRealWeather() {
  const { latitude, longitude, lastFetch, setRealWeather, setTimeOfDay, setLocation, setLastFetch } =
    useWeatherStore();

  // Update time of day every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeOfDay(getTimeOfDay(new Date().getHours()));
    };
    updateTime();
    const interval = setInterval(updateTime, 60_000);
    return () => clearInterval(interval);
  }, [setTimeOfDay]);

  // Get geolocation on mount
  useEffect(() => {
    if (latitude !== null) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Fallback: New York
        setLocation(40.7128, -74.006);
      },
      { timeout: 5000, maximumAge: 600_000 },
    );
  }, [latitude, setLocation]);

  // Fetch weather when we have location
  useEffect(() => {
    if (latitude === null || longitude === null) return;

    const now = Date.now();
    if (now - lastFetch < FETCH_INTERVAL) return;

    let cancelled = false;

    fetchWeather(latitude, longitude)
      .then(({ temp, weatherCode }) => {
        if (cancelled) return;
        setRealWeather(wmoToWeather(weatherCode), temp);
        setLastFetch(Date.now());
      })
      .catch((err) => {
        console.warn('[weather] Fetch failed:', err);
      });

    // Set up recurring fetch
    const interval = setInterval(() => {
      fetchWeather(latitude, longitude)
        .then(({ temp, weatherCode }) => {
          if (cancelled) return;
          setRealWeather(wmoToWeather(weatherCode), temp);
          setLastFetch(Date.now());
        })
        .catch(() => {});
    }, FETCH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [latitude, longitude, lastFetch, setRealWeather, setLastFetch]);
}
