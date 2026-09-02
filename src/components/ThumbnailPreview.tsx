import React, { useRef, useEffect, useState } from 'react';
import { 
  Download, 
  Copy, 
  Maximize2, 
  Smartphone, 
  ShieldCheck, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { ThumbnailData } from '../types/thumbnail';
import { renderThumbnailToCanvas } from '../utils/canvasRenderer';
import confetti from 'canvas-confetti';

interface ThumbnailPreviewProps {
  thumbnailData: ThumbnailData;
  teacherImageUrl: string;
  onUpdateThumbnailData: (patch: Partial<ThumbnailData>) => void;
  onDownload: (format: 'png' | 'jpeg') => void;
  onCopyClipboard: () => void;
  isCopied: boolean;
}

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  thumbnailData,
  teacherImageUrl,
  onUpdateThumbnailData,
  onDownload,
  onCopyClipboard,
  isCopied
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  // Re-render canvas whenever data or teacher image changes
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        await renderThumbnailToCanvas(canvasRef.current, thumbnailData, teacherImageUrl);
        if (!isCancelled && canvasRef.current) {
          setPreviewDataUrl(canvasRef.current.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Render error:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    const timer = setTimeout(render, 40);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [thumbnailData, teacherImageUrl]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {/* Top Preview Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Live Preview
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
            {thumbnailData.resolution === '1080p' ? '1920 × 920' : '1280 × 614'}
          </span>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-1.5">
          {/* YT Safe Zone Toggle */}
          <button
            onClick={() => onUpdateThumbnailData({ showSafeZone: !thumbnailData.showSafeZone })}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all ${
              thumbnailData.showSafeZone
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle YouTube timestamp overlay simulation"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Safe Zone</span>
          </button>

          {/* Mobile Preview */}
          <button
            onClick={() => setShowMobilePreview(true)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            title="Preview how thumbnail looks in YouTube Mobile Feed"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile Feed</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setShowFullscreen(true)}
            className="rounded-lg border border-slate-200 bg-slate-50 p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            title="View Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Display Card */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100/50 shadow-inner flex items-center justify-center p-1.5">
        <canvas
          ref={canvasRef}
          className="h-auto max-h-[540px] w-full max-w-full rounded-lg object-contain shadow-md"
        />

        {isRendering && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-cyan-700 shadow-sm backdrop-blur">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Primary 1-Click Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={() => {
            onCopyClipboard();
            triggerConfetti();
          }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all active:scale-95"
        >
          {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
          <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Image'}</span>
        </button>

        <button
          onClick={() => {
            onDownload('png');
            triggerConfetti();
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all active:scale-95 sm:flex-initial"
        >
          <Download className="h-4 w-4" />
          <span>Download HD Thumbnail</span>
        </button>
      </div>

      {/* Mobile YouTube Feed Simulator Modal */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Smartphone className="h-4 w-4 text-cyan-600" />
                <span>YouTube Mobile Feed Preview</span>
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Simulated Phone Feed Item */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video w-full bg-slate-900">
                {previewDataUrl && (
                  <img src={previewDataUrl} alt="Preview" className="h-full w-full object-cover" />
                )}
                <div className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  48:32
                </div>
              </div>

              <div className="p-3">
                <div className="flex gap-2.5">
                  <div className="h-9 w-9 flex-shrink-0 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-black text-white">
                    PW
                  </div>
                  <div>
                    <h3 className="line-clamp-2 text-xs font-bold text-slate-900">
                      {thumbnailData.chapterTitle} | {thumbnailData.lectureLabel} {thumbnailData.lectureNo} | {thumbnailData.batchName}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Physics Wallah • 240K views • 2 hours ago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowMobilePreview(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div 
          onClick={() => setShowFullscreen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-h-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            {previewDataUrl && (
              <img src={previewDataUrl} alt="Fullscreen Thumbnail" className="h-auto w-full object-contain" />
            )}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload('png');
                  triggerConfetti();
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-cyan-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowFullscreen(false)}
                className="rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
