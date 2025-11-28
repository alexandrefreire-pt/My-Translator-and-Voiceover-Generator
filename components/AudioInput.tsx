import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, StopIcon, DocumentTextIcon } from './Icons';

interface AudioInputProps {
  onSubmit: (audioBlob: Blob) => void;
  onTextSubmit: (text: string) => void;
}

const AudioInput: React.FC<AudioInputProps> = ({ onSubmit, onTextSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [text, setText] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSubmit(file);
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/wav'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // Let the browser default if none of the above match
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      // Initialize recorder with supported mimeType if found
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        // Use the actual mimeType from the recorder, or fallback to the one we requested, or webm
        const finalType = recorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        onSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      });

      recorder.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  }, [onSubmit]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const handleTextButtonClick = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-6">
      <div className="w-full max-w-md">
        <label
          htmlFor="audio-upload"
          className="group flex flex-col items-center justify-center w-full h-40 px-4 transition bg-white border-2 border-dashed rounded-md cursor-pointer border-gray-medium hover:border-brand-primary hover:bg-gray-50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon className="w-10 h-10 mb-3 text-gray-400 group-hover:text-brand-primary" />
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">MP3, WAV, OGG, WEBM, etc.</p>
          </div>
          <input id="audio-upload" type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
        </label>
      </div>

      <div className="w-full max-w-md flex items-center space-x-2 text-gray-400">
        <div className="flex-grow border-t border-gray-medium"></div>
        <span className="px-3 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-medium"></div>
      </div>

      <div className="w-full max-w-md flex justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center justify-center px-6 py-3 space-x-3 font-bold text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-secondary shadow-sm hover:shadow-md"
          >
            <span>Start Recording 🎙️</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center px-6 py-3 space-x-3 font-bold text-white transition-colors bg-brand-primary rounded-md hover:bg-brand-secondary animate-pulse shadow-sm"
          >
            <StopIcon className="w-6 h-6" />
            <span>Stop Recording</span>
          </button>
        )}
      </div>

      <div className="w-full max-w-md flex items-center space-x-2 text-gray-400">
        <div className="flex-grow border-t border-gray-medium"></div>
        <span className="px-3 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-medium"></div>
      </div>
      
      <div className="w-full max-w-md">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to get started..."
            className="w-full h-28 p-3 bg-white border border-gray-medium rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary text-gray-800"
            aria-label="Text input for translation"
        />
        <button
            onClick={handleTextButtonClick}
            disabled={!text.trim()}
            className="mt-3 w-full flex items-center justify-center px-6 py-3 space-x-3 font-bold text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
        >
            <DocumentTextIcon className="w-6 h-6 mr-2" />
            <span>Continue with Text</span>
        </button>
      </div>
    </div>
  );
};

export default AudioInput;