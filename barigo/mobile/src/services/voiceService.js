import * as Speech from 'expo-speech';

function cleanText(txt) {
  if (!txt) return '';
  return txt
    .replace(/,?\s*(?:San Carlos de )?Bariloche/gi, '')
    .replace(/,?\s*Río Negro/gi, '')
    .replace(/,?\s*Argentina/gi, '')
    .trim();
}

/**
 * Servicio de voz y locución con acento argentino (es-AR)
 * para alertas a choferes y pasajeros en BariGo.
 */
export const VoiceService = {
  // Reproducir mensaje con entonación argentina natural y pausada
  speak(text) {
    if (!text) return;
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'es-AR',
        pitch: 0.96,
        rate: 0.86,
        onStart: () => console.log(`[Voz Argentina]: "${text}"`),
        onError: (e) => console.log('[Voz Error]:', e)
      });
    } catch (e) {
      console.warn('[Voz Speech Error]:', e);
    }
  },

  // Alertas específicas para Chofer
  notifyNewRideDriver(origin, fare) {
    const cleanOrigin = cleanText(origin);
    this.speak(`Tenés un nuevo viaje. Recoger en ${cleanOrigin}. Tarifa: ${fare} pesos.`);
  },

  notifyRideCancelled() {
    this.speak('El pasajero canceló la solicitud.');
  },

  notifyDriverArrived() {
    this.speak('Llegaste al punto de encuentro. Se notificó al pasajero.');
  },

  notifyTripStarted(destination) {
    const cleanDest = cleanText(destination);
    this.speak(`Viaje iniciado hacia ${cleanDest}. Conducí con precaución.`);
  },

  notifyTripCompleted(fare) {
    this.speak(`Viaje finalizado. Cobrar ${fare} pesos al pasajero.`);
  },

  // Alertas específicas para Pasajero
  notifyDriverAssigned(driverName, vehicle, plate) {
    this.speak(`Viaje aceptado. Tu chofer ${driverName} viene en camino en un ${vehicle}.`);
  },

  notifyDriverOneMinuteAway() {
    this.speak('¡Atención! Tu auto está a 1 minuto de llegar. Salí a su encuentro.');
  },

  notifyDriverAtDoor() {
    this.speak('Tu chofer de BariGo ya está en el punto de encuentro.');
  }
};
