import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  X, 
  ExternalLink,
  ClipboardPaste,
  Users
} from "lucide-react";
import { fetchGoogleSheetLive, parseCSV, processSheetData, GoogleSheetSyncResult } from "../utils/googleSheetSync";
import { TeacherProfile, BatchPreset } from "../types/thumbnail";

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  onSyncSuccess: (result: GoogleSheetSyncResult) => void;
  syncedTeachersCount: number;
  syncedBatchesCount: number;
  lastSyncedAt?: string;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  sheetUrl,
  setSheetUrl,
  onSyncSuccess,
  syncedTeachersCount,
  syncedBatchesCount,
  lastSyncedAt
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedCsv, setPastedCsv] = useState("");

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    if (!sheetUrl.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a valid Google Sheet link." });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Connecting to Google Sheet & loading faculty data..." });

    try {
      const result = await fetchGoogleSheetLive(sheetUrl);
      onSyncSuccess(result);
      setStatusMessage({
        type: "success",
        text: `Successfully synced ${result.teachers.length} teachers and ${result.batches.length} batches!`
      });
    } catch (err: any) {
      console.warn("Live sync error:", err);
      setStatusMessage({
        type: "error",
        text: (err.message || "Failed to fetch.") + " If access is restricted, click \"Paste Rows / CSV\" below to paste directly."
      });
      setShowPasteArea(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPastedData = () => {
    if (!pastedCsv.trim()) {
      setStatusMessage({ type: "error", text: "Please paste your sheet rows or CSV data." });
      return;
    }

    try {
      // Support comma, tab or semicolon separated
      const normalized = pastedCsv.includes("\t") 
        ? pastedCsv.split("\n").map(r => r.split("\t"))
        : parseCSV(pastedCsv);

      const { teachers, batches } = processSheetData(normalized);
      if (teachers.length === 0 && batches.length === 0) {
        setStatusMessage({ type: "error", text: "Could not detect any teacher names. Please make sure column headers like Name, Subject, Photo URL exist." });
        return;
      }

      const result: GoogleSheetSyncResult = {
        teachers,
        batches,
        lastSyncedAt: new Date().toLocaleTimeString()
      };

      try {
        localStorage.setItem("pw_synced_sheet_data", JSON.stringify(result));
      } catch (e) {}

      onSyncSuccess(result);
      setStatusMessage({
        type: "success",
        text: `Successfully loaded ${teachers.length} teachers & ${batches.length} batches from pasted data!`
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to parse pasted data: " + err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Google Sheets Live Data Sync
              </h2>
              <p className="text-xs text-slate-500">
                Auto-sync Teachers, Cutout Photos, Subjects & Batches directly from Google Sheet
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Synced Teachers</div>
              <div className="mt-1 text-lg font-black text-slate-900">{syncedTeachersCount}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Synced Batches</div>
              <div className="mt-1 text-lg font-black text-slate-900">{syncedBatchesCount}</div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Last Synced</div>
              <div className="mt-1 text-xs font-bold text-emerald-700">{lastSyncedAt || "Not yet synced"}</div>
            </div>
          </div>

          {/* Google Sheet Link Input */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Google Sheet Sharing URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
              />
              <button
                onClick={handleSyncNow}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "Syncing..." : "Sync Sheet"}</span>
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Make sure General Access is set to <strong>"Anyone with the link can view"</strong></span>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-cyan-700 hover:underline"
              >
                <span>Open Sheet</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
              statusMessage.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" :
              statusMessage.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
              "bg-cyan-50 border border-cyan-200 text-cyan-800"
            }`}>
              {statusMessage.type === "success" ? <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" /> :
               statusMessage.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" /> :
               <RefreshCw className="h-4 w-4 shrink-0 text-cyan-600 mt-0.5 animate-spin" />}
              <div>{statusMessage.text}</div>
            </div>
          )}

          {/* Direct Paste / Fallback Option */}
          <div className="border-t border-slate-200 pt-3">
            <button
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
            >
              <ClipboardPaste className="h-4 w-4 text-emerald-600" />
              <span>{showPasteArea ? "Hide Direct Paste" : "Or Paste Rows / CSV Data Directly"}</span>
            </button>

            {showPasteArea && (
              <div className="mt-2.5 space-y-2">
                <p className="text-[11px] text-slate-500">
                  Copy rows from your sheet (including headers like <code>Name, Subject, Photo URL, Batch</code>) and paste below:
                </p>
                <textarea
                  rows={5}
                  value={pastedCsv}
                  onChange={(e) => setPastedCsv(e.target.value)}
                  placeholder="Name	Subject	Photo URL	Batch&#10;Rajwant Sir	Physics	https://...	LAKSHYA 2026&#10;Pankaj Sir	Chemistry	https://...	SIP 2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
                <button
                  onClick={handleApplyPastedData}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Parse & Apply Pasted Data</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
