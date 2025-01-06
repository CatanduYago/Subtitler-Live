"use strict";
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    try {
      if (message.target === 'offscreen') {
        switch (message.type) {
          case 'start-recording':
            await startRecording(message.data);
            sendResponse({ status: 'recording started' });
            break;
          case 'stop-recording':
            await stopRecording();
            sendResponse({ status: 'recording stopped' });
            break;
          default:
            throw new Error('Unrecognized message:', message.type);
        }
      }
    } catch (error) {
      console.error(error);
      sendResponse({ status: 'error', message: error.message });
    }
    return true; 
  });
  
  
  let recorder;
  let data = [];
  
  async function startRecording(streamId) {
    if (recorder?.state === 'recording') {
      throw new Error('Called startRecording while recording is in progress.');
    }
  
    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
  
    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    source.connect(output.destination);
  
    recorder = new MediaRecorder(media, { mimeType: 'video/webm' });
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.onstop = () => {
      const blob = new Blob(data, { type: 'video/webm' });
      window.open(URL.createObjectURL(blob), '_blank');
  
      recorder = undefined;
      data = [];
    };
    recorder.start();
  
    window.location.hash = 'recording';
  }
  
  async function stopRecording() {
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    window.location.hash = '';
  }
  