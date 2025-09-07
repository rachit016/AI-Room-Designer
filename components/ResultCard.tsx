import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { SpeakerWaveIcon, SpeakerXMarkIcon, DownloadIcon, ChevronDownIcon } from './Icons';

interface ResultCardProps {
  description: string;
  beforeImage: string; // base64 encoded image data
  afterImage: string;  // base64 encoded image data
}

export const ResultCard: React.FC<ResultCardProps> = ({ description, beforeImage, afterImage }) => {
  const { togglePlay, isPlaying } = useAudioPlayer();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNarration = () => {
    togglePlay(description);
  };

  const downloadImage = (href: string, filename: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAfter = () => {
    downloadImage(`data:image/png;base64,${afterImage}`, 'ai-design-after.png');
    setIsDropdownOpen(false);
  };
  
  const createComparisonImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const before = new Image();
      const after = new Image();
      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          const height = Math.max(before.height, after.height);
          const beforeScaledWidth = before.width * (height / before.height);
          const afterScaledWidth = after.width * (height / after.height);
          
          const canvas = document.createElement('canvas');
          canvas.width = beforeScaledWidth + afterScaledWidth;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return reject(new Error('Failed to get canvas context.'));
          }

          ctx.drawImage(before, 0, 0, beforeScaledWidth, height);
          ctx.drawImage(after, beforeScaledWidth, 0, afterScaledWidth, height);
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.font = 'bold 20px Inter, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          
          ctx.fillRect(0, height - 40, 100, 40);
          ctx.fillStyle = 'white';
          ctx.fillText('BEFORE', 50, height - 20);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(beforeScaledWidth, height - 40, 90, 40);
          ctx.fillStyle = 'white';
          ctx.fillText('AFTER', beforeScaledWidth + 45, height - 20);

          resolve(canvas.toDataURL('image/png'));
        }
      };

      before.onload = after.onload = onImageLoad;
      before.onerror = after.onerror = (err) => reject(err);

      before.src = `data:image/png;base64,${beforeImage}`;
      after.src = `data:image/png;base64,${afterImage}`;
    });
  };

  const handleDownloadComparison = async () => {
    try {
      const comparisonImage = await createComparisonImage();
      downloadImage(comparisonImage, 'ai-design-comparison.png');
    } catch (error) {
      console.error("Failed to create or download comparison image:", error);
    } finally {
        setIsDropdownOpen(false);
    }
  };

  const handleDownloadBoth = async () => {
    handleDownloadAfter();
    await handleDownloadComparison();
    setIsDropdownOpen(false);
  };
  
  return (
    <div className="glass-card rounded-xl shadow-2xl transition-shadow duration-300 hover:shadow-cyan-500/20">
      <div className="grid grid-cols-2 gap-px bg-black/20 overflow-hidden rounded-t-xl h-[60vh] max-h-[700px]">
        <div className="relative group hover:z-20">
            <img
                src={`data:image/png;base64,${beforeImage}`}
                alt="Room before"
                className="relative w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded">BEFORE</div>
        </div>
        <div className="relative group hover:z-20">
            <img
                src={`data:image/png;base64,${afterImage}`}
                alt="Generated decor idea"
                className="relative w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded">AFTER</div>
        </div>
      </div>
      <div className="p-4 rounded-b-xl">
        <div className="flex items-start justify-between gap-4">
          <p className="text-gray-300 text-sm flex-grow">{description}</p>
          <div className="flex-shrink-0 flex items-center gap-2">
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-gray-300 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-colors"
                aria-label="Download options"
              >
                <DownloadIcon className="w-5 h-5" />
                <ChevronDownIcon className="w-4 h-4 -mr-1" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30 border border-slate-700">
                  <div className="py-1">
                    <button onClick={handleDownloadAfter} className="text-left w-full block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Download After</button>
                    <button onClick={handleDownloadComparison} className="text-left w-full block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Download Comparison</button>
                    <button onClick={handleDownloadBoth} className="text-left w-full block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Download Both</button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleNarration}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-colors"
              aria-label={isPlaying ? 'Stop narration' : 'Narrate description'}
            >
              {isPlaying ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};