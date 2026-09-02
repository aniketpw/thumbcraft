import React from 'react';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Layers, 
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeaderProps {
  onDownload: (format: 'png' | 'jpeg') => void;
  onCopyClipboard: () => void;
  onOpenBatchModal: () => void;
  onRandomizeTheme: () => void;
  onOpenPresets: () => void;
  isCopied: boolean;
  resolution: '720p' | '1080p';
  setResolution: (res: '720p' | '1080p') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onDownload,
  onCopyClipboard,
  onOpenBatchModal,
  isCopied,
  resolution,
  setResolution
}) => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/20 font-black text-sm">
            PW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Thumb<span className="text-cyan-600">Craft</span>
              </span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                1-CLICK GENERATOR
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Paste chapter & lecture details → Instant HD Thumbnail
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Batch Schedule Generator */}
          <button
            onClick={onOpenBatchModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
            title="Generate whole week schedule (Batch Export)"
          >
            <Layers className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Batch Multi-Lec</span>
          </button>

          {/* Resolution Picker */}
          <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 sm:flex">
            <button
              onClick={() => setResolution('720p')}
              className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                resolution === '720p'
                  ? 'bg-white text-cyan-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              720p
            </button>
            <button
              onClick={() => setResolution('1080p')}
              className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                resolution === '1080p'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1080p FHD
            </button>
          </div>

          {/* Copy to Clipboard */}
          <button
            onClick={() => {
              onCopyClipboard();
              triggerConfetti();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 shadow-xs"
            title="Copy image directly to clipboard"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-600" />
                <span className="hidden md:inline">Copy</span>
              </>
            )}
          </button>

          {/* Primary 1-Click Download */}
          <div className="flex items-center shadow-sm">
            <button
              onClick={() => {
                onDownload('png');
                triggerConfetti();
              }}
              className="flex items-center gap-1.5 rounded-l-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-cyan-700 active:scale-95 sm:px-4"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download HD</span>
            </button>
            <button
              onClick={() => {
                onDownload('jpeg');
                triggerConfetti();
              }}
              className="rounded-r-lg border-l border-cyan-500 bg-cyan-700 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-cyan-800"
              title="Download as JPG"
            >
              JPG
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
