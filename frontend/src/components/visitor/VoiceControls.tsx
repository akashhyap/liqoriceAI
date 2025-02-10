import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';

interface VoiceControlsProps {
  onVoiceInput: (text: string) => void;
  textToSpeak?: string;
  disabled?: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  onVoiceInput,
  textToSpeak,
  disabled = false,
}) => {
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Speech synthesis states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const lastSpokenText = useRef<string>('');
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof window.SpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);
        const transcript = results
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        if (results[0].isFinal) {
          onVoiceInput(transcript);
          stopListening();
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionEvent) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onVoiceInput]);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening && !disabled) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  }, [recognition, isListening, disabled]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }, [recognition, isListening]);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current || !text || isMuted) return;

    // Stop any ongoing speech
    stopSpeaking();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech properties
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setHasSpoken(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setHasSpoken(true);
        lastSpokenText.current = text;
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setHasSpoken(false);
      };

      // Start speaking
      synthesisRef.current.speak(utterance);
    } catch (error) {
      console.error('Error in speak function:', error);
      setIsSpeaking(false);
      setHasSpoken(false);
    }
  }, [isMuted, stopSpeaking]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        stopSpeaking();
      } else if (textToSpeak) {
        // When unmuting, speak the current text
        speak(textToSpeak);
      }
      return !prev;
    });
  }, [stopSpeaking, speak, textToSpeak]);

  const handleRepeat = useCallback(() => {
    if (!isSpeaking && hasSpoken && lastSpokenText.current) {
      speak(lastSpokenText.current);
    }
  }, [isSpeaking, hasSpoken, speak]);

  // Effect to handle new text to speak
  useEffect(() => {
    if (textToSpeak && textToSpeak !== lastSpokenText.current && !isMuted) {
      speak(textToSpeak);
    }
  }, [textToSpeak, isMuted, speak]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [recognition]);

  if (!recognition) return null;

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {/* Voice Input Control */}
      <Tooltip title={isListening ? "Stop listening" : "Start voice input"}>
        <IconButton
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          color={isListening ? "primary" : "default"}
        >
          {isListening ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>

      {/* Mute/Unmute Control */}
      <Tooltip title={isMuted ? "Unmute" : "Mute"}>
        <IconButton
          onClick={toggleMute}
          color={isMuted ? "primary" : "default"}
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      </Tooltip>

      {/* Stop Speaking Control */}
      {isSpeaking && (
        <Tooltip title="Stop speaking">
          <IconButton
            onClick={stopSpeaking}
            color="error"
          >
            <StopIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Repeat Control */}
      {hasSpoken && !isSpeaking && !isMuted && (
        <Tooltip title="Repeat last message">
          <IconButton
            onClick={handleRepeat}
            color="primary"
          >
            <ReplayIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

export default VoiceControls;
