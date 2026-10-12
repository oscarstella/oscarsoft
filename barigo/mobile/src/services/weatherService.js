/**
 * Servicio gratuito de Clima y Demora de Tráfico en Bariloche
 * Utiliza Open-Meteo (API 100% libre, sin API key requerida)
 * y cálculo dinámico de congestión horaria en corredores de Bariloche (Bustillo, Pioneros, Mitre).
 */

let cachedWeather = null;
let lastFetchTime = 0;

export async function getBarilocheWeather() {
  const now = Date.now();
  // Cache por 5 minutos
  if (cachedWeather && now - lastFetchTime < 5 * 60 * 1000) {
    return cachedWeather;
  }

  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-41.1335&longitude=-71.3103&current_weather=true',
      { headers: { 'User-Agent': 'BariGo-App/2.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const current = data.current_weather || {};
      const temp = Math.round(current.temperature ?? 10);
      const code = current.weathercode ?? 0;
      const wind = Math.round(current.windspeed ?? 12);

      let icon = '☀️';
      let condition = 'Despejado';

      if (code === 0) {
        icon = '☀️';
        condition = 'Soleado';
      } else if (code >= 1 && code <= 3) {
        icon = '⛅';
        condition = 'Parcial nublado';
      } else if (code === 45 || code === 48) {
        icon = '🌫️';
        condition = 'Niebla';
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        icon = '🌧️';
        condition = 'Lluvia';
      } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
        icon = '❄️';
        condition = 'Nieve en cerros';
      } else if (code >= 95) {
        icon = '⛈️';
        condition = 'Tormenta';
      }

      // Cálculo de demora de tráfico en Bariloche
      const delayInfo = calculateTrafficDelay(code);

      cachedWeather = {
        temperature: temp,
        icon,
        condition,
        windKmH: wind,
        delayMin: delayInfo.delayMin,
        delayText: delayInfo.delayText,
        isTrafficPeak: delayInfo.isPeak
      };
      lastFetchTime = now;
      return cachedWeather;
    }
  } catch (e) {
    console.warn('[Weather Service]:', e.message);
  }

  // Fallback seguro si no hay internet momentáneo
  const fallbackDelay = calculateTrafficDelay(0);
  return {
    temperature: 11,
    icon: '⛅',
    condition: 'Templado',
    windKmH: 14,
    delayMin: fallbackDelay.delayMin,
    delayText: fallbackDelay.delayText,
    isTrafficPeak: fallbackDelay.isPeak
  };
}

/**
 * Cálculo de demora de tráfico según hora pico y clima en Bariloche
 * Picos habituales: 07:45-09:15 (laboral/escolar), 12:30-14:00 (mediodía), 18:00-20:00 (vuelta/turistas)
 */
export function calculateTrafficDelay(weatherCode = 0) {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const totalMin = hour * 60 + min;

  let delayMin = 0;
  let isPeak = false;
  let delayText = 'Tráfico fluido';

  // Horas pico en Bariloche (Av. Bustillo, Pioneros, Mitre, Moreno)
  if (totalMin >= 465 && totalMin <= 555) {
    // 07:45 a 09:15
    delayMin = 4;
    isPeak = true;
    delayText = '+4 min (Hora pico Bustillo/Centro)';
  } else if (totalMin >= 750 && totalMin <= 840) {
    // 12:30 a 14:00
    delayMin = 3;
    isPeak = true;
    delayText = '+3 min (Demora media mediodía)';
  } else if (totalMin >= 1080 && totalMin <= 1200) {
    // 18:00 a 20:00
    delayMin = 5;
    isPeak = true;
    delayText = '+5 min (Hora pico vuelta/turismo)';
  }

  // Si hay nieve o lluvia intensa en Bariloche, sumar precaución
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    delayMin += 4;
    delayText = `+${delayMin} min (Calzada con nieve/hielo)`;
  } else if (weatherCode >= 51 && weatherCode <= 67) {
    delayMin += 2;
    if (isPeak) {
      delayText = `+${delayMin} min (Lluvia y congestión)`;
    } else {
      delayText = '+2 min (Lluvia en calzada)';
    }
  }

  return { delayMin, delayText, isPeak };
}
