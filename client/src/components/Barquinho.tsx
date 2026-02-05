import { cn } from "@/lib/utils";

interface BarquinhoProps {
  className?: string;
  floating?: boolean;
}

export function Barquinho({ className, floating = true }: BarquinhoProps) {
  return (
    <div className={cn("relative", floating && "animate-float", className)}>
      <svg 
        viewBox="0 0 120 60" 
        className="w-full h-full drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
      >
        <defs>
          <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#654321" />
            <stop offset="100%" stopColor="#3D2914" />
          </linearGradient>
          <linearGradient id="lonaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>
        </defs>
        
        <path 
          d="M15 40 Q10 40 8 35 L12 20 Q15 18 25 18 L95 18 Q105 18 108 20 L112 35 Q110 40 105 40 Z" 
          fill="url(#woodGradient)" 
          stroke="#3D2914" 
          strokeWidth="1"
        />
        
        <path 
          d="M20 18 L20 10 Q20 5 30 5 L60 3 L90 5 Q100 5 100 10 L100 18" 
          fill="url(#lonaGradient)" 
          stroke="#1B5E20" 
          strokeWidth="1"
        />
        
        <rect x="95" y="35" width="20" height="8" rx="2" fill="#555" />
        <rect x="110" y="30" width="3" height="10" fill="#333" />
        
        <rect x="25" y="22" width="18" height="12" rx="2" fill="#87CEEB" stroke="#fff" strokeWidth="1" />
        
        <ellipse cx="80" cy="28" rx="8" ry="5" fill="#DEB887" stroke="#8B4513" strokeWidth="1" />
        <path d="M75 25 Q80 20 85 25" stroke="#8B4513" strokeWidth="1" fill="none" />
        
        <path d="M18 38 Q14 38 12 35" stroke="#3D2914" strokeWidth="2" fill="none" />
        <path d="M102 38 Q106 38 108 35" stroke="#3D2914" strokeWidth="2" fill="none" />
      </svg>
      
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-6 pointer-events-none">
        <div className="absolute inset-0 flex justify-center gap-1">
          <span className="animate-wave-1 text-sky-300/60 text-lg">~</span>
          <span className="animate-wave-2 text-sky-300/50 text-lg">~</span>
          <span className="animate-wave-3 text-sky-300/60 text-lg">~</span>
          <span className="animate-wave-1 text-sky-300/50 text-lg">~</span>
          <span className="animate-wave-2 text-sky-300/60 text-lg">~</span>
        </div>
      </div>
    </div>
  );
}
