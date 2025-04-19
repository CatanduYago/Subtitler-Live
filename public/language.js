class LanguageManager {
    constructor() {
        this.currentLanguage = 'es';
        this.translations = {
            es: {
                title: 'Transcriber: Live',
                description: 'Esta aplicación web permite capturar audio de pantalla en tiempo real y transcribirlo utilizando Amazon Transcribe.',
                limit: 'Al ser un servicio gratuito de Amazon, está limitado a 3600 audios al mes.',
                controls: 'Controles de captura:',
                start: 'Iniciar',
                stop: 'Detener',
                stopCapture: 'Detener Captura'
            },
            en: {
                title: 'Transcriber: Live',
                description: 'This web application allows you to capture screen audio in real time and transcribe it using Amazon Transcribe.',
                limit: 'As it is a free Amazon service, it is limited to 3600 audios per month.',
                controls: 'Capture controls:',
                start: 'Start',
                stop: 'Stop',
                stopCapture: 'Stop Capture'
            }
        };
    }

    init() {
        const languageButton = document.getElementById('language-switcher');
        languageButton.addEventListener('click', () => this.toggleLanguage());
        this.updateLanguage();
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'es' ? 'en' : 'es';
        this.updateLanguage();
    }

    updateLanguage() {
        const lang = this.translations[this.currentLanguage];
        const languageButton = document.getElementById('language-switcher');
        
        // Actualizar textos
        document.querySelector('.left h1').textContent = lang.title;
        document.querySelectorAll('.left p')[0].textContent = lang.description;
        document.querySelectorAll('.left p')[1].textContent = lang.limit;
        document.querySelector('.right p').textContent = lang.controls;
        document.getElementById('startButton').textContent = lang.start;
        document.getElementById('stopButton').textContent = lang.stop;
        
        // Actualizar botón de idioma
        languageButton.textContent = this.currentLanguage.toUpperCase();
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Exportar la clase para usarla en app.js
window.LanguageManager = LanguageManager; 