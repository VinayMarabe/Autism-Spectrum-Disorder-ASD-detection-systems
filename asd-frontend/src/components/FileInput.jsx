import React, { useRef } from "react";

const FileInput = ({ label, accept = "*/*", file, onChange, hint = "", className = "" }) => {
  const inputRef = useRef();
  const humanSize = (n) => {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  };
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <div onClick={() => inputRef.current?.click()} className="relative cursor-pointer rounded-xl border border-dashed border-slate-200 hover:border-slate-300 p-3 flex items-center gap-3 bg-white">
        <input ref={inputRef} type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" aria-label={label} />
        <div className="flex-1 text-xs text-slate-600">
          {file ? (
            <div>
              <div className="font-semibold text-slate-800">{file.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{humanSize(file.size)} • {file.type || "unknown type"}</div>
            </div>
          ) : (
            <div>
              <div className="text-slate-500">Click or drag file here to upload</div>
              {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
            </div>
          )}
        </div>
        <div className="text-[11px] px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100">Browse</div>
      </div>
    </div>
  );
};

export default FileInput;
