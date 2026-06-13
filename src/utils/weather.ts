export interface WeatherData {
  isCloudy: boolean;
  isRainy: boolean;
  cloudCoverPercent: number;
  precipitationMm: number;
}

export async function fetchWeather(lat: number, lng: number, time: Date): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=cloud_cover,precipitation&timezone=UTC`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    
    // Time matching logic. Open-Meteo returns 'hourly.time' as ["2026-06-13T00:00", "2026-06-13T01:00"]
    // Convert target time to UTC string format matching Open-Meteo
    const isoString = time.toISOString(); // e.g. "2026-06-13T03:20:15.123Z"
    const targetHour = isoString.substring(0, 14) + "00"; // "2026-06-13T03:00"

    const index = data.hourly?.time?.indexOf(targetHour);
    if (index === -1 || index === undefined) return null;

    const cloudCover = data.hourly.cloud_cover[index];
    const precipitation = data.hourly.precipitation[index];

    return {
      isCloudy: cloudCover > 70, // 70% threshold for "mostly cloudy"
      isRainy: precipitation > 0.5, // > 0.5mm is noticeable rain
      cloudCoverPercent: cloudCover,
      precipitationMm: precipitation
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
}
