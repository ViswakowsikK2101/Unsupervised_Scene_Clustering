"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Github, Sparkles, Activity } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-2xl h-16 flex items-center">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <div className="w-full h-full bg-gray-950 rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
              <Film className="w-4 h-4 text-cyan-300 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              SceneCluster
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                CV-ML
              </span>
            </span>
          </div>
        </Link>
        
        {/* Nav links & Engine status */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI ML Engine: <strong className="text-gray-200">Online</strong></span>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            <Link 
              href="/" 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive('/') 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Analyze
            </Link>
            <Link 
              href="/history" 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive('/history') 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              History
            </Link>
          </div>

          <a
            href="https://github.com/ViswakowsikK2101/Unsupervised_Scene_Clustering"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl border border-white/[0.06] transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  );
}
