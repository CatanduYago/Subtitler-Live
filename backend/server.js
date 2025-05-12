const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Cargamos variables de entorno desde la carpeta backend
dotenv.config({path: path.join(__dirname, '.env')});

const app = express();
const PORT = process.env.PORT || 3000;

// Configuramos la politica de CORS
app.use(cors());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));

// Serviremos los archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const transcribe = new AWS.TranscribeService();
const s3 = new AWS.S3();

// Función para asegurar que el bucket existe
async function ensureBucketExists(bucketName) {
    try {
        await s3.headBucket({Bucket: bucketName}).promise();
        console.log(`Bucket ${bucketName} ya existe`);
    } catch (error) {
        if (error.statusCode === 404) {
            console.log(`Creando bucket ${bucketName}...`);
            await s3.createBucket({Bucket: bucketName}).promise();
            console.log(`Bucket ${bucketName} creado exitosamente`);
        } else {
            console.error('Error al verificar el bucket:', error);
            throw error;
        }
    }
}

// Función para subir a S3
async function uploadToS3(audioBuffer, format) {
    const bucketName = process.env.AWS_S3_BUCKET;

    // Asegurar que el bucket existe
    await ensureBucketExists(bucketName);

    const key = `audio-${Date.now()}.${format}`;

    // Asegurar que el formato sea uno de los soportados
    const supportedFormats = ['mp3', 'mp4', 'wav', 'flac', 'ogg', 'amr', 'webm', 'm4a'];
    if (!supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`Formato no soportado: ${format}. Formatos soportados: ${supportedFormats.join(', ')}`);
    }

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: audioBuffer,
        ContentType: `audio/${format}`,
        ACL: 'public-read'
    };

    try {
        console.log('Subiendo archivo a S3...', {
            bucket: bucketName,
            key: key,
            contentType: `audio/${format}`,
            size: audioBuffer.length
        });

        const result = await s3.upload(params).promise();
        console.log('Archivo subido exitosamente a S3:', result.Location);
        return result.Location;
    } catch (error) {
        console.error('Error al subir a S3:', error);
        throw error;
    }
}

// Función para obtener el resultado de la transcripción
async function getTranscriptionResult(transcriptionUrl) {
    try {
        console.log('Obteniendo resultado de la transcripción desde:', transcriptionUrl);

        // Petición HTTP al S3 público que AWS Transcribe ya creó
        const response = await axios.get(transcriptionUrl);
        const transcriptionData = response.data;
        console.log('Datos de transcripción recibidos:', JSON.stringify(transcriptionData, null, 2));

        // Extraer el texto
        if (
            transcriptionData.results &&
            transcriptionData.results.transcripts &&
            transcriptionData.results.transcripts.length > 0
        ) {
            const transcript = transcriptionData.results.transcripts[0].transcript;
            console.log('Texto transcrito:', transcript);
            return transcript;
        } else {
            throw new Error('Formato de transcripción no válido');
        }
    } catch (error) {
        console.error('Error al obtener el resultado de la transcripción:', error);
        throw error;
    }
}

// Ruta para servir la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.post('/transcribe', async (req, res) => {
    try {
        const {audio, format} = req.body;

        if (!audio) {
            return res.status(400).json({error: 'No se proporcionó audio'});
        }

        console.log('Recibido audio con formato:', format);
        console.log('Tamaño del audio en base64:', audio.length);

        // Convertir base64 a buffer
        const audioBuffer = Buffer.from(audio, 'base64');
        console.log('Tamaño del buffer:', audioBuffer.length);

        // Verificar que el buffer no esté vacío
        if (audioBuffer.length === 0) {
            throw new Error('El buffer de audio está vacío');
        }

        // Subir a S3
        const s3Url = await uploadToS3(audioBuffer, format);
        console.log('Audio subido a S3:', s3Url);

        // Crear un nombre único para el trabajo
        const jobName = `transcription-${Date.now()}`;

        // Configurar los parámetros para Transcribe
        const params = {
            LanguageCode: process.env.AWS_TRANSCRIBE_LANGUAGE || 'es-ES',
            Media: {
                MediaFileUri: s3Url
            },
            MediaFormat: format.toLowerCase(),
            TranscriptionJobName: jobName,
            Settings: {
                ShowSpeakerLabels: true,
                MaxSpeakerLabels: 2
            }
        };

        console.log('Iniciando trabajo de transcripción con parámetros:', JSON.stringify(params, null, 2));

        // Iniciar el trabajo de transcripción
        const result = await transcribe.startTranscriptionJob(params).promise();
        console.log('Respuesta de AWS Transcribe:', JSON.stringify(result, null, 2));

        // Esperar a que el trabajo se complete
        let jobStatus = 'IN_PROGRESS';
        while (jobStatus === 'IN_PROGRESS') {
            const status = await transcribe.getTranscriptionJob({TranscriptionJobName: jobName}).promise();
            jobStatus = status.TranscriptionJob.TranscriptionJobStatus;
            console.log('Estado del trabajo:', jobStatus);

            if (jobStatus === 'COMPLETED') {
                const transcriptionUrl = status.TranscriptionJob.Transcript.TranscriptFileUri;
                const transcriptionText = await getTranscriptionResult(transcriptionUrl);
                return res.json({transcription: transcriptionText});
            } else if (jobStatus === 'FAILED') {
                throw new Error(status.TranscriptionJob.FailureReason);
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.error('Error en la transcripción:', error);
        res.status(500).json({error: error.message});
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
