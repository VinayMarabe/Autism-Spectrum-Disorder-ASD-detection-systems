import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, UploadCloud, Zap, TrendingUp, AlertCircle, CheckCircle2, XCircle, ArrowRight, FileText } from "lucide-react";

export default function AIAnalysis() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    setResults(null);
    setTimeout(() => {
      setAnalyzing(false);
      setResults({
        summary: "The fMRI scan reveals reduced functional connectivity in the prefrontal-amygdala network. This pattern is consistent with mild ASD markers. No acute abnormalities detected.",
        severity: "Mild",
        confidence: 87,
        findings: [
          { type: "warning", text: "Reduced connectivity in Default Mode Network (DMN)" },
          { type: "info", text: "Atypical activation pattern in language processing areas" },
          { type: "success", text: "Sensory cortex response within normal range" },
          { type: "warning", text: "Elevated amygdala reactivity suggesting anxiety sensitivity" },
        ],
        suggestions: [
          "Consider Sensory Integration Therapy sessions",
          "Behavioral intervention focus on social communication",
          "Follow-up fMRI in 6 months to track connectivity changes",
          "Discuss anxiety management strategies with specialist",
        ]
      });
    }, 3000);
  };

  return (
    <div className="p-5 lg:p-8 pb-24 md:pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">AI Report Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Upload any medical report and get AI-powered insights in plain language</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div
            className={`relative border-2 border-dashed rounded-2xl py-10 flex flex-col items-center transition-all cursor-pointer ${file ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <input type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.nii,.jpg,.png,.dcm" className="absolute inset-0 opacity-0 cursor-pointer" />
            {file ? (
              <div className="text-center">
                <FileText size={40} className="text-blue-600 mx-auto mb-3" />
                <p className="font-bold text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready for analysis</p>
              </div>
            ) : (
              <div className="text-center">
                <BrainCircuit size={44} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-bold text-gray-700 dark:text-gray-200">Upload Medical Report</p>
                <p className="text-sm text-gray-400 mt-1">Supports PDF, NII, DICOM, JPG, PNG</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition active:scale-95"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI is reading your report...
              </>
            ) : (
              <><Zap size={18} /> Analyze with AI</>
            )}
          </button>
        </div>

        {/* Loading State */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white mb-6 text-center"
            >
              <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-1">Reading your report...</h3>
              <p className="text-indigo-200 text-sm">Our AI is scanning medical terminology, imaging patterns, and clinical markers</p>
              <div className="mt-4 flex justify-center gap-2">
                {["Parsing document", "Analyzing patterns", "Generating insights"].map((s, i) => (
                  <span key={i} className="text-xs bg-white/10 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results && !analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BrainCircuit size={20} className="text-blue-600" />
                  <h3 className="font-headline font-bold text-gray-900 dark:text-white">AI Summary</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{results.summary}</p>
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-bold">Severity: {results.severity}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                    <TrendingUp size={14} className="text-blue-600" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">{results.confidence}% Confidence</span>
                  </div>
                </div>
              </div>

              {/* Findings */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="font-headline font-bold text-gray-900 dark:text-white mb-4">Key Findings</h3>
                <div className="space-y-3">
                  {results.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {f.type === "warning" && <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />}
                      {f.type === "success" && <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
                      {f.type === "info" && <BrainCircuit size={16} className="text-blue-500 shrink-0 mt-0.5" />}
                      <p className="text-sm text-gray-700 dark:text-gray-300">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-300" /> AI Recommendations</h3>
                <div className="space-y-2.5">
                  {results.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-blue-100">
                      <ArrowRight size={14} className="text-blue-300 shrink-0 mt-0.5" />
                      <p>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
