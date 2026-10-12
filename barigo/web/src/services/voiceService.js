// Guía y síntesis de voz en acento argentino natural con cadencia GPS fluida (Google Maps / Waze / Uber)
import { soundService } from './soundService';

// Función para acortar y humanizar direcciones de Bariloche para locución fluida
export function cleanAddressForSpeech(address) {
  if (!address) return '';
  return String(address)
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
        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            this.voicesLoaded = true;
            this.cachedVoice = this.findBestNaturalVoice(voices);
          }
        } catch {}
      };

      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
  }

  // Desbloqueo seguro del sintetizador del navegador
  unlockAudio() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {}
  }

  // Selección rigurosa de la mejor voz natural en español
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

    const cleanText = String(text).trim();
    if (!cleanText) return;

    try {
      const synth = window.speechSynthesis;
      if (synth.paused) {
        synth.resume();
      }

      if (options.interrupt) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-AR';
      utterance.rate = options.rate || 0.92;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = 1.0;

      const voice = this.cachedVoice || this.findBestNaturalVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Chromium watchdog en locuciones largas
      const timer = setInterval(() => {
        if (!synth.speaking) {
          clearInterval(timer);
        } else {
          synth.resume();
        }
      }, 2500);

      utterance.onend = () => clearInterval(timer);
      utterance.onerror = (err) => {
        clearInterval(timer);
        console.warn('[VoiceService] Utterance error:', err);
      };

      // Invocación síncrona sin setTimeout para preservar el contexto de gesto en móviles
      synth.speak(utterance);
    } catch (e) {
      console.warn('[VoiceService] Error:', e);
    }
  }

  // --- LOCUCIONES ESPECÍFICAS DE GPS DE CHOFER ---

  // Locución inicial al aceptar viaje hacia el pasajero
  speakAcceptAndStartToPickup(origin, street, nextManeuver = '') {
    const cleanOrigin = cleanAddressForSpeech(origin) || 'el punto de encuentro';
    const streetMsg = street ? `por ${cleanAddressForSpeech(street)}` : '';
    const maneuverMsg = nextManeuver ? ` ${nextManeuver}` : '';
    this.speak(`Viaje aceptado. Dirigite a buscar al pasajero en ${cleanOrigin} ${streetMsg}.${maneuverMsg}`);
  }

  // Locución al iniciar viaje hacia destino con pasajero a bordo
  speakStartTripToDestination(dest, street, nextManeuver = '') {
    const cleanDest = cleanAddressForSpeech(dest) || 'el destino';
    const streetMsg = street ? `por ${cleanAddressForSpeech(street)}` : '';
    const maneuverMsg = nextManeuver ? ` ${nextManeuver}` : '';
    this.speak(`Iniciando viaje hacia ${cleanDest} ${streetMsg}.${maneuverMsg} Conducí con precaución.`);
  }

  // Locución paso a paso de giro o maniobra
  speakTurnByTurn(instruction, distanceMeters = null) {
    if (!instruction) return;
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

  speakTripStarted(dest) {
    const cleanDest = cleanAddressForSpeech(dest) || 'tu destino';
    this.speak(`Viaje en curso hacia ${cleanDest}. Conducí con precaución.`);
  }

  speakTripCompleted(amount) {
    this.speak(`Llegaste a destino. El total del viaje es de ${amount} pesos.`);
  }
}

export const voiceService = new VoiceService();
