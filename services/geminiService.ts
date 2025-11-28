import { GoogleGenAI, Type, Modality } from '@google/genai';
import { createWavFile } from '../utils/audioUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function detectLanguageFromText(text: string): Promise<{ languageName: string; languageCode: string; }> {
    const model = 'gemini-2.5-flash';
    const prompt = `Identify the language of the following text.
Provide the output as a single JSON object with two keys: "languageName" (the full name of the language, e.g., "English"), and "languageCode" (the ISO 639-1 code, e.g., "en").

Text: "${text}"`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    languageName: { type: Type.STRING, description: "The full name of the detected language." },
                    languageCode: { type: Type.STRING, description: "The ISO 639-1 code for the language." },
                },
                required: ["languageName", "languageCode"],
            }
        }
    });

    const result = JSON.parse(response.text.trim());
    if (!result.languageName || !result.languageCode) {
        throw new Error("Could not determine the language from the text.");
    }
    return result;
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<{ transcript: string; languageName: string; languageCode: string; }> {
  const model = 'gemini-2.5-flash';
  const audioPart = {
    inlineData: {
      data: audioBase64,
      mimeType: mimeType || 'audio/webm',
    },
  };
  const textPart = {
    text: `Transcribe the spoken audio exactly as it is spoken, in its original language.
    Do not translate. Detect the language from the audio.
    Provide the output as a single JSON object with three keys: 
    "languageName" (the full name of the detected language), 
    "languageCode" (the ISO 639-1 code), 
    and "transcript" (the transcribed text in the detected original language).`,
  };
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [audioPart, textPart] },
    config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                languageName: { type: Type.STRING, description: "The full name of the detected language." },
                languageCode: { type: Type.STRING, description: "The ISO 639-1 code for the language." },
                transcript: { type: Type.STRING, description: "The transcribed text in the original language." },
            },
            required: ["languageName", "languageCode", "transcript"],
        }
    }
  });

  const result = JSON.parse(response.text.trim());
  if (!result.languageName || !result.transcript || !result.languageCode) {
      throw new Error("Could not determine the language or transcribe the audio.");
  }
  return result;
}

export async function translateText(text: string, sourceLanguage: string, languages: string[]): Promise<Record<string, string>> {
  const model = 'gemini-2.5-flash';
  const prompt = `Translate the following ${sourceLanguage} text into multiple languages. 
  Preserve the original tone, style, and approximate character count as much as possible.
  Provide the output as a single JSON object where each key is a language code from the list and the value is the translated text.

  Languages to translate to: ${languages.join(', ')}

  Text to translate:
  "${text}"
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: languages.reduce((acc, lang) => {
          acc[lang] = { type: Type.STRING };
          return acc;
        }, {} as Record<string, { type: Type.STRING }>),
      }
    }
  });
  
  const jsonResponse = JSON.parse(response.text.trim());
  return jsonResponse;
}

export async function generateVoiceover(text: string): Promise<string> {
    const model = 'gemini-2.5-flash-preview-tts';
    
    const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Puck' }, // A versatile male voice
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error('No audio data received from API.');
    }

    const wavBlobUrl = createWavFile(base64Audio);
    return wavBlobUrl;
}