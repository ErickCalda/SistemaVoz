import React, { useState } from 'react';

/**
 * Componente simple para síntesis de voz, usando el mismo enfoque
 * que el ejemplo HTML que funciona correctamente
 */
const SimpleVoice = ({ text, onSpeakEnd }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = () => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis no está disponible en este navegador");
      return;
    }
    
    // Cancelar cualquier síntesis anterior
    window.speechSynthesis.cancel();
    
    // Crear un nuevo utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Configurar eventos
    setIsSpeaking(true);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onSpeakEnd) {
        onSpeakEnd();
      }
    };
    
    utterance.onerror = (error) => {
      console.error("Error en síntesis de voz:", error);
      setIsSpeaking(false);
    };
    
    // Llamar a speak directamente, como en el ejemplo HTML que funciona
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="my-2">
      <button 
        onClick={speak}
        disabled={isSpeaking}
        className={`btn ${isSpeaking ? 'btn-secondary' : 'btn-primary'}`}
      >
        {isSpeaking ? "Hablando..." : "Leer en voz alta"}
      </button>
    </div>
  );
};

export default SimpleVoice;
