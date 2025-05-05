/**
 * Utilidades para manejar la API de reconocimiento y síntesis de voz
 */

// Función para precargar las voces del navegador
let voicesLoaded = false;
let availableVoices = [];

// Cargar voces al inicializar
const loadVoices = () => {
  return new Promise((resolve) => {
    if (voicesLoaded) {
      resolve(availableVoices);
      return;
    }

    const loadVoicesWhenAvailable = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length !== 0) {
        availableVoices = voices;
        voicesLoaded = true;
        window.speechSynthesis.onvoiceschanged = null;
        resolve(voices);
      }
    };

    loadVoicesWhenAvailable();

    if (window.speechSynthesis.onvoiceschanged !== undefined && !voicesLoaded) {
      window.speechSynthesis.onvoiceschanged = loadVoicesWhenAvailable;
    }
  });
};

// Inicializar voces inmediatamente
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

// Verifica si el navegador soporta la API de reconocimiento de voz
export const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Verifica si el navegador soporta la API de síntesis de voz
export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// Obtiene instancia de reconocimiento de voz
export const getSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    throw new Error('El navegador no soporta reconocimiento de voz');
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'es-ES';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  return recognition;
};

// Función para hablar texto
export const speakText = async (text, options = {}) => {
  return new Promise(async (resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('El navegador no soporta síntesis de voz'));
      return;
    }

    // Asegurar que las voces estén cargadas
    const voices = await loadVoices();
    
    // Cancelar cualquier habla en curso
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Seleccionar una voz en español si está disponible
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') && voice.localService
    ) || voices.find(voice => 
      voice.lang.includes('es')
    );
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      console.log('Usando voz: ', spanishVoice.name);
    } else {
      console.log('No se encontró voz en español, usando voz predeterminada');
    }
    
    // Configurar opciones
    utterance.lang = options.lang || 'es-ES';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    // Eventos
    utterance.onend = () => {
      clearInterval(resumeSpeechInterval);
      resolve();
    };
    utterance.onerror = (error) => {
      clearInterval(resumeSpeechInterval);
      reject(error);
    };
    
    // Hablar
    console.log('Iniciando síntesis de voz: ', text);
    window.speechSynthesis.speak(utterance);
    
    // Parche para Chrome que a veces detiene la síntesis después de 15 segundos
    const synth = window.speechSynthesis;
    const resumeSpeechInterval = setInterval(() => {
      if (!synth.speaking) {
        clearInterval(resumeSpeechInterval);
        return;
      }
      synth.pause();
      synth.resume();
    }, 10000);
  });
};

// Función para escuchar al usuario
export const listenForSpeech = () => {
  return new Promise((resolve, reject) => {
    try {
      const recognition = getSpeechRecognition();
      
      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        resolve(speechResult);
      };
      
      recognition.onerror = (event) => {
        reject(new Error(`Error en reconocimiento de voz: ${event.error}`));
      };
      
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

// Procesa una respuesta de voz basada en el tipo de pregunta
export const processVoiceResponse = (response, questionType) => {
  const text = response.toLowerCase().trim();
  
  switch (questionType) {
    case 'yesno':
      if (text.includes('sí') || text.includes('si') || text.includes('claro') || 
          text.includes('por supuesto') || text.includes('afirmativo')) {
        return 'Sí';
      } else if (text.includes('no') || text.includes('negativo') || 
                text.includes('nunca') || text.includes('jamás')) {
        return 'No';
      } else {
        return null; // Respuesta inválida
      }
    
    case 'rating':
      // Buscar un número del 1 al 5 en la respuesta
      const ratingMatch = text.match(/\b([1-5])\b/);
      return ratingMatch ? ratingMatch[1] : null;
      
    case 'single':
    case 'multiple':
    case 'open':
    default:
      return text; // Devolver el texto tal cual para otros tipos
  }
};

// Obtener las voces disponibles para la síntesis
export const getAvailableVoices = () => {
  return new Promise((resolve) => {
    // Función para obtener voces
    const getVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };

    // Si las voces ya están disponibles, obtenerlas directamente
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    // Si no, esperar al evento voiceschanged
    window.speechSynthesis.onvoiceschanged = getVoices;
  });
};

// Verificar los permisos de micrófono
export const checkMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Detener todas las pistas de audio para liberar el micrófono
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Error al verificar permisos de micrófono:', error);
    return false;
  }
};
