// Speech recognition utility functions
export class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  }

  isSupported() {
    return this.recognition !== null && this.synthesis !== null;
  }

  async startListening(onResult, onError, onStart, onEnd) {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    try {
      this.isListening = true;
      
      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        onStart && onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onResult && onResult(finalTranscript, interimTranscript);
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        onError && onError(event.error);
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
        onEnd && onEnd();
      };

      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError && onError(error.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text, onEnd) {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      console.log('Speech synthesis finished');
      onEnd && onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSpeaking() {
    return this.synthesis && this.synthesis.speaking;
  }
}

export const speechManager = new SpeechManager();