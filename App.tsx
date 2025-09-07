import React, { useState, useRef, useEffect } from 'react';
import { RoomImageManager } from './components/RoomImageManager';
import { DecorImageManager } from './components/DecorImageManager';
import { ResultCard } from './components/ResultCard';
import { Spinner } from './components/Spinner';
import { SparklesIcon, ExclamationTriangleIcon } from './components/Icons';
import { generateDecorIdeas, enhanceImage, DesignIdea } from './services/geminiService';

interface Result {
  enhancedBeforeImage: string; // base64
  idea: DesignIdea;
}

const promptSuggestions = [
  'Minimalist and modern with clean lines',
  'Cozy Scandinavian (hygge) with warm woods',
  'Bohemian chic with eclectic patterns and plants',
  'Industrial loft style with exposed brick',
  'Luxurious and elegant with velvet and gold',
  'Mid-century modern with organic shapes',
  'Coastal and airy with light, natural colors',
  'Vibrant maximalist, full of bold patterns'
];

const App: React.FC = () => {
  const [roomImages, setRoomImages] = useState<File[]>([]);
  const [decorImages, setDecorImages] = useState<File[]>([]);
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (roomImages.length === 0) {
      setError('Please upload at least one image of your room.');
      return;
    }
    if (!stylePrompt.trim()) {
      setError('Please provide a style prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const generationPromises = roomImages.map(async (roomImage) => {
        // First, enhance the "before" image for better comparison quality
        const enhancedBeforeImage = await enhanceImage(roomImage);
        // Then, generate the new design using the original image
        const idea = await generateDecorIdeas(roomImage, decorImages, stylePrompt);
        return {
          enhancedBeforeImage,
          idea,
        };
      });
      
      const generatedResults = await Promise.all(generationPromises);
      setResults(generatedResults);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (results.length > 0 && !isLoading) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results, isLoading]);

  const handleSuggestionClick = (suggestion: string) => {
    setStylePrompt(suggestion);
  };

  return (
    <div className="min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2 pb-2">
            AI Interior Designer
          </h1>
          <p className="text-gray-400">
            Remagine your space. Upload your room, add decor, and let AI bring your vision to life.
          </p>
        </header>

        <main className="space-y-8">
          <div className="glass-card p-6 rounded-2xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RoomImageManager images={roomImages} onImagesChange={setRoomImages} />
              <DecorImageManager images={decorImages} onImagesChange={setDecorImages} />
            </div>
            <div className="mt-6">
              <label htmlFor="style-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                Style Prompt
              </label>
              <textarea
                id="style-prompt"
                rows={3}
                className="w-full p-3 bg-white/5 border border-white/20 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-200 placeholder-gray-500"
                placeholder="e.g., cozy, minimalist, with a touch of bohemian chic"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
              />
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-400 mb-2">Need inspiration? Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-xs text-cyan-200 bg-cyan-900/50 rounded-full hover:bg-cyan-800/70 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={isLoading || roomImages.length === 0}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-5 h-5 mr-3" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-3" />
                  Generate Designs
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                    <div>
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                </div>
            </div>
          )}

          {results.length > 0 && (
            <div ref={resultsRef} className="space-y-8 pt-4">
               <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">Your New Looks!</h2>
               <div className="grid grid-cols-1 gap-8 md:gap-12">
                 {results.map((result, index) => (
                   <ResultCard 
                    key={index} 
                    description={result.idea.description} 
                    beforeImage={result.enhancedBeforeImage}
                    afterImage={result.idea.image} />
                 ))}
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;