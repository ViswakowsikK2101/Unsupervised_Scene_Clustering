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

  if (selectedFile) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-500/20 text-primary-400 rounded-lg">
            <FileVideo className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-200">{selectedFile.name}</h4>
            <p className="text-sm text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFileSelect(null);
          }}
          className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out flex flex-col items-center justify-center gap-4
        ${isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'}
        ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-800 text-gray-400'}`}>
        <Upload className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-1">
          {isDragActive ? "Drop video here" : "Drag & drop video"}
        </h3>
        <p className="text-sm text-gray-400">
          or click to browse from your computer
        </p>
      </div>
      <div className="text-xs text-gray-500 mt-2 flex gap-4">
        <span>MP4, AVI, MKV, MOV</span>
        <span>•</span>
        <span>Max 500MB</span>
      </div>
    </div>
  );
}
