"use client";

import { useRef, useState, useTransition } from "react";
import { importLeadsFromCSV, CSVImportResult } from "@/app/dashboard/leads/import-actions";
import {
  Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle,
  AlertTriangle, Download, Loader2
} from "lucide-react";

const SAMPLE_CSV = `name,phone,email,budget,city,source
Rahul Gupta,9826011100,rahul@example.com,35L,Bhopal,referral
Anjali Singh,9826022200,,42 lakh,Bhopal,direct_call
Manoj Sharma,9826033300,manoj@example.com,5000000,Bhopal,website_form`;

export function CSVImportModal() {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [result, setResult] = useState<CSVImportResult | null>(null);

  function handleFileSelect(file: File) {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      alert("Sirf CSV file upload karo (.csv ya .txt)");
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("csv", selectedFile);
    startTransition(async () => {
      const res = await importLeadsFromCSV(null, fd);
      setResult(res);
    });
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "realtypilot_sample_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClose() {
    setOpen(false);
    setSelectedFile(null);
    setResult(null);
    formRef.current?.reset();
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
      >
        <Upload className="h-4 w-4" />
        CSV Import
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">CSV se Leads Import</h2>
                  <p className="text-xs text-slate-500">Excel ko CSV mein save karke upload karo</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Result — Success */}
              {result && result.success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">Import Complete!</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-700">✅ {result.imported} leads import hue</span>
                    {result.skipped > 0 && (
                      <span className="text-amber-600">⚠️ {result.skipped} skip hue</span>
                    )}
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-slate-600">Skip hue rows:</p>
                      {result.errors.slice(0, 5).map((err, i) => (
                        <div key={i} className="text-xs text-slate-500 bg-white rounded-lg px-3 py-1.5 border border-slate-100">
                          <span className="font-medium">Row {err.row}</span>
                          {err.name && ` — ${err.name}`}: {err.reason}
                        </div>
                      ))}
                      {result.errors.length > 5 && (
                        <p className="text-xs text-slate-400">...aur {result.errors.length - 5} errors</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleClose}
                    className="mt-3 w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Done — Leads Dekho
                  </button>
                </div>
              )}

              {/* Result — All Failed */}
              {result && !result.success && result.imported === 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Import fail hua</span>
                  </div>
                  {result.errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-xs text-red-600">Row {err.row}: {err.reason}</p>
                  ))}
                </div>
              )}

              {/* Upload Form — show only if no success yet */}
              {(!result || !result.success) && (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? "border-brand-400 bg-brand-50"
                        : selectedFile
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                      }}
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                        <p className="font-medium text-emerald-700">{selectedFile.name}</p>
                        <p className="text-xs text-emerald-600">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="text-xs text-slate-400 hover:text-red-500 underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-slate-300" />
                        <p className="font-medium text-slate-600">CSV file yahan drop karo</p>
                        <p className="text-xs text-slate-400">ya click karke select karo</p>
                        <p className="text-xs text-slate-300 mt-1">.csv format • Max 5MB</p>
                      </div>
                    )}
                  </div>

                  {/* CSV Format Info */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="text-xs font-semibold text-slate-700">CSV Format (Excel se save karke):</p>
                    </div>
                    <div className="font-mono text-xs text-slate-500 bg-white rounded-lg p-3 border border-slate-100 overflow-x-auto">
                      <div className="text-brand-600 font-semibold">name, phone, email, budget, city, source</div>
                      <div>Rahul Gupta, 9826011100, rahul@x.com, 35L, Bhopal, referral</div>
                      <div>Anjali Singh, 9826022200, , 42 lakh, Bhopal, direct_call</div>
                    </div>
                    <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
                      <li><strong>name</strong> aur <strong>phone</strong> — required</li>
                      <li>Budget: "35L", "35 lakh", ya "3500000" — sab work karte hain</li>
                      <li>Duplicate phones automatically skip ho jaate hain</li>
                      <li>Source: referral, direct_call, website_form, meta_ad, walk_in</li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={downloadSample}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Sample CSV
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedFile || isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Import ho raha hai...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Import Karo
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
