
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { Language, FileData, Message, GroundingSource, Translations } from './types';
import { chatWithGeminiStream } from './services/gemini';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('fr');
  const [files, setFiles] = useState<FileData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const t = Translations[language];

  const checkKey = useCallback(async () => {
    // 1. Check if we are in AI Studio environment
    // @ts-ignore
    const aiStudio = window.aistudio;
    if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
      const keySelected = await aiStudio.hasSelectedApiKey();
      if (keySelected) {
        setHasKey(true);
        return;
      }
    }

    // 2. Fallback: Check for local environment variable
    const localKey = process.env.API_KEY;
    const isValidLocalKey = localKey && 
                           localKey !== 'Placeholder_API_KEY' && 
                           localKey.length > 10;
    
    setHasKey(!!isValidLocalKey);
  }, []);

  useEffect(() => {
    checkKey();
    // Re-check periodically in case the user selects a key in the background
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, [checkKey]);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    const aiStudio = window.aistudio;
    if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
      await aiStudio.openSelectKey();
      setHasKey(true);
    } else {
      // Local fallback: tell user to use .env
      alert(language === 'en' 
        ? "You are running locally. Please set your API_KEY in the .env file." 
        : "Vous utilisez l'application en local. Veuillez configurer votre API_KEY dans le fichier .env.");
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const filePromises = Array.from(uploadedFiles).map((file: File) => {
      return new Promise<FileData>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: uuidv4(),
            name: file.name,
            type: file.type,
            content: reader.result as string,
            mimeType: file.type,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newFiles = await Promise.all(filePromises);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    let assistantText = "";
    let assistantSources: GroundingSource[] = [];
    const assistantId = uuidv4();
    
    try {
      await chatWithGeminiStream(
        inputValue,
        files,
        language,
        (chunk, sources) => {
          assistantText += chunk;
          if (sources) {
            assistantSources = [...assistantSources];
            sources.forEach(s => {
              if (!assistantSources.find(as => as.uri === s.uri)) {
                assistantSources.push(s);
              }
            });
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.id === assistantId) {
              return [...prev.slice(0, -1), { 
                ...last, 
                text: assistantText, 
                sources: assistantSources.length > 0 ? assistantSources : last.sources 
              }];
            } else {
              return [...prev, {
                id: assistantId,
                role: 'assistant',
                text: assistantText,
                timestamp: new Date(),
                sources: assistantSources.length > 0 ? assistantSources : undefined
              }];
            }
          });
        }
      );
    } catch (error: any) {
      console.error("Chat error:", error);
      
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
      } else {
        const errorMsg = language === 'en' ? "Failed to connect to AI. Please check your API key." : "Échec de la connexion. Vérifiez votre clé API.";
        setMessages((prev) => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          text: errorMsg,
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (hasKey === false) {
    // @ts-ignore
    const isLocal = !window.aistudio;

    return (
      <div className="relative h-screen w-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
            className="text-xs font-bold uppercase px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
          >
            <i className="fas fa-globe mr-2"></i>
            {language === 'en' ? 'Français' : 'English'}
          </button>
        </div>

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-500">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3">
              <i className="fas fa-key text-4xl"></i>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">{t.setupTitle}</h1>
            <p className="text-slate-500 mb-10 leading-relaxed text-sm">
              {isLocal 
                ? (language === 'en' 
                    ? "Local mode detected. Please add your Gemini API Key to the .env file to continue." 
                    : "Mode local détecté. Veuillez ajouter votre clé API Gemini dans le fichier .env pour continuer.")
                : t.setupDesc}
            </p>
            
            {!isLocal && (
              <button 
                onClick={handleOpenSelectKey}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mb-6"
              >
                <i className="fab fa-google text-lg"></i>
                {t.setupBtn}
              </button>
            )}

            <div className="flex flex-col gap-2">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 font-bold hover:underline mb-2"
              >
                {language === 'en' ? "Get an API Key here" : "Obtenir une clé API ici"}
              </a>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-slate-400 hover:text-indigo-600 underline transition-colors"
              >
                {t.setupLink}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasKey === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-medium animate-pulse">OmniAssist is initializing...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar 
        language={language} 
        setLanguage={setLanguage} 
        files={files} 
        onFileUpload={handleFileUpload}
        onRemoveFile={handleRemoveFile}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Chat 
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={handleSend}
          isLoading={isLoading}
          language={language}
        />
      </main>
    </div>
  );
};

export default App;
