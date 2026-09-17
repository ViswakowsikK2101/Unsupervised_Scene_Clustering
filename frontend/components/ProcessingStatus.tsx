"use client";

import { Activity } from "lucide-react";

export default function ProcessingStatus() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-primary-500 border-r-accent-500 rounded-full animate-spin"></div>
          <Activity className="absolute text-white w-6 h-6 animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Analyzing Video</h2>
      <p className="text-gray-400 animate-pulse text-center max-w-md">
        Extracting frames, computing features, and performing clustering. This might take a few minutes depending on the video length...
      </p>

      <div className="mt-8 flex gap-3">
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
