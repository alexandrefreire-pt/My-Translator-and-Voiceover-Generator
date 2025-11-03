import React, { useState, useCallback } from 'react';
import AudioInput from './components/AudioInput';
import LanguageSelector from './components/LanguageSelector';
import TranslationTabs from './components/TranslationTabs';
import { SpinnerIcon } from './components/Icons';
import { transcribeAudio, translateText, generateVoiceover, detectLanguageFromText } from './services/geminiService';
import { fileToBase64 } from './utils/audioUtils';
import type { Translation } from './types';
import { LANGUAGES } from './constants';
import Flag from './components/Flag';

const App: React.FC = () => {
  const [step, setStep] = useState<'initial' | 'transcribing' | 'transcribed' | 'translating' | 'translated'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const [originalTranscript, setOriginalTranscript] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<{ name: string; code: string } | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [tempTranscript, setTempTranscript] = useState('');

  const handleAudioSubmit = useCallback(async (audioBlob: Blob) => {
    setStep('transcribing');
    setLoadingMessage('Transcribing to Portuguese...');
    setError(null);
    setDetectedLanguage(null);
    try {
      const audioBase64 = await fileToBase64(new File([audioBlob], "audio"));
      const { transcript, languageName, languageCode } = await transcribeAudio(audioBase64, audioBlob.type);
      setOriginalTranscript(transcript);
      setDetectedLanguage({ name: languageName, code: languageCode });
      setStep('transcribed');
    } catch (err) {
      console.error(err);
      setError('Failed to transcribe audio. Please try again.');
      setStep('initial');
    }
  }, []);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('Please enter some text to continue.');
      return;
    }
    setStep('transcribing'); // Reuse 'transcribing' as the loading step
    setLoadingMessage('Detecting Language...');
    setError(null);
    setDetectedLanguage(null);

    try {
      const { languageName, languageCode } = await detectLanguageFromText(text);
      setOriginalTranscript(text);
      setDetectedLanguage({ name: languageName, code: languageCode });
      setStep('transcribed');
    } catch (err) {
      console.error(err);
      setError('Failed to detect the language from your text. Please try again.');
      setStep('initial');
    }
  }, []);

  const handleTranslate = useCallback(async () => {
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language to translate.');
      return;
    }
    if (!detectedLanguage) {
      setError('Could not detect the original language. Cannot translate.');
      return;
    }
    setStep('translating');
    setLoadingMessage('Translating Text...');
    setError(null);
    try {
      const translationMap = await translateText(originalTranscript, detectedLanguage.name, selectedLanguages);
      const newTranslations = Object.entries(translationMap).map(([langCode, text]) => ({
        language: LANGUAGES.find(l => l.code === langCode)?.name || langCode,
        languageCode: langCode,
        text,
      }));
      setTranslations(newTranslations);
      setActiveTab(newTranslations[0]?.languageCode || null);
      setStep('translated');
    } catch (err) {
      console.error(err);
      setError('Failed to translate text. Please try again.');
      setStep('transcribed');
    }
  }, [originalTranscript, selectedLanguages, detectedLanguage]);

  const handleGenerateVoiceover = useCallback(async (languageCode: string) => {
    const translation = translations.find(t => t.languageCode === languageCode);
    if (!translation) return;

    setTranslations(prev => prev.map(t => t.languageCode === languageCode ? { ...t, isGeneratingAudio: true } : t));

    try {
      const audioUrl = await generateVoiceover(translation.text);
      setTranslations(prev => prev.map(t => t.languageCode === languageCode ? { ...t, audioUrl, isGeneratingAudio: false } : t));
    } catch (err) {
      console.error(err);
      setError(`Failed to generate voiceover for ${translation.language}.`);
      setTranslations(prev => prev.map(t => t.languageCode === languageCode ? { ...t, isGeneratingAudio: false } : t));
    }
  }, [translations]);

  const handleReset = () => {
    setStep('initial');
    setError(null);
    setOriginalTranscript('');
    setDetectedLanguage(null);
    setSelectedLanguages([]);
    setTranslations([]);
    setActiveTab(null);
    setIsEditingTranscript(false);
  };

  const handleEditTranscript = () => {
    setTempTranscript(originalTranscript);
    setIsEditingTranscript(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTranscript(false);
  };

  const handleSaveTranscript = () => {
    setOriginalTranscript(tempTranscript);
    setIsEditingTranscript(false);
    if (step === 'translated') {
      setStep('transcribed');
      setTranslations([]);
      setActiveTab(null);
    }
  };


  const renderContent = () => {
    switch (step) {
      case 'initial':
        return <AudioInput onSubmit={handleAudioSubmit} onTextSubmit={handleTextSubmit} />;
      case 'transcribing':
      case 'translating':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <SpinnerIcon className="w-16 h-16 text-brand-primary" />
            <p className="text-xl text-gray-light animate-pulse">
              {loadingMessage}
            </p>
          </div>
        );
      case 'transcribed':
      case 'translated':
        return (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h3 className="text-lg font-semibold text-brand-light">Original Transcript</h3>
                  {detectedLanguage && (
                      <div className="flex items-center space-x-2 text-sm text-gray-light mt-1">
                          <Flag languageCode={detectedLanguage.code} />
                          <span>{detectedLanguage.name}</span>
                      </div>
                  )}
              </div>
              {!isEditingTranscript ? (
                  <button onClick={handleEditTranscript} className="px-3 py-1 text-sm rounded-md border border-gray-medium text-brand-light hover:bg-gray-medium transition-colors flex-shrink-0">
                    Edit
                  </button>
              ) : (
                <div className="space-x-2 flex-shrink-0">
                  <button onClick={handleSaveTranscript} className="px-3 py-1 text-sm rounded-md border border-green-500 text-green-400 hover:bg-green-500/20 transition-colors">
                    Save
                  </button>
                  <button onClick={handleCancelEdit} className="px-3 py-1 text-sm rounded-md border border-red-500 text-red-400 hover:bg-red-500/20 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <textarea
              readOnly={!isEditingTranscript}
              value={isEditingTranscript ? tempTranscript : originalTranscript}
              onChange={(e) => setTempTranscript(e.target.value)}
              className={`w-full h-32 p-3 bg-gray-dark border border-gray-medium rounded-md resize-none focus:outline-none transition-all ${isEditingTranscript ? 'ring-2 ring-brand-primary' : 'focus:ring-2 focus:ring-brand-primary'}`}
            />
            
            {step === 'transcribed' && (
               <div className="mt-6">
                 <h3 className="text-lg font-semibold text-brand-light mb-2">Translate To</h3>
                 <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <LanguageSelector selectedLanguages={selectedLanguages} onChange={setSelectedLanguages} />
                    <button
                        onClick={handleTranslate}
                        disabled={selectedLanguages.length === 0}
                        className="w-full sm:w-auto px-6 py-3 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-secondary transition-colors disabled:bg-gray-medium disabled:cursor-not-allowed flex-shrink-0"
                    >
                        Translate
                    </button>
                 </div>
               </div>
            )}

            {step === 'translated' && translations.length > 0 && (
              <div className="mt-8">
                 <TranslationTabs 
                    translations={translations}
                    activeTab={activeTab}
                    onTabClick={setActiveTab}
                    onGenerateVoiceover={handleGenerateVoiceover}
                 />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-dark flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-light">
            My Translator and Voiceover Generator
          </h1>
          <p className="text-gray-light mt-2">Created by Alexandre Freire</p>
        </header>
        
        <main className="bg-gray-medium/20 border border-gray-medium rounded-lg shadow-2xl p-6 md:p-8 min-h-[30rem] flex flex-col items-center justify-center transition-all duration-300">
           {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-6 w-full text-center">{error}</div>}
           {renderContent()}
        </main>

        {(step !== 'initial' && step !== 'transcribing') && (
            <div className="mt-6 text-center">
                <button onClick={handleReset} className="text-brand-light hover:underline">
                    Start Over
                </button>
            </div>
        )}

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Voice Lab. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
