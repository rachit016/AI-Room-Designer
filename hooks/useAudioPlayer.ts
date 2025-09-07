import { useState, useEffect, useCallback } from 'react';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prioritize finding a "soft and cheerful" voice. Google's female voices are often a good fit.
        // Fix: The 'gender' property is not standard on SpeechSynthesisVoice. Use name-based heuristics instead.
        const cheerfulVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google') && v.name.includes('Female')) ||
                              voices.find(v => v.lang.startsWith('en-US') && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Female'))) ||
                              voices.find(v => v.lang.startsWith('en-US')) ||
                              voices[0]; // Fallback to the first available voice.
        setSelectedVoice(cheerfulVoice);
      }
    };

    // Voices may load asynchronously.
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices(); // Initial attempt to load voices.

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
  const stop = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      setIsPlaying(false);
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback((text: string) => {
    // Stop any currently playing speech before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    // Adjust pitch and rate for a more "cheerful" tone
    utterance.pitch = 1.1; // Slightly higher pitch
    utterance.rate = 1.0;  // Normal speaking rate
    
    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const togglePlay = useCallback((text: string) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text);
    }
  }, [isPlaying, speak, stop]);


  return { togglePlay, stop, speak, isPlaying };
};
