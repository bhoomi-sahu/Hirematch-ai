import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const FileDropzone = ({ onFiles, multiple = false, maxFiles = 20, accept = 'application/pdf', disabled = false }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const allowedTypes = new Set([
        'application/pdf',
        'application/octet-stream',
        'application/x-pdf',
        'binary/octet-stream',
        'application/x-binary',
      ]);

      const files = Array.from(fileList).filter((f) => {
        const mimeType = (f.type || '').toLowerCase();
        const hasPdfExtension = (f.name || '').toLowerCase().endsWith('.pdf');
        return allowedTypes.has(mimeType) || hasPdfExtension;
      });

      if (files.length === 0) return;
      onFiles(multiple ? files.slice(0, maxFiles) : [files[0]]);
    },
    [onFiles, multiple, maxFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all duration-300 ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
          : dragging
          ? 'border-blue-500 bg-blue-50 scale-[1.01]'
          : 'border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
          dragging ? 'bg-blue-100 text-blue-600 scale-110' : 'bg-white text-slate-400 border border-slate-200 group-hover:text-blue-500'
        }`}
      >
        {dragging ? <FileText className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          {dragging ? 'Drop to upload' : multiple ? `Drag & drop up to ${maxFiles} PDF resumes` : 'Drag & drop your resume PDF'}
        </p>
        <p className="text-xs text-slate-500 mt-1">or click to browse · PDF only</p>
      </div>
    </div>
  );
};

export default FileDropzone;
