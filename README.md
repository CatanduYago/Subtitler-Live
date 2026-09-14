# Subtitler: Live

[![GitHub stars](https://img.shields.io/github/stars/CatanduYago/Subtitler-Live?style=flat)](https://github.com/CatanduYago/Subtitler-Live/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14-339933?logo=node.js&logoColor=white)](https://nodejs.org)

> A web app that captures screen audio in real time and transcribes it using Amazon Transcribe. 🎙️✨

## ✨ Features

- 🎧 Captures audio from the browser tab or window being shared.
- 📤 Uploads audio chunks to AWS S3 every 5 seconds.
- 📝 Live transcription through Amazon Transcribe.
- 🔄 Transcripts displayed in real time.
- 🔊 Support for multiple audio formats: mp3, mp4, wav, flac, ogg, amr, webm, m4a.

## 🔧 Prerequisites

- Node.js (>= v14)
- npm or yarn
- An AWS account with permissions for:
  - **S3:** `s3:CreateBucket`, `s3:PutObject`, `s3:HeadBucket`
  - **Transcribe:** `transcribe:StartTranscriptionJob`, `transcribe:GetTranscriptionJob`
- An S3 bucket (the app can create one automatically)
- Environment variables configured (see the section below)

## 🚀 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/CatanduYago/Subtitler-Live.git
   cd Subtitler-Live
   ```

2. Install dependencies:

   ```bash
   npm install
   # or with yarn
   yarn install
   ```

3. Set up your environment variables:

   ```bash
   mv .env.example .env
   ```

   Then edit `.env` with your credentials and settings:

   ```env
   PORT=3000
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-2
   AWS_S3_BUCKET=your_bucket
   AWS_TRANSCRIBE_LANGUAGE=es-ES
   ```

## 🚀 Usage

1. Start the server:

   ```bash
   npm start
   # or
   node index.js
   ```

2. Open your browser at http://localhost:3000
3. Click **Start** to begin capturing the screen and its audio:
   - Pick the tab or window you want to share.
   - Make sure **Share audio** is checked.
4. 🎤 A new audio chunk is sent to Amazon Transcribe every 5 seconds.
5. 📜 Transcripts appear in real time.
6. 🛑 Click **Stop** to end the session.

## 📁 Project structure

```
├── audio/            # Temporary storage for recorded audio before it is sent to AWS
│
├── backend/
│   ├── server.js     # Server that receives the audio and forwards it to Amazon Transcribe
│   ├── .env.example  # Example environment variables
│
├── public/
│   ├── index.html    # Main page
│   ├── styles.css    # CSS styles
│   ├── language.js   # Language switching logic
│   └── app.js        # Capture and UI script
│
├── package.json      # Dependencies and scripts
└── README.md         # Documentation
```

## ⚙️ Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Port to listen on (defaults to 3000) |
| `AWS_ACCESS_KEY_ID` | Your AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key |
| `AWS_REGION` | AWS region (e.g. `us-east-2`) |
| `AWS_S3_BUCKET` | Name of the S3 bucket used to store the audio |
| `AWS_TRANSCRIBE_LANGUAGE` | Language code for Transcribe (e.g. `es-ES`) |

## 📄 License

This project is released under the MIT license. See the [LICENSE](LICENSE) file for details.

---

© 2025 Yago Catalano Andújar
