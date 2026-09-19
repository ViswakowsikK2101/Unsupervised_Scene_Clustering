"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileVideo, X } from "lucide-react";

interface VideoUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function VideoUploader({ onFileSelect, selectedFile }: VideoUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mkv', '.mov']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const loadSample = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'video/mp4' });
      onFileSelect(file);
    } catch (e) {
      console.error("Failed to load sample video:", e);
    }
  };

  if (selectedFile) {
    return (
      <div className="bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-gray-950/90 border border-white/[0.1] rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <FileVideo className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-base">{selectedFile.name}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Ready
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · MP4 Video File
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFileSelect(null);
          }}
          className="p-2.5 hover:bg-white/[0.08] rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/[0.1]"
          title="Remove video"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-4 group
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-[1.01]' 
            : 'border-white/[0.1] hover:border-indigo-500/40 hover:bg-white/[0.02]'
          }
          ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className={`p-4 rounded-2xl transition-all duration-300 ${
          isDragActive 
            ? 'bg-indigo-500/20 text-indigo-300 scale-110' 
            : 'bg-white/[0.04] text-gray-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 border border-white/[0.06]'
        }`}>
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            {isDragActive ? "Drop video to begin analysis" : "Drag & drop video to cluster scenes"}
          </h3>
          <p className="text-xs text-gray-400">
            Click to browse your local computer or drop an MP4 / AVI / MKV file
          </p>
        </div>
        <div className="text-[11px] text-gray-500 flex items-center gap-3">
          <span>MP4, AVI, MKV, MOV</span>
          <span>•</span>
          <span>Max 500MB</span>
        </div>
      </div>

      {/* 1-Click Sample Preset Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 px-1 text-xs">
        <span className="text-gray-400 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          Or test instantly with a demo preset:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadSample('/samples/sintel_trailer.mp4', 'sintel_trailer.mp4')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-indigo-500/10 border border-white/[0.08] hover:border-indigo-500/30 text-gray-300 hover:text-indigo-300 transition-all font-medium flex items-center gap-1.5"
          >
            <span>🎬</span>
            <span>Sintel Trailer (4.3 MB)</span>
          </button>
          <button
            type="button"
            onClick={() => loadSample('/samples/bunny_trailer.mp4', 'bunny_trailer.mp4')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.08] hover:border-cyan-500/30 text-gray-300 hover:text-cyan-300 transition-all font-medium flex items-center gap-1.5"
          >
            <span>🐰</span>
            <span>Big Buck Bunny (11 MB)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
