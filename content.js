"use strict";

// Verificaremos si webkitSpeechRecognition está disponible en el navegador
if ("webkitSpeechRecognition" in window) {
    let recognition;
    let outputLang;

    chrome.runtime.onMessage.addListener(async (message) => {
        
        // Iniciamos el reconocimiento de voz si el mensaje revibido de los botones es "start"
        if (message.action === "start") {
            startRecognition(message.inputLang, message.outputLang);
        
        // Detenemos  el reconocimiento de voz si el mensaje recibido de los botones es "stop"
        } else if (message.action === "stop") {
            stopRecognition();
        }
    });

    // Función para iniciar el reconocimiento de voz
    function startRecognition(inputLang, targetLang) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = inputLang;
        outputLang = targetLang;

        // Insertamos el div de subtítulos en la pagina
        const subtitleDiv = createSubtitleDiv();

        // Manejamos los resultados del reconocimiento de voz
        recognition.onresult = async (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript;
                    
                    // Traducimos el texto reconocido
                    const translatedText = await translateText(transcript, outputLang);
                    subtitleDiv.textContent += " " + translatedText;
                }
            }
        };

        // Iniciamos el reconocimiento de voz
        recognition.start();
    }

    // Función para detener el reconocimiento de voz
    function stopRecognition() {
        
        // Si el reconocimiento si está activo lo paramos
        if (recognition) {
            recognition.stop();
        }

        // Eliminamos el div donde se estan cargando los subtitulos
        const subtitleDiv = document.getElementById("live-subtitles");
        if (subtitleDiv) {
            subtitleDiv.remove();
        }
    }

    // Función para traducir el texto usando la API de Google Translate
    async function translateText(text, targetLang) {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        
        // Devuelve el texto traducido y si da algun error, devuelve el texto original
        return data[0]?.[0]?.[0] || text;
    }

    // Función para crear el div de subtítulos en la página
    function createSubtitleDiv() {
        let subtitleDiv = document.getElementById("live-subtitles");
        
        // Crea el div si no existe
        if (!subtitleDiv) {
            subtitleDiv = document.createElement("div");
            subtitleDiv.id = "live-subtitles";
            subtitleDiv.style = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                z-index: 10000;
                max-width: 80%;
                font-size: 16px;
                border-radius: 5px;
                max-height: 150px; 
                overflow: hidden; 
                display: flex;
                flex-direction: column-reverse; 
            `;

            document.body.appendChild(subtitleDiv);
        }
        return subtitleDiv;
    }
} else {
    
    // Mensaje de error si el navegador no soporta webkitSpeechRecognition
    subtitleDiv.textContent = "El navegador no soporta webkitSpeechRecognition.";
    console.error("El navegador no soporta webkitSpeechRecognition.");
}
