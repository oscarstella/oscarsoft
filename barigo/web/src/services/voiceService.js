// Guía y síntesis de voz en acento argentino natural con cadencia GPS fluida (Estilo Google Maps / Waze / Uber)
import { soundService } from './soundService';

// Función para acortar y humanizar direcciones de Bariloche para locución fluida
export function cleanAddressForSpeech(address) {
  if (!address) return '';
  return address
    .replace(/,?\s*(?:San Carlos de )?Bariloche/gi, '')
    .replace(/,?\s*Río Negro/gi, '')
    .replace(/,?\s*Argentina/gi, '')
    .replace(/,?\s*CP\s*\d+/gi, '')
    .replace(/\(.*?\)/g, '') // Elimina notas entre paréntesis para no trabar la voz
    .replace(/\s+/g, ' ')
    .trim();
}

class VoiceService {
  constructor() {
    this.enabled = true;
    this.voicesLoaded = false;
    this.cachedVoice = null;
    this.initVoices();
  }

  initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          this.cachedVoice = this.findBestNaturalVoice(voices);
        }
      };

      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
  }

  // Desbloqueo inmediato del audio del navegador al interactuar (clicks / taps en celular)
  unlockAudio() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        const warmUtterance = new SpeechSynthesisUtterance('');
        warmUtterance.volume = 0.01;
        window.speechSynthesis.speak(warmUtterance);
      } catch {}
    }
  }

  // Selección rigurosa de la voz con mejor pronunciación y naturalidad en español
  findBestNaturalVoice(voicesList) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = voicesList || window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Voces Naturales / Online argentinas (Edge Neural / Windows)
    let v = voices.find(v => 
      (v.lang === 'es-AR' || v.lang === 'es_AR') && 
      (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural'))
    );
    if (v) return v;

    // 2. Voces Google en Español (Chrome / Android TTS Neural de alta fidelidad)
    v = voices.find(v => 
      v.name.toLowerCase().includes('google') && 
      (v.lang === 'es-AR' || v.lang === 'es_AR' || v.lang === 'es-419' || v.lang === 'es-US' || v.lang.startsWith('es'))
    );
    if (v) return v;

    // 3. Voces nativas de Argentina reconocidas (Diego, Isabela, Argentina)
    v = voices.find(v => 
      (v.lang === 'es-AR' || v.lang === 'es_AR') ||
      v.name.toLowerCase().includes('diego') ||
      v.name.toLowerCase().includes('isabela') ||
      v.name.toLowerCase().includes('argentina')
    );
    if (v) return v;

    // 4. Voces neutras latinoamericanas cálidas (Paulina, Sofia, Sabina en iOS/macOS)
    v = voices.find(v => 
      (v.lang === 'es-419' || v.lang === 'es-US' || v.lang === 'es-MX' || v.lang === 'es-CL') ||
      v.name.toLowerCase().includes('paulina') ||
      v.name.toLowerCase().includes('sofia')
    );
    if (v) return v;

    // 5. Cualquier voz Natural/Online en español
    v = voices.find(v => 
      v.lang.startsWith('es') && 
      (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural'))
    );
    if (v) return v;

    // 6. Cualquier voz en español
    v = voices.find(v => v.lang.startsWith('es') && !v.lang.includes('ES'));
    if (v) return v;

    return voices.find(v => v.lang.startsWith('es')) || null;
  }

  toggle(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  speak(text, options = {}) {
    if (!this.enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      // Cadencia 0.92 y pitch 1.0 garantizan el tono cálido de GPS (Google Maps / Waze)
      utterance.rate = options.rate || 0.92;
      utterance.pitch = options.pitch || 1.0;

      const voice = this.cachedVoice || this.findBestNaturalVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Evita interrupciones de síntesis en navegadores móviles
      const resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
        } else {
          window.speechSynthesis.resume();
        }
      }, 4000);

      utterance.onend = () => clearInterval(resumeInterval);
      utterance.onerror = () => clearInterval(resumeInterval);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[VoiceService] Error:', e);
    }
  }

  // --- LOCUCIONES ESPECÍFICAS DE GPS DE CHOFER ---

  // Al aceptar el viaje: indicación inmediata de inicio hacia el origen
  speakAcceptAndStartToPickup(origin, street = '', nextManeuver = '') {
    const cleanOrigin = cleanAddressForSpeech(origin) || 'el punto de encuentro';
    let msg = `Viaje aceptado. Dirigite hacia ${cleanOrigin}.`;
    if (street && street !== 'Vía principal de Bariloche') {
      msg += ` Iniciá el recorrido por ${street}.`;
    }
    if (nextManeuver) {
      msg += ` ${nextManeuver}`;
    }
    this.speak(msg);
  }

  // Al llegar al origen y comenzar el viaje al destino final
  speakStartTripToDestination(destination, street = '', nextManeuver = '') {
    const cleanDest = cleanAddressForSpeech(destination) || 'el destino';
    let msg = `Viaje iniciado. Dirigite hacia ${cleanDest}.`;
    if (street && street !== 'Vía principal de Bariloche') {
      msg += ` Avanzá por ${street}.`;
    }
    if (nextManeuver) {
      msg += ` ${nextManeuver}`;
    }
    this.speak(msg);
  }

  // Locución paso a paso de giro o maniobra
  speakTurnByTurn(instruction, distanceMeters = null) {
    if (!instruction) return;
    soundService.playChimeTone();
    let text = instruction;
    if (distanceMeters && distanceMeters > 30) {
      text = `En ${distanceMeters} metros, ${instruction.toLowerCase()}`;
    }
    this.speak(text);
  }

  speakPassengerCancelled() {
    this.speak("Atención. El pasajero canceló la solicitud.");
  }

  speakNewOffer(origin, dest, fare) {
    const cleanOrigin = cleanAddressForSpeech(origin);
    const cleanDest = cleanAddressForSpeech(dest);
    this.speak(`Nuevo viaje disponible. Desde ${cleanOrigin} hacia ${cleanDest}. Tarifa: ${fare} pesos.`);
  }

  speakSearching() {
    this.speak("Buscando choferes cercanos en Bariloche.");
  }

  speakDriverAssigned(driverName, vehicleModel, minutes = 3) {
    this.speak(`Viaje aceptado. Tu chofer ${driverName} viene en camino en un ${vehicleModel}. Tiempo estimado: ${minutes} minutos.`);
  }

  speakOneMinuteAlert() {
    this.speak("¡Atención! Tu chofer está a un minuto de llegar. Salí al punto de encuentro.");
  }

  speakDriverArrived(driverName) {
    this.speak(`Tu chofer ${driverName} ya llegó al punto de encuentro y te está esperando.`);
  }

  speakTripCompleted(amount) {
    this.speak(`Llegaste a destino. El total del viaje es de ${amount} pesos.`);
  }
}

export const voiceService = new VoiceService();
