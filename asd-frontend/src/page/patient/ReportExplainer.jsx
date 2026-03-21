import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Download, Eye, Tag, X, File, CheckCircle2, Trash2, Lock } from "lucide-react";

const tags = ["All", "MRI", "Blood Test", "PDF Report", "Doctor Note"];

const reports = [
  { id: 1, name: "fMRI_Scan_Oct2026.nii", type: "MRI", date: "Oct 10, 2026", size: "142 MB", tag: "MRI", status: "analyzed" },
  { id: 2, name: "Blood_Report_Sep2026.pdf", type: "PDF", date: "Sep 28, 2026", size: "0.8 MB", tag: "Blood Test", status: "pending" },
  { id: 3, name: "Doctor_Note_Chen.pdf", type: "PDF", date: "Sep 22, 2026", size: "0.2 MB", tag: "Doctor Note", status: "analyzed" },
  { id: 4, name: "EEG_Results_Aug2026.pdf", type: "PDF", date: "Aug 15, 2026", size: "1.4 MB", tag: "PDF Report", status: "analyzed" },
];

export default function Reports() {
  const [selectedTag, setSelectedTag] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [consent, setConsent] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFile = (f) => { setUploadedFile(f); };
  const handleUpload = () => {
    if (!consent || !uploadedFile) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); setUploadDone(true); }, 2000);
  };

  const filtered = selectedTag === "All" ? reports : reports.filter(r => r.tag === selectedTag);

  return (
    <div className="p-5 lg:p-8 pb-24 md:pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">View, upload, and manage your medical records</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UploadCloud size={18} className="text-blue-600" /> Upload New Report
          </h2>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className={`relative w-full border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center py-10 cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <input type="file" onChange={e => handleFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            {uploadedFile ? (
              <div className="text-center">
                <File size={40} className="text-blue-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 dark:text-white">{uploadedFile.name}</p>
                <p className="text-sm text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-800 dark:text-gray-200">Drag & drop or click to upload</p>
                <p className="text-sm text-gray-400 mt-1">Supports PDF, NII, DICOM, JPG, PNG (max 500MB)</p>
              </div>
            )}
          </div>
          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1"><Lock size={13} className="text-emerald-500" /> Data Privacy Consent</span>
              <p className="text-xs mt-0.5 text-gray-400">I consent to my report being securely processed. All data is encrypted and HIPAA compliant.</p>
            </div>
          </label>
          {uploadDone ? (
            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 size={18} /> Report uploaded successfully!
            </div>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!uploadedFile || !consent || uploading}
              className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition active:scale-95"
            >
              {uploading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</> : <><UploadCloud size={16} /> Upload Report</>}
            </button>
          )}
        </div>

        {/* Filter Tags */}
        <div className="flex gap-2 flex-wrap mb-5">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedTag === tag ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
            >
              <Tag size={11} /> {tag}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-4 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{r.date} · {r.size}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'analyzed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'}`}>
                    {r.status === 'analyzed' ? 'AI Analyzed' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400 shrink-0">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" title="Preview"><Eye size={16} /></button>
                <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 rounded-lg transition" title="Download"><Download size={16} /></button>
                <button className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 rounded-lg transition" title="Delete"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
