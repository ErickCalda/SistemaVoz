import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  listenForSpeech,
  processVoiceResponse,
  checkMicrophonePermission
} from '../utils/voiceSurveyAPI';
import SimpleVoice from '../components/SimpleVoice';

const TakeSurvey = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, name, questions, thanks
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [responses, setResponses] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);
  const [microphonePermission, setMicrophonePermission] = useState(null);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  // Comprobar compatibilidad del navegador y permisos
  useEffect(() => {
    const checkCompatibility = async () => {
      // Verificar si el navegador soporta reconocimiento de voz
      const speechRecognitionSupported = isSpeechRecognitionSupported();
      const speechSynthesisSupported = isSpeechSynthesisSupported();

      if (!speechRecognitionSupported || !speechSynthesisSupported) {
        setBrowserSupported(false);
        setErrorMessage('Su navegador no soporta las tecnologías de voz necesarias para esta encuesta. Por favor, use Chrome, Edge o Safari.');
        return;
      }

      // Verificar permisos de micrófono
      const hasMicrophonePermission = await checkMicrophonePermission();
      setMicrophonePermission(hasMicrophonePermission);

      if (!hasMicrophonePermission) {
        setErrorMessage('Necesitamos permiso para usar su micrófono. Por favor, permita el acceso cuando se le solicite.');
      }
    };

    checkCompatibility();
  }, []);

  // Obtener datos de la encuesta
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        console.log(`Intentando cargar la encuesta con ID: ${surveyId}`);
        
        // Usar el endpoint público para la encuesta
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/surveys/public/${surveyId}`);
        
        if (response.data) {
          console.log('Encuesta cargada exitosamente:', response.data);
          setSurvey(response.data);
          // Inicializar array de respuestas
          setResponses(response.data.questions.map(() => ({ value: '', timestamp: null })));
        } else {
          console.error('La respuesta no contiene datos');
          setErrorMessage('La encuesta no contiene datos válidos.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching survey:', error);
        
        // Mensajes de error más específicos
        if (error.response) {
          // El servidor respondió con un código de error
          if (error.response.status === 404) {
            setErrorMessage('Encuesta no encontrada. El ID proporcionado no corresponde a ninguna encuesta existente.');
          } else if (error.response.status === 403) {
            setErrorMessage('Esta encuesta ya no está activa o no es pública.');
          } else {
            setErrorMessage(`Error del servidor: ${error.response.data.message || 'Error desconocido'}`);
          }
        } else if (error.request) {
          // La solicitud se hizo pero no se recibió respuesta
          setErrorMessage('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        } else {
          // Error al configurar la solicitud
          setErrorMessage(`Error al intentar cargar la encuesta: ${error.message}`);
        }
        
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  // Función para cuando termina de hablar la pregunta
  const onQuestionSpeakEnd = () => {
    setTimeout(startListening, 500);
  };

  // Función para cuando termina de hablar el mensaje de agradecimiento
  const onThankYouSpeakEnd = async () => {
    try {
      // Enviar respuestas al servidor
      await submitResponses();
    } catch (error) {
      console.error('Error submitting responses:', error);
    }
  };

  // Función para enviar respuestas al servidor
  const submitResponses = async () => {
    try {
      // Transformar respuestas al formato del servidor
      const formattedResponses = responses.map((response, index) => ({
        questionId: survey.questions[index]._id,
        value: response.value,
        timestamp: response.timestamp
      }));

      // Enviar a la API
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/responses`, {
        surveyId: survey._id,
        respondentName: userName,
        answers: formattedResponses,
        userAgent: navigator.userAgent,
        completed: true
      });

      console.log('Respuestas enviadas correctamente');
    } catch (error) {
      console.error('Error enviando respuestas:', error);
    }
  };

  // Función para iniciar escucha
  const startListening = async () => {
    if (isListening) return;

    setErrorMessage('');
    setTranscript('');
    setIsListening(true);

    try {
      const speechResult = await listenForSpeech();
      setTranscript(speechResult);
      processResponse(speechResult);
    } catch (error) {
      console.error('Error en reconocimiento de voz:', error);
      setIsListening(false);
      setErrorMessage('Error en el reconocimiento de voz. Por favor, intente nuevamente.');
    }
  };

  // Función para procesar la respuesta del usuario
  const processResponse = (text) => {
    if (!text) return;

    setIsListening(false);

    if (currentStep === 'name') {
      setUserName(text);
      // En lugar de síntesis automática, mostramos el mensaje y usamos SimpleVoice
      const welcomeMessage = `Gracias, ${text}. Vamos a empezar con la encuesta "${survey.title}".`;
      setTranscript(welcomeMessage);
      setTimeout(() => {
        setCurrentStep('questions');
      }, 1500);
    } else if (currentStep === 'questions') {
      const currentQuestion = survey.questions[currentQuestionIndex];

      // Procesar respuesta según el tipo de pregunta
      if (currentQuestion.type === 'rating') {
        // Extraer número de la respuesta
        const processedResponse = processVoiceResponse(text, 'rating');
        if (processedResponse) {
          saveResponse(processedResponse);
        } else {
          setErrorMessage('Por favor, responda con un número del 1 al 5.');
          setTimeout(startListening, 1000);
        }
      } else if (currentQuestion.type === 'yesno') {
        // Verificar si la respuesta es sí o no
        const processedResponse = processVoiceResponse(text, 'yesno');
        if (processedResponse) {
          saveResponse(processedResponse);
        } else {
          setErrorMessage('Por favor, responda con sí o no.');
          setTimeout(startListening, 1000);
        }
      } else {
        // Pregunta abierta
        saveResponse(text);
      }
    }
  };

  // Función para guardar respuesta y pasar a la siguiente pregunta
  const saveResponse = (value) => {
    const updatedResponses = [...responses];
    updatedResponses[currentQuestionIndex] = {
      value,
      timestamp: new Date().toISOString()
    };
    setResponses(updatedResponses);

    // Verificar si hay más preguntas
    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Fin de la encuesta
      setCurrentStep('thanks');
    }
  };

  // Manejar clic en botón de micrófono
  const handleMicrophoneClick = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      startListening();
    }
  };

  // Manejar clic en botones de opciones 
  const handleOptionClick = (value) => {
    if (isListening) return;

    processResponse(value);
  };

  // Solicitar permisos de micrófono
  const requestMicrophonePermission = async () => {
    try {
      const permission = await checkMicrophonePermission();
      setMicrophonePermission(permission);

      if (permission) {
        // Iniciar la encuesta si se conceden los permisos
        setCurrentStep('welcome');
      } else {
        setErrorMessage('No se pudo obtener permiso para el micrófono. Por favor, permita el acceso en la configuración de su navegador.');
      }
    } catch (error) {
      console.error('Error al solicitar permisos de micrófono:', error);
      setErrorMessage('Error al solicitar permisos de micrófono.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="card text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Encuesta no encontrada</h3>
        <p className="text-gray-600 mb-6">La encuesta que estás buscando no existe o ha sido eliminada.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (!browserSupported) {
    return (
      <div className="card text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-orange-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Navegador no compatible</h3>
        <p className="text-gray-600 mb-6">
          Esta aplicación requiere un navegador compatible con la API de Reconocimiento de Voz.
          Por favor, utilice Chrome, Edge o Safari para continuar.
        </p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Intentar Nuevamente
        </button>
      </div>
    );
  }

  if (microphonePermission === false) {
    return (
      <div className="card text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-orange-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Permiso de Micrófono Requerido</h3>
        <p className="text-gray-600 mb-6">
          Para participar en esta encuesta por voz, necesitamos permiso para usar su micrófono.
          Por favor, haga clic en el botón debajo para conceder acceso.
        </p>
        <button onClick={requestMicrophonePermission} className="btn btn-primary">
          Permitir Micrófono
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="card mb-6">
        <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
        {survey.description && <p className="text-gray-600 mb-6">{survey.description}</p>}

        {/* Mostrar mensaje de error si existe */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
            <button
              onClick={() => setErrorMessage('')}
              className="float-right font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Mostrar estado actual */}
        <div className="mb-8">
          {currentStep === 'welcome' && (
            <div>
              <div className="text-lg mb-4">Mensaje de bienvenida:</div>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                {survey.welcomeMessage}
              </div>
              <SimpleVoice
                text={survey.welcomeMessage}
                onSpeakEnd={() => {
                  setTimeout(() => setCurrentStep('name'), 500);
                }}
              />
              <button
                onClick={() => setCurrentStep('name')}
                className="btn btn-outline mt-2"
              >
                Continuar sin audio
              </button>
            </div>
          )}

          {currentStep === 'name' && (
            <div>
              <div className="text-lg mb-4">¿Podría decirme su nombre, por favor?</div>
              <SimpleVoice
                text="¿Podría decirme su nombre, por favor?"
                onSpeakEnd={startListening}
              />
              <button
                onClick={handleMicrophoneClick}
                className={`btn ${isListening ? 'btn-red-500' : 'btn-primary'} mt-4`}
              >
                {isListening ? 'Detener micrófono' : 'Activar micrófono'}
              </button>
            </div>
          )}

          {currentStep === 'questions' && survey.questions[currentQuestionIndex] && (
            <div>
              <div className="text-sm text-gray-500 mb-2">
                Pregunta {currentQuestionIndex + 1} de {survey.questions.length}
              </div>
              <div className="text-lg font-medium mb-4">
                {survey.questions[currentQuestionIndex].text}
              </div>

              <SimpleVoice
                text={survey.questions[currentQuestionIndex].text}
                onSpeakEnd={onQuestionSpeakEnd}
              />

              {survey.questions[currentQuestionIndex].type === 'rating' && (
                <div className="flex justify-center space-x-2 mb-4 mt-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      className="w-12 h-12 rounded-full bg-gray-200 hover:bg-primary-100 flex items-center justify-center font-medium text-gray-800"
                      onClick={() => handleOptionClick(num.toString())}
                      disabled={isListening}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              {survey.questions[currentQuestionIndex].type === 'yesno' && (
                <div className="flex justify-center space-x-4 mb-4 mt-4">
                  <button
                    className="btn btn-outline px-8"
                    onClick={() => handleOptionClick('No')}
                    disabled={isListening}
                  >
                    No
                  </button>
                  <button
                    className="btn btn-primary px-8"
                    onClick={() => handleOptionClick('Sí')}
                    disabled={isListening}
                  >
                    Sí
                  </button>
                </div>
              )}

              {/* Para preguntas de selección múltiple */}
              {survey.questions[currentQuestionIndex].type === 'single' &&
                survey.questions[currentQuestionIndex].options && (
                  <div className="flex flex-col space-y-2 mb-4 mt-4">
                    {survey.questions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        className="btn btn-outline w-full text-left px-4 py-2"
                        onClick={() => handleOptionClick(option)}
                        disabled={isListening}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

              {/* Botón de micrófono */}
              <button
                className={`w-16 h-16 mx-auto mt-4 rounded-full flex items-center justify-center transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
                onClick={handleMicrophoneClick}
                title={isListening ? 'Detener grabación' : 'Iniciar grabación'}
              >
                {isListening ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          {currentStep === 'thanks' && (
            <div>
              <div className="text-lg mb-4">{survey.farewell}</div>
              <SimpleVoice
                text={survey.farewell}
                onSpeakEnd={onThankYouSpeakEnd}
              />
            </div>
          )}
        </div>

        {/* Mostrar transcripción */}
        {transcript && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="text-sm text-gray-500 mb-1">Tu respuesta:</div>
            <div className="text-lg">{transcript}</div>
          </div>
        )}

        {/* Indicadores de progreso */}
        {currentStep === 'questions' && (
          <div className="mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full"
                style={{ width: `${((currentQuestionIndex) / survey.questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {currentQuestionIndex} de {survey.questions.length} preguntas completadas
            </div>
          </div>
        )}

        {/* Acciones finales */}
        {currentStep === 'thanks' && (
          <div className="mt-6 space-y-4">
            <p className="text-green-600">Sus respuestas han sido guardadas correctamente.</p>
            <button
              onClick={() => navigate('/surveys/public')}
              className="btn btn-primary"
            >
              Ver Otras Encuestas
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-outline block mx-auto mt-2"
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <h3 className="font-medium mb-2">Instrucciones:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Haga clic en el botón "Leer en voz alta" para escuchar las preguntas</li>
          <li>Haga clic en el botón del micrófono para comenzar a hablar</li>
          <li>Responda claramente a las preguntas cuando se le indique</li>
          <li>Para preguntas de calificación, responda con un número del 1 al 5</li>
          <li>Para preguntas de sí/no, responda con "sí" o "no"</li>
          <li>También puede usar los botones en pantalla para responder</li>
        </ul>
      </div>
    </div>
  );
};

export default TakeSurvey;
