import { create } from 'zustand';

export type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';
export type RealWeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';

interface WeatherStore {
  realWeather: RealWeatherType;
  realTemp: number;
  timeOfDay: TimeOfDay;
  latitude: number | null;
  longitude: number | null;
  lastFetch: number;
  setRealWeather: (weather: RealWeatherType, temp: number) => void;
  setTimeOfDay: (tod: TimeOfDay) => void;
  setLocation: (lat: number, lon: number) => void;
  setLastFetch: (ts: number) => void;
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  realWeather: 'clear',
  realTemp: 20,
  timeOfDay: 'midday',
  latitude: null,
  longitude: null,
  lastFetch: 0,
  setRealWeather: (weather, temp) => set({ realWeather: weather, realTemp: temp }),
  setTimeOfDay: (tod) => set({ timeOfDay: tod }),
  setLocation: (lat, lon) => set({ latitude: lat, longitude: lon }),
  setLastFetch: (ts) => set({ lastFetch: ts }),
}));
