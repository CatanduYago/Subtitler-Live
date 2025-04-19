const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const stopCaptureButton = document.getElementById('stopCaptureButton');
const transcriptionsContainer = document.getElementById('transcriptions');

let audioContext;
let mediaStream;
let isRecording = false;
let audioChunks = [];
let audioInterval;
let languageManager;

// Inicializar el gestor de idiomas
document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
    languageManager.init();
});

// Función para obtener el formato de audio soportado
function getSupportedMimeType() {
    // AWS Transcribe soporta: mp3, mp4, wav, flac, ogg, amr, webm
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
stopButton.addEventListener('click', stopCapture);
stopCaptureButton.addEventListener('click', stopCapture);

async function startCapture() {
    try {
        console.log('Solicitando captura de pantalla...');
        
        // Iniciar animación de fade out del contenedor principal
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.classList.add('fade-out');
        document.body.classList.add('video-active');
        
        // Esperar a que termine la animación
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mostrar el videoContainer con animación
        const videoContainer = document.getElementById('videoContainer');
        videoContainer.classList.add('active');
        
        // Actualizar texto del botón de detener según el idioma
        const lang = languageManager.translations[languageManager.getCurrentLanguage()];
        stopCaptureButton.textContent = lang.stopCapture;
        
        // Solicitar captura de pantalla con audio de la pestaña
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
        
        const videoElement = document.getElementById('sharedVideo');
        videoElement.srcObject = mediaStream;
        
        console.log('Stream obtenido:', mediaStream);
        
        // Verificar que el stream tiene audio
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error('No se detectó audio en la pestaña compartida. Asegúrate de seleccionar "Compartir audio" al compartir la pantalla.');
        }
        
        console.log('Tracks de audio detectados:', audioTracks.length);
        
        // Crear AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(mediaStream);
        
        // Crear ScriptProcessor para capturar el audio
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const buffer = new Int16Array(inputData.length);
            
            for (let i = 0; i < inputData.length; i++) {
                buffer[i] = Math.min(1, Math.max(-1, inputData[i])) * 0x7FFF;
            }
            
            audioChunks.push(buffer);
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        console.log('Captura de audio iniciada');
        isRecording = true;
        updateUI();
        
        // Enviar audio cada 5 segundos
        audioInterval = setInterval(async () => {
            if (audioChunks.length > 0) {
                try {
                    // Convertir los chunks de audio a WAV
                    const wavBlob = createWavBlob(audioChunks);
                    audioChunks = []; // Limpiar los chunks después de usarlos
                    
                    console.log('Tamaño del blob de audio:', wavBlob.size, 'bytes');
                    const base64Audio = await blobToBase64(wavBlob);
                    
                    console.log('Enviando audio a Transcribe...');
                    const response = await fetch('http://localhost:3000/transcribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            audio: base64Audio,
                            format: 'wav'
                        })
                    });
                    
                    console.log('Respuesta del servidor:', response.status);
                    const data = await response.json();
                    
                    if (data.transcription) {
                        console.log('Transcripción recibida:', data.transcription);
                        addTranscription(data.transcription);
                    } else {
                        console.error('Error en la transcripción:', data.error);
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
        alert('Error al iniciar la captura: ' + error.message);
    }
}

function stopCapture() {
    if (isRecording) {
        console.log('Deteniendo captura...');
        
        // Ocultar el videoContainer con animación
        const videoContainer = document.getElementById('videoContainer');
        videoContainer.classList.remove('active');
        
        // Restaurar el contenedor principal
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

function updateUI() {
    startButton.style.display = isRecording ? 'none' : 'block';
    stopButton.style.display = isRecording ? 'block' : 'none';
}

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

function createWavBlob(audioChunks) {
    const buffer = new Int16Array(audioChunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    
    for (const chunk of audioChunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }
    
    // Crear encabezado WAV
    const wavHeader = new Uint8Array(44);
    const view = new DataView(wavHeader.buffer);
    
    // Encabezado WAV
    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, 36 + buffer.length * 2, true); // Tamaño del archivo
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true); // Longitud del formato
    view.setUint16(20, 1, true); // Formato PCM
    view.setUint16(22, 1, true); // Canales mono
    view.setUint32(24, 44100, true); // Frecuencia de muestreo
    view.setUint32(28, 44100 * 2, true); // Bytes por segundo
    view.setUint16(32, 2, true); // Bytes por muestra
    view.setUint16(34, 16, true); // Bits por muestra
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, buffer.length * 2, true); // Tamaño de los datos
    
    // Combinar encabezado y datos
    const wavData = new Uint8Array(wavHeader.length + buffer.length * 2);
    wavData.set(wavHeader);
    wavData.set(new Uint8Array(buffer.buffer), wavHeader.length);
    
    return new Blob([wavData], { type: 'audio/wav' });
}

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

// Detener la captura si el usuario cierra la pestaña
window.addEventListener('beforeunload', () => {
    if (isRecording) {
        stopCapture();
    }
}); 