// TTS Web Worker - runs speech synthesis off the main thread
// This worker handles Browser TTS synthesis

interface TTSWorkerMessage {
  type: 'synthesize' | 'getVoices' | 'cancel';
  id: string;
  payload?: {
    text: string;
    options: {
      voiceId?: string;
      pitch?: number;
      speed?: number;
      volume?: number;
      language?: string;
    };
  };
}

interface TTSWorkerResponse {
  type: 'result' | 'error' | 'voices' | 'progress';
  id: string;
  payload?: any;
  error?: string;
}

// Store voices locally
let voices: SpeechSynthesisVoice[] = [];

// Load voices on startup
if (typeof speechSynthesis !== 'undefined') {
  voices = speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    voices = speechSynthesis.getVoices();
  };
}

self.onmessage = async (event: MessageEvent<TTSWorkerMessage>) => {
  const { type, id, payload } = event.data;

  switch (type) {
    case 'synthesize': {
      if (!payload) {
        self.postMessage({ type: 'error', id, error: 'Missing payload' } as TTSWorkerResponse);
        break;
      }

      try {
        const { text, options } = payload;
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const voice = voices.find(v => v.name === options.voiceId) || voices[0];
        if (voice) utterance.voice = voice;
        
        utterance.pitch = options.pitch ?? 1.0;
        utterance.rate = options.speed ?? 1.0;
        utterance.volume = options.volume ?? 1.0;
        utterance.lang = options.language ?? 'en-US';

        // Use MediaRecorder to capture audio
        const audioContext = new (self.AudioContext || (self as any).webkitAudioContext)();
        const dest = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(dest.stream);
        const chunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          const arrayBuffer = await blob.arrayBuffer();
          
          self.postMessage({ 
            type: 'result', 
            id, 
            payload: { 
              audioBuffer: arrayBuffer, 
              duration: text.length * 0.05 
            } 
          } as TTSWorkerResponse);
          
          audioContext.close();
        };

        mediaRecorder.start();
        speechSynthesis.speak(utterance);

        utterance.onend = () => {
          mediaRecorder.stop();
        };

        utterance.onerror = (e) => {
          mediaRecorder.stop();
          audioContext.close();
          self.postMessage({ type: 'error', id, error: e.error } as TTSWorkerResponse);
        };

      } catch (error) {
        self.postMessage({ type: 'error', id, error: (error as Error).message } as TTSWorkerResponse);
      }
      break;
    }

    case 'getVoices': {
      if (voices.length === 0) {
        voices = speechSynthesis.getVoices();
      }
      self.postMessage({ 
        type: 'voices', 
        id, 
        payload: voices.map(v => ({ 
          id: v.name, 
          name: `${v.name} (${v.lang})`, 
          language: v.lang 
        })) 
      } as TTSWorkerResponse);
      break;
    }

    case 'cancel': {
      speechSynthesis.cancel();
      self.postMessage({ type: 'result', id, payload: { cancelled: true } } as TTSWorkerResponse);
      break;
    }
  }
};

export {};