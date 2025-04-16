const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');
const app = express();

// Configurar CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Leer las credenciales del archivo CSV
const credentials = fs.readFileSync('aws_credentials.csv', 'utf8');
const [header, ...rows] = credentials.split('\n');
const [accessKeyId, secretAccessKey] = rows[0].split(',');

// Configurar AWS
AWS.config.update({
    region: 'us-east-1',
    credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim()
    }
});

const transcribe = new AWS.TranscribeService();
const s3 = new AWS.S3();

// Función para subir el audio a S3
async function uploadToS3(audioData, format) {
    const key = `audio-${Date.now()}.${format}`;
    const buffer = Buffer.from(audioData, 'base64');
    
    await s3.putObject({
        Bucket: 'subtitler-audio-files',
        Key: key,
        Body: buffer,
        ContentType: `audio/${format}`
    }).promise();
    
    return `s3://subtitler-audio-files/${key}`;
}

app.post('/transcribe', async (req, res) => {
    console.log('Solicitud de transcripción recibida');
    try {
        const { audioData, format } = req.body;
        console.log('Tamaño de los datos de audio recibidos:', audioData ? audioData.length : 'no hay datos');
        
        if (!audioData) {
            console.error('No se recibieron datos de audio');
            return res.status(400).json({ error: 'No se recibieron datos de audio' });
        }
        
        if (audioData.length < 2000) {
            console.error('Datos de audio demasiado cortos');
            return res.status(400).json({ error: 'Los datos de audio son demasiado cortos' });
        }
        
        if (audioData.length > 10 * 1024 * 1024) {
            console.error('Datos de audio demasiado grandes');
            return res.status(400).json({ error: 'Los datos de audio son demasiado grandes' });
        }

        // Subir el audio a S3
        console.log('Subiendo audio a S3...');
        const s3Uri = await uploadToS3(audioData, format || 'wav');
        console.log('Audio subido a:', s3Uri);

        console.log('Iniciando trabajo de transcripción...');
        const params = {
            LanguageCode: 'es-ES',
            Media: {
                MediaFileUri: s3Uri
            },
            MediaFormat: format || 'wav',
            MediaSampleRateHertz: req.body.sampleRate || 16000,
            TranscriptionJobName: `transcription-${Date.now()}`,
            Settings: {
                ShowSpeakerLabels: false,
                ChannelIdentification: false
            }
        };

        console.log('Parámetros de transcripción:', JSON.stringify(params, null, 2));
        const result = await transcribe.startTranscriptionJob(params).promise();
        console.log('Trabajo de transcripción iniciado:', result);
        
        const checkStatus = async () => {
            console.log('Verificando estado de la transcripción...');
            try {
                const status = await transcribe.getTranscriptionJob({
                    TranscriptionJobName: params.TranscriptionJobName
                }).promise();
                
                console.log('Estado actual:', status.TranscriptionJob.TranscriptionJobStatus);
                
                if (status.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
                    console.log('Transcripción completada');
                    if (status.TranscriptionJob.Transcript && status.TranscriptionJob.Transcript.TranscriptText) {
                        res.json({ transcript: status.TranscriptionJob.Transcript.TranscriptText });
                    } else {
                        console.error('No se encontró texto en la transcripción');
                        res.status(500).json({ error: 'No se pudo obtener el texto de la transcripción' });
                    }
                } else if (status.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
                    console.error('Error en la transcripción:', status.TranscriptionJob.FailureReason);
                    res.status(500).json({ error: status.TranscriptionJob.FailureReason });
                } else {
                    console.log('Transcripción en progreso, esperando...');
                    setTimeout(checkStatus, 1000);
                }
            } catch (error) {
                console.error('Error al verificar el estado:', error);
                res.status(500).json({ error: error.message });
            }
        };
        
        checkStatus();
    } catch (error) {
        console.error('Error en la transcripción:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 