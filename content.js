// Verificar si ya existe el contenedor de subtítulos
let subtitleContainer = document.getElementById('live-subtitles-container');
if (!subtitleContainer) {
  subtitleContainer = document.createElement('div');
  subtitleContainer.id = 'live-subtitles-container';
  subtitleContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    max-width: 80%;
    text-align: center;
    z-index: 9999;
  `;
  document.body.appendChild(subtitleContainer);
}

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Función para limpiar recursos
function cleanup() {
  console.log('Limpiando recursos...');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (mediaRecorder && mediaRecorder.stream) {
    mediaRecorder.stream.getTracks().forEach(track => {
      console.log('Deteniendo track:', track.label);
      track.stop();
    });
  }
  mediaRecorder = null;
  audioChunks = [];
  isRecording = false;
  subtitleContainer.textContent = '';
  console.log('Recursos limpiados');
}

// Función para iniciar la grabación
async function startRecording() {
  if (isRecording) {
    console.log('Ya hay una grabación en progreso');
    return;
  }
  console.log('Iniciando grabación...');
  
  try {
    // Solicitar permiso para capturar la pestaña
    console.log('Solicitando permiso para capturar audio...');
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser'
      },
      audio: true
    });
    console.log('Stream de audio obtenido:', stream);

    // Obtener solo la pista de audio
    const audioStream = new MediaStream(stream.getAudioTracks());
    console.log('Pistas de audio:', audioStream.getAudioTracks());
    
    // Obtener la configuración de audio
    const audioTrack = audioStream.getAudioTracks()[0];
    const audioSettings = audioTrack.getSettings();
    const sampleRate = audioSettings.sampleRate || 48000; // Valor predeterminado si no se puede detectar
    console.log('Tasa de muestreo detectada:', sampleRate);
    
    // Configurar el MediaRecorder
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: sampleRate
    };
    
    try {
      mediaRecorder = new MediaRecorder(audioStream, options);
    } catch (e) {
      console.log('No se pudo usar audio/webm, intentando con audio/wav');
      mediaRecorder = new MediaRecorder(audioStream);
    }
    
    audioChunks = [];

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        console.log('Datos de audio recibidos:', event.data.size, 'bytes');
        audioChunks.push(event.data);
        
        // Procesar el audio cada 5 segundos
        if (audioChunks.length >= 5) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          console.log('Procesando fragmento de audio:', audioBlob.size, 'bytes');
          
          if (audioBlob.size >= 2000) {
            try {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1];
                console.log('Audio convertido a base64, tamaño:', base64Audio.length, 'caracteres');
                
                try {
                  const response = await fetch('http://localhost:3000/transcribe', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      audioData: base64Audio,
                      format: 'wav',
                      sampleRate: sampleRate
                    }),
                  });
                  
                  console.log('Estado de la respuesta:', response.status);
                  const data = await response.json();
                  console.log('Respuesta completa del servidor:', data);
                  
                  if (data.transcript) {
                    console.log('Transcripción recibida:', data.transcript);
                    subtitleContainer.textContent = data.transcript;
                  } else if (data.error) {
                    console.error('Error en la transcripción:', data.error);
                    subtitleContainer.textContent = 'Error: ' + data.error;
                  }
                } catch (error) {
                  console.error('Error al enviar audio al servidor:', error);
                  subtitleContainer.textContent = 'Error al conectar con el servidor';
                }
              };
            } catch (error) {
              console.error('Error en la transcripción:', error);
              subtitleContainer.textContent = 'Error al procesar el audio';
            }
          }
          // Limpiar los chunks procesados
          audioChunks = [];
        }
      }
    };

    mediaRecorder.onstop = () => {
      console.log('Grabación detenida');
      cleanup();
    };

    // Iniciar la grabación con intervalos de 1 segundo
    mediaRecorder.start(1000);
    isRecording = true;
    console.log('Grabación iniciada correctamente');
  } catch (error) {
    console.error('Error al iniciar la grabación:', error);
    cleanup();
  }
}

// Función para detener la grabación
function stopRecording() {
  if (mediaRecorder && isRecording) {
    console.log('Deteniendo grabación...');
    mediaRecorder.stop();
    cleanup();
  } else {
    console.log('No hay grabación activa para detener');
  }
}

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensaje recibido:', request);
  if (request.action === "start") {
    console.log('Iniciando grabación desde mensaje...');
    startRecording();
  } else if (request.action === "stop") {
    console.log('Deteniendo grabación desde mensaje...');
    stopRecording();
  }
});

// Limpiar recursos cuando se cierra la pestaña
window.addEventListener('beforeunload', () => {
  cleanup();
});
