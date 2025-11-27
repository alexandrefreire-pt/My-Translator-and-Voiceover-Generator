import React, { useState, useRef, useEffect } from 'react';
import type { Translation } from '../types';
import { DownloadIcon, PlayIcon, SpinnerIcon, PauseIcon, ShareIcon } from './Icons';

interface TranslationTabsProps {
  translations: Translation[];
  activeTab: string | null;
  onTabClick: (languageCode: string) => void;
  onGenerateVoiceover: (languageCode: string) => void;
}

const TranslationTabs: React.FC<TranslationTabsProps> = ({ translations, activeTab, onTabClick, onGenerateVoiceover }) => {
  const activeTranslation = translations.find(t => t.languageCode === activeTab);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    // If there's an existing audio player, pause it and remove its event listeners to prevent memory leaks.
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onplay = null;
        audioRef.current.onpause = null;
        audioRef.current.onended = null;
    }

    // If the currently selected translation has an audio URL, create a new Audio object.
    if (activeTranslation?.audioUrl) {
        const audio = new Audio(activeTranslation.audioUrl);
        // Set up event listeners to sync React state with the audio element's actual state.
        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => setIsPlaying(false);
        audioRef.current = audio;
    } else {
        audioRef.current = null;
    }

    // Always reset the playing state when the audio source changes.
    setIsPlaying(false);

    // Cleanup function to run when the component unmounts or dependencies change.
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [activeTab, activeTranslation?.audioUrl]);

  const handlePlayPause = () => {
      if (!audioRef.current) return;
      
      // Control the audio element directly. State updates will be handled by the event listeners.
      if (audioRef.current.paused) {
          audioRef.current.play().catch(error => {
              console.error("Error attempting to play audio:", error);
              // Ensure the UI state is correct if playback fails.
              setIsPlaying(false);
          });
      } else {
          audioRef.current.pause();
      }
  };

  const handleShareTranscript = async () => {
    if (!activeTranslation?.text) return;

    try {
      await navigator.share({
        title: `Translation in ${activeTranslation.language}`,
        text: activeTranslation.text,
      });
    } catch (error) {
      console.error('Error sharing transcript:', error);
    }
  };

  const handleShareVoiceover = async () => {
    if (!activeTranslation?.audioUrl) return;

    try {
      const response = await fetch(activeTranslation.audioUrl);
      const blob = await response.blob();
      const file = new File([blob], `${activeTranslation.language}_voiceover.wav`, { type: 'audio/wav' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Voiceover in ${activeTranslation.language}`,
          text: `Here is the voiceover in ${activeTranslation.language}.`,
        });
      } else {
        alert('Sharing audio files is not supported on your browser.');
      }
    } catch (error) {
      console.error('Error fetching or sharing voiceover:', error);
      alert('Could not share the voiceover file.');
    }
  };

  // Standard button classes for consistency across the app
  const buttonClass = "flex items-center justify-center px-4 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-secondary transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed";

  return (
    <div className="w-full">
      <div className="border-b border-gray-medium">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {translations.map(translation => (
            <button
              key={translation.languageCode}
              onClick={() => onTabClick(translation.languageCode)}
              className={`${
                activeTab === translation.languageCode
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {translation.language}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="pt-6">
        {activeTranslation && (
          <div>
            <textarea
              readOnly
              value={activeTranslation.text}
              className="w-full h-48 p-3 bg-white border border-gray-medium rounded-md resize-none focus:ring-2 focus:ring-brand-primary focus:outline-none text-gray-800"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              
              {!activeTranslation.audioUrl ? (
                <button
                    onClick={() => onGenerateVoiceover(activeTranslation.languageCode)}
                    disabled={activeTranslation.isGeneratingAudio}
                    className={buttonClass}
                >
                    {activeTranslation.isGeneratingAudio ? (
                        <><SpinnerIcon className="w-5 h-5 mr-2"/><span>Generating...</span></>
                    ) : (
                        <><PlayIcon className="w-5 h-5 mr-2"/><span>Generate Voiceover</span></>
                    )}
                </button>
              ) : (
                <>
                    <button 
                      onClick={handlePlayPause}
                      className={buttonClass}
                    >
                      {isPlaying ? (
                        <><PauseIcon className="w-5 h-5 mr-2" /><span>Pause</span></>
                      ) : (
                        <><PlayIcon className="w-5 h-5 mr-2" /><span>Play Voiceover</span></>
                      )}
                    </button>
                    <a
                      href={activeTranslation.audioUrl}
                      download={`${activeTranslation.language}_voiceover.wav`}
                      className={buttonClass}
                      aria-label="Download voiceover"
                    >
                      <DownloadIcon className="w-5 h-5 mr-2" />
                      <span>Download</span>
                    </a>
                </>
              )}

              {canShare && (
                <>
                    <button
                        onClick={handleShareTranscript}
                        className={buttonClass}
                        title="Share Transcript"
                    >
                        <ShareIcon className="w-5 h-5 mr-2" />
                        <span>Share Transcript</span>
                    </button>
                    {activeTranslation.audioUrl && (
                        <button
                            onClick={handleShareVoiceover}
                            className={buttonClass}
                            title="Share Voiceover"
                        >
                            <ShareIcon className="w-5 h-5 mr-2" />
                            <span>Share Voiceover</span>
                        </button>
                    )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationTabs;