# Transcriber: Live

[![GitHub stars](https://img.shields.io/github/stars/CatanduYago/Transcriber-Live?style=social)](https://github.com/CatanduYago/Transcriber-Live) [![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE) [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14-blue)](https://nodejs.org/)

> Una aplicación web ligera para capturar audio de pantalla en tiempo real y transcribirlo utilizando Amazon Transcribe. 🎙️✨

---

## ✨ Características

- 🎧 **Captura de audio** desde la pantalla compartida del navegador.
- 📤 **Envío periódico** (cada 5 seg) de fragmentos de audio a AWS S3.
- 📝 **Transcripción en vivo** mediante Amazon Transcribe.
- 🔄 **Visualización** de transcripciones en tiempo real.
- 🔊 **Soporte** para múltiples formatos de audio: mp3, mp4, wav, flac, ogg, amr, webm, m4a.

---

## 🔧 Requisitos previos

- **Node.js** (>= v14)
- **npm** o **yarn**
- Cuenta de **AWS** con permisos para:
  - S3: `s3:CreateBucket`, `s3:PutObject`, `s3:HeadBucket`
  - Transcribe: `transcribe:StartTranscriptionJob`, `transcribe:GetTranscriptionJob`
- Un bucket en S3 (puede crearse automáticamente)
- Variables de entorno configuradas (ver sección siguiente)

---

## 🚀 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/CatanduYago/Transcriber-Live.git
   cd Transcriber-Live
   ```
2. **Instalar dependencias**:
   ```bash
   npm install
   # o con yarn
   yarn install
   ```
3. **Configurar variables de entorno**:
   ```bash
   mv .env.example .env
   ```
4. **Editar `.env`** con tus credenciales y ajustes:
   ```dotenv
   PORT=3000
   AWS_ACCESS_KEY_ID=tu_access_key_id
   AWS_SECRET_ACCESS_KEY=tu_secret_access_key
   AWS_REGION=us-east-2
   AWS_S3_BUCKET=tu_bucket
   AWS_TRANSCRIBE_LANGUAGE=es-ES
   ```

---

## 🚀 Uso

1. **Iniciar servidor**:
   ```bash
   npm start
   # o
   node index.js
   ```
2. Abrir el navegador en: `http://localhost:3000`
3. Hacer clic en **Iniciar** para capturar pantalla + audio:
   - Seleccionar la pestaña/ventana deseada.
   - Asegurarse de marcar **Compartir audio**.
4. 🎤 Cada 5 segundos se enviará un fragmento a Amazon Transcribe.
5. 📜 Las transcripciones aparecerán en tiempo real.
6. 🛑 Clic en **Detener** para finalizar.

---

## 📁 Estructura del proyecto

```
├── audio/            # Carpeta en la que se almacenan temporalmente los audios grabados antes de mandarse a AWS
│
├── backend/
│   ├── server.js     # Servidor que se encarga de recibir los audios y mandarlos a Amazon Transcribe
│   ├── .env.example  # Ejemplo de variables de entorno
│
├── public/
│   ├── index.html     # Página principal
│   ├── styles.css     # Estilos CSS
│   ├── language.js    # Lógica del cambio de idiomas
│   └── app.js         # Script de captura y UI

├── package.json       # Dependencias y scripts
└── README.md          # Documentación
```

---

## ⚙️ Variables de entorno

| Variable                  | Descripción                                             |
| ------------------------- | ------------------------------------------------------- |
| `PORT`                    | Puerto de escucha (por defecto 3000)                    |
| `AWS_ACCESS_KEY_ID`       | ID de tu clave de acceso AWS                            |
| `AWS_SECRET_ACCESS_KEY`   | Secreto de tu clave AWS                                 |
| `AWS_REGION`              | Región AWS (ej. `us-east-2`)                            |
| `AWS_S3_BUCKET`           | Nombre del bucket S3 para almacenar los audios          |
| `AWS_TRANSCRIBE_LANGUAGE` | Código de idioma para Transcribe (ej. `es-ES`)          |

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

© 2025 Yago Catalano Andújar

