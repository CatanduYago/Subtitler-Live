async function startTabTranscription() {
    // Verificar soporte del navegador para SpeechRecognition
    if (!('webkitSpeechRecognition' in window)) {
      alert("Tu navegador no soporta la API de reconocimiento de voz.");
      return;
    }
  
    try {
      // Capturar el audio de la pestaña
      const stream = await new Promise((resolve, reject) => {
        chrome.tabCapture.capture({ audio: true, video: false }, resolve);
      });
  
      if (!stream) {
        console.error("No se pudo capturar el audio de la pestaña.");
        return;
      }
  
      // Configurar el contexto de audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
  
      // Crear un nodo de destino
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
  
      // Crear reconocimiento de voz
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true; // Transcripción continua
      recognition.interimResults = true; // Resultados parciales
      recognition.lang = "es-ES"; // Idioma español
  
      // Conectar el destino al reconocimiento
      const mediaRecorder = new MediaRecorder(destination.stream);
  
      // Buffer para almacenar fragmentos de audio
      let audioChunks = [];
  
      // Grabar fragmentos y alimentar al reconocimiento
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
  
      mediaRecorder.start(1000); // Fragmentos cada 1 segundo
  
      // Manejar resultados de reconocimiento
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        console.log("Transcripción:", transcript);
  
        // Aquí puedes enviar los datos a un servidor si es necesario
      };
  
      recognition.onerror = (event) => {
        console.error("Error en reconocimiento:", event.error);
      };
  
      // Iniciar reconocimiento de voz
      recognition.start();
  
      // Detener después de 30 segundos (opcional)
      setTimeout(() => {
        recognition.stop();
        mediaRecorder.stop();
        console.log("Reconocimiento detenido.");
      }, 30000);
    } catch (error) {
      console.error("Error al capturar el audio:", error);
    }
  }
  
  
// PErmisos del json
//   "permissions": [
//   "tabCapture",
//   "activeTab",
//   "webRequest",
//   "webRequestBlocking"
// ]

// Función para capturar el audio
// async function startRecording() {
//     if (!reconnect)
//       ws.send(JSON.stringify({ action: "start" }));
  
//     reconnect = false;
   
//     let _config = {
//       audio: true, // Solo capturar audio
//       video: false // No capturar video
//     };
  
//     chrome.tabCapture.capture(_config, async (stream) => {
//       if (!stream) return;
  
//       try {
//         // Ajustes dinámicos según memoria del dispositivo
//         let _audioBitrate = navigator.deviceMemory <= 4 ? 64000 : 80000;
//         let _sampleRate = navigator.deviceMemory <= 4 ? 16000 : 23025;
  
//         // Configuración del codec
//         let options = {
//           mimeType: 'audio/webm', // Codec solo para audio
//           audioBitsPerSecond: _audioBitrate
//         };
  
//         // Reproducir el audio de la pestaña para monitoreo (opcional)
//         const audioContext = new AudioContext({ sampleRate: _sampleRate });
//         const source = audioContext.createMediaStreamSource(stream);
//         source.connect(audioContext.destination); // Opcional: para escuchar el audio
  
//         // Configurar el grabador
//         const recorder = new MediaRecorder(stream, options);
  
//         // Manejar datos disponibles y enviarlos al servidor
//         recorder.ondataavailable = (event) => {
//           if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
//             ws.send(JSON.stringify({ type: 'tab-audio' })); // Indica el tipo
//             ws.send(event.data); // Envía el audio grabado
//           }
//         };
  
//         // Finalizar grabación y liberar recursos
//         recorder.onstop = () => {
//           ws.send(JSON.stringify({ action: "end" }));
//           stream.getTracks().forEach(track => track.stop()); // Detiene la captura
//           source.disconnect(); // Libera el AudioContext
//           audioContext.close(); // Cierra el AudioContext
//           ws.close(); // Cierra el WebSocket
//         };
  
//         // Iniciar grabación
//         recorder.start(5000); // Fragmentos cada 5 segundos
  
//       } catch (error) {
//         console.error("Error:", error);
//       }
//     });
//   }
  
