import React, { useState } from 'react';
import { 
  Layers, 
  Download, 
  FileArchive, 
  CheckCircle2, 
  X, 
  Play
} from 'lucide-react';
import { ThumbnailData } from '../types/thumbnail';
import { parseBatchScheduleInput } from '../utils/parser';
import { DEMO_BATCH_SCHEDULE } from '../utils/sampleData';
import { renderThumbnailToCanvas, downloadCanvasImage } from '../utils/canvasRenderer';
import JSZip from 'jszip';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseThumbnailData: ThumbnailData;
  teacherImageUrl: string;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  baseThumbnailData,
  teacherImageUrl
}) => {
  const [scheduleText, setScheduleText] = useState<string>(DEMO_BATCH_SCHEDULE);
  const [generatedList, setGeneratedList] = useState<Array<{ id: string; title: string; lec: string; dataUrl: string; filename: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  if (!isOpen) return null;

  const handleGenerateAll = async () => {
    const parsedItems = parseBatchScheduleInput(scheduleText);
    if (parsedItems.length === 0) return;

    setIsProcessing(true);
    const results: Array<{ id: string; title: string; lec: string; dataUrl: string; filename: string }> = [];

    // Create offscreen canvas for rendering
    const offscreen = document.createElement('canvas');

    for (let i = 0; i < parsedItems.length; i++) {
      const p = parsedItems[i];
      const itemData: ThumbnailData = {
        ...baseThumbnailData,
        chapterTitle: p.chapterTitle,
        lectureNo: p.lectureNo,
        lectureLabel: p.lectureLabel || 'LECTURE',
        subject: p.subject || baseThumbnailData.subject,
        batchName: p.batchName || baseThumbnailData.batchName,
        subtopics: p.subtopics.length > 0 ? p.subtopics : baseThumbnailData.subtopics,
        teacherName: p.teacherName || baseThumbnailData.teacherName
      };

      await renderThumbnailToCanvas(offscreen, itemData, teacherImageUrl);
      const dataUrl = offscreen.toDataURL('image/png');
      const safeTitle = p.chapterTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const safeLec = p.lectureNo.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${p.subject || 'Lecture'}_${safeTitle}_Lec${safeLec}.png`;

      results.push({
        id: `gen-${i}`,
        title: p.chapterTitle,
        lec: `${p.lectureLabel || 'Lec'} ${p.lectureNo}`,
        dataUrl,
        filename
      });
    }

    setGeneratedList(results);
    setIsProcessing(false);
  };

  const handleDownloadZip = async () => {
    if (generatedList.length === 0) return;
    setDownloadProgress('Creating ZIP bundle...');

    const zip = new JSZip();
    generatedList.forEach((item) => {
      // Remove data:image/png;base64, prefix
      const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
      zip.file(item.filename, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `Batch_Thumbnails_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadProgress('');
  };

  const handleDownloadSingle = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Multi-Lecture Batch Generator
              </h2>
              <p className="text-xs text-slate-500">
                Paste weekly schedule (1 line per lecture) → Generate & download all in 1 click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Paste Multi-Line Schedule
            </label>
            <textarea
              rows={4}
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              placeholder="Paste schedule lines..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleGenerateAll}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{isProcessing ? 'Generating Thumbnails...' : 'Generate All Thumbnails'}</span>
            </button>

            {generatedList.length > 0 && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <FileArchive className="h-4 w-4" />
                <span>{downloadProgress || `Download All as ZIP (${generatedList.length})`}</span>
              </button>
            )}
          </div>

          {/* Generated Thumbnails Grid */}
          {generatedList.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                Generated Thumbnails ({generatedList.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {generatedList.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <img src={item.dataUrl} alt={item.title} className="aspect-video w-full object-cover" />
                    <div className="p-2.5 flex items-center justify-between">
                      <div className="truncate text-xs font-bold text-slate-900">
                        {item.title}
                      </div>
                      <button
                        onClick={() => handleDownloadSingle(item.dataUrl, item.filename)}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                        title="Download PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
