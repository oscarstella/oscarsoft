import * as Speech from 'expo-speech';

/**
 * Servicio de voz y locución con acento argentino (es-AR)
 * para alertas a choferes y pasajeros en BariGo.
 */
export const VoiceService = {
  // Reproducir mensaje con entonación argentina
  speak(text) {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, {
      language: 'es-AR',
      pitch: 1.0,
      rate: 0.98,
      onStart: () => console.log(`[Voz Argentina]: "${text}"`),
      onError: (e) => console.log('[Voz Error]:', e)
    });
  },

  // Alertas específicas para Chofer
  notifyNewRideDriver(origin, fare) {
    this.speak(`¡Nuevo viaje en Bariloche! Pasajero en ${origin}. Tarifa ${fare} pesos.`);
  },

  notifyDriverArrived() {
    this.speak('Has llegado al punto de recogida del pasajero.');
  },

  notifyTripStarted(destination) {
    this.speak(`Viaje iniciado con destino a ${destination}. Que tengas un buen recorrido.`);
  },

  notifyTripCompleted(fare) {
    this.speak(`Has llegado al destino final. Cobrar al pasajero ${fare} pesos.`);
  },

  // Alertas específicas para Pasajero
  notifyDriverAssigned(driverName, vehicle, plate) {
    this.speak(`Tu chofer ${driverName} viene en camino en un ${vehicle}, patente ${plate}.`);
  },

  notifyDriverAtDoor() {
    this.speak('Tu chofer de BariGo ha llegado a la puerta.');
  }
};
