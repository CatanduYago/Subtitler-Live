// Obtenemos los elementos del DOM necesarios para el control de la interfaz
const startButton = document.getElementById('startButton');
const stopCaptureButton = document.getElementById('stopCaptureButton');
const transcriptionsContainer = document.getElementById('transcriptions');
const transcriptions = document.getElementById('transcriptions');

let audioContext;
let mediaStream;
let isRecording = false;
let audioChunks = [];
let audioInterval;
let languageManager;

// Esperamos a que el DOM cargue para inicializar el gestor de idiomas
document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
    languageManager.init();
});

// Devuelve el primer formato de audio soportado por el navegador para MediaRecorder
function getSupportedMimeType() {
    const types = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/wav',
        'audio/webm'
    ];

    for (let type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            console.log('Formato soportado:', type);
            return type;
        }
    }
    return null;
}

startButton.addEventListener('click', startCapture);
stopCaptureButton.addEventListener('click', stopCapture);

async function startCapture() {
    try {
        console.log('Solicitando captura de pantalla...');

        // Aplicamos animación de desvanecimiento al contenedor principal
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.classList.add('fade-out');
        document.body.classList.add('video-active');

        // Esperamos 500ms para que termine la animación
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mostramos el contenedor del video compartido
        const videoContainer = document.getElementById('videoContainer');
        videoContainer.classList.add('active');

        // Actualizamos el texto del botón de detener según el idioma actual
        const lang = languageManager.translations[languageManager.getCurrentLanguage()];
        stopCaptureButton.textContent = lang.stopCapture;

        // Solicitamos al navegador la captura de pantalla con audio de pestaña
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always"
            },
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                suppressLocalAudioPlayback: false
            }
        });

        // Asignamos el stream de pantalla al elemento de video
        const videoElement = document.getElementById('sharedVideo');
        videoElement.srcObject = mediaStream;

        // Verificamos que el stream contiene pistas de audio
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error('No se detectó audio en la pestaña compartida. Asegúrate de seleccionar "Compartir audio" al compartir la pantalla.');
        }

        // Creamos un contexto de audio para procesar el sonido
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(mediaStream);

        // Creamos un procesador de audio para capturar muestras del stream
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        // Capturamos el audio del canal y lo convertimos a Int16Array
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const buffer = new Int16Array(inputData.length);

            for (let i = 0; i < inputData.length; i++) {
                buffer[i] = Math.min(1, Math.max(-1, inputData[i])) * 0x7FFF;
            }

            audioChunks.push(buffer);
        };

        // Conectamos el flujo de audio al procesador
        source.connect(processor);
        processor.connect(audioContext.destination);

        isRecording = true;

        // Enviamos fragmentos de audio cada 5 segundos
        audioInterval = setInterval(async () => {
            if (audioChunks.length > 0) {
                try {
                    // Convertimos los fragmentos a un blob WAV
                    const wavBlob = createWavBlob(audioChunks);
                    audioChunks = []; // Limpiamos el buffer tras convertir

                    const base64Audio = await blobToBase64(wavBlob);

                    // Enviamos el audio codificado a la API de transcripción
                    const response = await fetch('https://transcribe.catanduyago.duckdns.org/transcribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            audio: base64Audio,
                            format: 'wav'
                        })
                    });

                    const data = await response.json();

                    if (data.transcription) {
                        addTranscription(data.transcription);
                    } else {
                        addTranscription('Error: ' + data.error);
                    }
                } catch (error) {
                    console.error('Error al procesar el audio:', error);
                    addTranscription('Error al procesar el audio: ' + error.message);
                }
            }
        }, 5000);

    } catch (error) {
        console.error('Error al iniciar la captura:', error);

        // Deshacer cambios visuales si hubo error al capturar
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.classList.remove('fade-out');
        document.body.classList.remove('video-active');
        document.getElementById('videoContainer').classList.remove('active');

        alert('Error al iniciar la captura: ' + error.message);
    }
}

