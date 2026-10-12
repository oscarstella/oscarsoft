// Guía y síntesis de voz en acento argentino natural y pausado (Web Speech API con soporte es-AR)

// Función para acortar direcciones largas de Bariloche y evitar lectura robótica
function cleanAddressForSpeech(address) {
  if (!address) return '';
  return address
    .replace(/,?\s*(?:San Carlos de )?Bariloche/gi, '')
    .replace(/,?\s*Río Negro/gi, '')
    .replace(/,?\s*Argentina/gi, '')
    .replace(/,?\s*CP\s*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class VoiceService {
  constructor() {
    this.enabled = true;
    this.voicesLoaded = false;
    this.arVoice = null;
    this.initVoices();
  }

  initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;

          // 1. Prioridad absoluta: Voz Argentina nativa (es-AR / es_AR o 'Diego', 'Isabela', 'Argentina')
          let selected = voices.find(v => 
            (v.lang === 'es-AR' || v.lang === 'es_AR') ||
            (v.name.toLowerCase().includes('argentina') || v.name.toLowerCase().includes('diego') || v.name.toLowerCase().includes('isabela'))
          );

          // 2. Segunda prioridad: Voz Latinoamericana suave (Google español, es-419, es-US, es-MX, Paulina, Sofia, Sabina)
          if (!selected) {
            selected = voices.find(v => 
              (v.lang === 'es-419' || v.lang === 'es-US' || v.lang === 'es-MX' || v.lang === 'es-UY' || v.lang === 'es-CL') ||
              (v.name.toLowerCase().includes('google español') || v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('sofia'))
            );
          }

          // 3. Fallback general: Cualquier voz en español que NO sea de España (evita acento ibérico)
          if (!selected) {
            selected = voices.find(v => 
              v.lang.startsWith('es') && 
              !v.lang.includes('ES') && 
              !v.name.toLowerCase().includes('spain') && 
              !v.name.toLowerCase().includes('españa')
            );
          }

          // 4. Último fallback
          if (!selected) {
            selected = voices.find(v => v.lang.startsWith('es'));
          }

          this.arVoice = selected;
        }
      };

      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
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
      window.speechSynthesis.cancel();
    }
  }

  speak(text) {
    if (!this.enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      // Cadencia más pausada, cálida y natural (0.86 evita que suene acelerada o robótica)
      utterance.rate = 0.86;
      utterance.pitch = 0.96;

      // Buscar voz actualizada si no estaba lista
      if (!this.arVoice) {
        this.initVoices();
      }
      if (this.arVoice) {
        utterance.voice = this.arVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Browser voice exception
    }
  }

  // Locución cuando un pasajero cancela
  speakPassengerCancelled() {
    this.speak("El pasajero canceló la solicitud.");
  }

  // Locución de nueva oferta entrante para chofer
  speakNewOffer(origin, dest, fare) {
    const cleanOrigin = cleanAddressForSpeech(origin);
    const cleanDest = cleanAddressForSpeech(dest);
    this.speak(`Tenés un nuevo viaje. Desde ${cleanOrigin} hacia ${cleanDest}. Tarifa: ${fare} pesos.`);
  }

  speakSearching() {
    this.speak("Buscando choferes disponibles en Bariloche.");
  }

  speakDriverAssigned(driverName, vehicleModel, minutes) {
    this.speak(`Viaje aceptado. Tu chofer ${driverName} viene en camino en un ${vehicleModel}. Llega en unos ${minutes} minutos.`);
  }

  speakOneMinuteAlert() {
    this.speak("¡Atención! Tu auto está a 1 minuto de llegar. Salí a su encuentro.");
  }

  speakDriverArrived(driverName) {
    this.speak(`Tu chofer ${driverName} ya está en el punto de encuentro esperándote.`);
  }

  speakTripStarted(destAddress) {
    const cleanDest = cleanAddressForSpeech(destAddress);
    this.speak(`Viaje iniciado con destino a ${cleanDest}. Conducí con precaución.`);
  }

  speakTripCompleted(amount) {
    this.speak(`Llegaste a destino. El total a cobrar es de ${amount} pesos.`);
  }

  speakTurnByTurn(instruction) {
    this.speak(instruction);
  }
}

export const voiceService = new VoiceService();
