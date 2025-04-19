# Transcriber: Live

Una aplicación web para capturar audio de pantalla en tiempo real y transcribirlo utilizando AWS Transcribe.

## Características

- Captura de audio desde la pantalla compartida del navegador.
- Envío periódico de fragmentos de audio a AWS S3.
- Transcripción en vivo mediante AWS Transcribe.
- Visualización de transcripciones en tiempo real.
- Soporte para múltiples formatos de audio (
  mp3, mp4, wav, flac, ogg, amr, webm, m4a).

## Requisitos previos

- Node.js (>= v14)
- npm o yarn
- Cuenta de AWS con permisos para:
  - S3: `s3:CreateBucket`, `s3:PutObject`, `s3:HeadBucket`.
  - Transcribe: `transcribe:StartTranscriptionJob`, `transcribe:GetTranscriptionJob`.
- Crear un bucket en S3 (o dejar que la aplicación lo cree automáticamente).
- Configurar credenciales de AWS en variables de entorno.

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   ```
2. Instalar dependencias:
   ```bash
   npm install
   # o con yarn
   yarn install
   ```
3. Renombrar el archivo de ejemplo de variables de entorno:
   ```bash
   mv .env.example .env
   ```
4. Configurar las variables de entorno en `.env`:
   ```dotenv
   # Puerto del servidor
   PORT=3000

   # Credenciales de AWS
   AWS_ACCESS_KEY_ID=tu_access_key_id
   AWS_SECRET_ACCESS_KEY=tu_secret_access_key
   AWS_REGION=us-east-2
   AWS_S3_BUCKET=tu_bucket

   # Configuración de Transcribe
   AWS_TRANSCRIBE_LANGUAGE=es-ES
   ```

## Uso

1. Iniciar el servidor:
   ```bash
   npm start
   # o
   node index.js
   ```
2. Abrir el navegador en `http://localhost:3000`.
3. Hacer clic en **Iniciar** para permitir la captura de pantalla con audio:
   - Seleccionar la pestaña o ventana que incluya audio.
   - Asegurarse de marcar la opción **Compartir audio**.
4. La aplicación enviará cada 5 segundos un fragmento de audio a AWS Transcribe.
5. Verás las transcripciones aparecer en pantalla en tiempo real.
6. Hacer clic en **Detener** para finalizar la captura.

## Estructura del proyecto

```
├── app.js             # Lógica del cliente (captura de audio y envíos)
├── index.js           # Servidor Express (subida a S3 y transcripción)
├── public/
│   ├── index.html     # Página principal
│   ├── styles.css     # Estilos de la interfaz
│   └── app.js         # Script de captura y UI
├── .env.example       # Variables de entorno de ejemplo
├── package.json       # Dependencias y scripts
└── README.md          # Documentación del proyecto
```

## Variables de entorno

| Variable                     | Descripción                                         |
| ---------------------------- | --------------------------------------------------- |
| `PORT`                       | Puerto en el que escucha el servidor (por defecto 3000). |
| `AWS_ACCESS_KEY_ID`          | ID de la clave de acceso AWS.                       |
| `AWS_SECRET_ACCESS_KEY`      | Secreto de la clave de acceso AWS.                  |
| `AWS_REGION`                 | Región de AWS (ej. `us-east-2`).                    |
| `AWS_S3_BUCKET`              | Nombre del bucket de S3 para almacenar los audios.  |
| `AWS_TRANSCRIBE_LANGUAGE`    | Código de idioma para Transcribe (ej. `es-ES`).     |

## Contribuciones

Las contribuciones son bienvenidas. Para proponer mejoras o reportar errores:
1. Abrir un issue.
2. Crear un branch (`git checkout -b feature/nueva-funcionalidad`).
3. Hacer commit de tus cambios (`git commit -am 'Añade nueva funcionalidad'`).
4. Hacer push al branch (`git push origin feature/nueva-funcionalidad`).
5. Abrir un pull request.

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [`LICENSE`](./LICENSE) para más detalles.

---

© 2025 Yago Catalano Andújar

