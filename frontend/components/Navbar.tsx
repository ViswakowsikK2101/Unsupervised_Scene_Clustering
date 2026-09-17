"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-t-0 border-x-0 border-b border-gray-800/60 bg-gray-950/60 h-16 flex items-center">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors">
          <Film className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight text-white">SceneCluster</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Home
          </Link>
          <Link 
            href="/history" 
            className={`text-sm font-medium transition-colors ${
              isActive('/history') ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
