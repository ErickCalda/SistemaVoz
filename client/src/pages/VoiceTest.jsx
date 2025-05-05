import React, { useState } from 'react';

const VoiceTest = () => {
  const [text, setText] = useState('Hola, esta es una prueba de voz simple. Si puedes escuchar esto, la síntesis de voz está funcionando correctamente.');

  // Función exactamente igual que en el ejemplo HTML que funciona
  const leerTexto = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Español
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Prueba Simple de Síntesis de Voz</h1>
      
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Versión Exacta del Ejemplo HTML</h2>
        
        <textarea 
          id="texto" 
          rows="5" 
          cols="40" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Escribe aquí el texto..."
        />
        <br/>
        
        <button 
          onClick={leerTexto}
          className="btn btn-primary mb-4"
        >
          Leer en voz alta (Versión Simple)
        </button>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
          <p className="text-blue-700">
            Esta versión usa <strong>exactamente</strong> el mismo código que el ejemplo HTML que funciona en Chrome.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceTest;