function stopCapture() {
    if (isRecording) {
        console.log('Deteniendo captura...');

        // Ocultamos el video compartido y restauramos la vista principal
        const videoContainer = document.getElementById('videoContainer');
        videoContainer.classList.remove('active');
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.classList.remove('fade-out');
        document.body.classList.remove('video-active');

        if (audioInterval) {
            clearInterval(audioInterval);
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
        isRecording = false;
        updateUI();
    }
}

// Cambia la visibilidad de los botones según el estado de grabación
function updateUI() {
    startButton.style.display = isRecording ? 'none' : 'block';
}

// Convierte un Blob de audio a base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Construye un blob de audio en formato WAV a partir de los fragmentos capturados
function createWavBlob(audioChunks) {
    const buffer = new Int16Array(audioChunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;

    for (const chunk of audioChunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }

    // Creamos el encabezado WAV manualmente
    const wavHeader = new Uint8Array(44);
    const view = new DataView(wavHeader.buffer);

    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, 36 + buffer.length * 2, true);
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true); // Tamaño del subchunk
    view.setUint16(20, 1, true); // Formato PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, 44100, true); // Frecuencia de muestreo
    view.setUint32(28, 44100 * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Bloque de alineación
    view.setUint16(34, 16, true); // Bits por muestra
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, buffer.length * 2, true);

    const wavData = new Uint8Array(wavHeader.length + buffer.length * 2);
    wavData.set(wavHeader);
    wavData.set(new Uint8Array(buffer.buffer), wavHeader.length);

    return new Blob([wavData], {type: 'audio/wav'});
}

// Agrega una nueva transcripción al contenedor visual
function addTranscription(text) {
    const transcriptionItem = document.createElement('div');
    transcriptionItem.className = 'transcription-item';

    const textElement = document.createElement('div');
    textElement.className = 'transcription-text';
    textElement.textContent = text;

    transcriptionItem.appendChild(textElement);
    transcriptionsContainer.appendChild(transcriptionItem);
    transcriptionsContainer.scrollTop = transcriptionsContainer.scrollHeight;
}

// Detenemos la grabación si el usuario cierra o recarga la pestaña
window.addEventListener('beforeunload', () => {
    if (isRecording) {
        stopCapture();
    }
});

// Hacemos que el contenedor de transcripciones sea arrastrable con el ratón
transcriptions.addEventListener('mousedown', e => {
    const offsetX = e.clientX - transcriptions.offsetLeft;
    const offsetY = e.clientY - transcriptions.offsetTop;

    function onMouseMove(eMove) {
        transcriptions.style.left = `${eMove.clientX - offsetX}px`;
        transcriptions.style.top = `${eMove.clientY - offsetY}px`;
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

// Controles de estilo de subtítulos
const subtitleColor = document.getElementById('subtitleColor');
const subtitleFont = document.getElementById('subtitleFont');
const subtitleSize = document.getElementById('subtitleSize');
const sizeValue = document.getElementById('sizeValue');

function updateSubtitleStyles() {
  const transcriptions = document.getElementById('transcriptions');
  transcriptions.style.color = subtitleColor.value;
  transcriptions.style.fontFamily = subtitleFont.value;
  transcriptions.style.fontSize = `${subtitleSize.value}px`;
}

subtitleColor.addEventListener('input', updateSubtitleStyles);
subtitleFont.addEventListener('change', updateSubtitleStyles);
subtitleSize.addEventListener('input', (e) => {
  sizeValue.textContent = `${e.target.value}px`;
  updateSubtitleStyles();
});

// Control del desplegable de controles
const toggleControlsBtn = document.getElementById('toggleControls');
const subtitleControls = document.querySelector('.subtitle-controls');

toggleControlsBtn.addEventListener('click', () => {
  subtitleControls.classList.toggle('active');
});

// Cerrar el desplegable al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.subtitle-controls-wrapper')) {
    subtitleControls.classList.remove('active');
  }
});
