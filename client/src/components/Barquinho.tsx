import { cn } from "@/lib/utils";

interface BarquinhoProps {
  className?: string;
  floating?: boolean;
}

export function Barquinho({ className, floating = true }: BarquinhoProps) {
  return (
    <div className={cn("relative", floating && "animate-float", className)}>
      <svg 
        viewBox="0 0 200 100" 
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}
      >
        <defs>
          <linearGradient id="hullBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDF5E6" />
            <stop offset="100%" stopColor="#E8DCC8" />
          </linearGradient>
          <linearGradient id="cabinRoof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C41E3A" />
            <stop offset="100%" stopColor="#8B0000" />
          </linearGradient>
          <linearGradient id="waterReflect" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(139,69,19,0.3)" />
            <stop offset="100%" stopColor="rgba(139,69,19,0)" />
          </linearGradient>
        </defs>
        
        <path 
          d="M25 70 
             Q15 68 12 60 
             L18 48 
             Q22 42 35 40 
             L165 40 
             Q178 42 182 48 
             L188 60 
             Q185 68 175 70 
             Z" 
          fill="url(#hullBase)" 
          stroke="#8B4513" 
          strokeWidth="2"
        />
        
        <path 
          d="M20 58 L180 58" 
          stroke="#C41E3A" 
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path 
          d="M22 52 L178 52" 
          stroke="#166534" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path 
          d="M20 64 L180 64" 
          stroke="#C41E3A" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        <ellipse cx="30" cy="58" rx="4" ry="4" fill="#FDF5E6" stroke="#8B4513" strokeWidth="1.5" />
        <ellipse cx="45" cy="58" rx="4" ry="4" fill="#FDF5E6" stroke="#8B4513" strokeWidth="1.5" />
        
        <path 
          d="M55 40 
             L55 25 
             Q55 20 60 18 
             L140 18 
             Q145 20 145 25 
             L145 40" 
          fill="#FDF5E6" 
          stroke="#8B4513" 
          strokeWidth="1.5"
        />
        
        <rect x="60" y="22" width="12" height="14" rx="1" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1" />
        <rect x="78" y="22" width="12" height="14" rx="1" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1" />
        <rect x="96" y="22" width="12" height="14" rx="1" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1" />
        <rect x="114" y="22" width="12" height="14" rx="1" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1" />
        <rect x="132" y="22" width="8" height="14" rx="1" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1" />
        
        <path 
          d="M52 18 
             L52 10 
             Q52 5 60 3 
             L140 3 
             Q148 5 148 10 
             L148 18" 
          fill="url(#cabinRoof)" 
          stroke="#5D0000" 
          strokeWidth="1"
        />
        
        <path d="M55 18 L55 3" stroke="#8B0000" strokeWidth="1" />
        <path d="M70 18 L70 4" stroke="#8B0000" strokeWidth="0.5" />
        <path d="M85 18 L85 4" stroke="#8B0000" strokeWidth="0.5" />
        <path d="M100 18 L100 3" stroke="#8B0000" strokeWidth="1" />
        <path d="M115 18 L115 4" stroke="#8B0000" strokeWidth="0.5" />
        <path d="M130 18 L130 4" stroke="#8B0000" strokeWidth="0.5" />
        <path d="M145 18 L145 3" stroke="#8B0000" strokeWidth="1" />
        
        <rect x="97" y="0" width="6" height="6" fill="#C41E3A" stroke="#8B0000" strokeWidth="0.5" />
        <path d="M100 0 L100 -8" stroke="#5D4E37" strokeWidth="1.5" />
        <path d="M100 -8 L100 -12 L108 -10 L100 -8" fill="#166534" stroke="#0D4D1F" strokeWidth="0.5" />
        
        <rect x="152" y="30" width="25" height="10" rx="2" fill="#FDF5E6" stroke="#8B4513" strokeWidth="1" />
        <rect x="155" y="32" width="8" height="6" rx="1" fill="#87CEEB" stroke="#5D4E37" strokeWidth="0.5" />
        <circle cx="170" cy="35" r="2" fill="#333" />
        
        <text 
          x="85" 
          y="50" 
          fontFamily="serif" 
          fontSize="8" 
          fontWeight="bold"
          fill="#C41E3A"
          stroke="#8B0000"
          strokeWidth="0.3"
        >
          DIRETORA
        </text>
        
        <path 
          d="M18 70 Q15 68 12 65" 
          stroke="#8B4513" 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
        />
        <path 
          d="M182 70 Q185 68 188 65" 
          stroke="#8B4513" 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
        />
        
        <circle cx="165" cy="58" r="3" fill="#FDF5E6" stroke="#8B4513" strokeWidth="1" />
        <circle cx="165" cy="58" r="1.5" fill="#C41E3A" />
        
        <path 
          d="M25 71 Q100 76 175 71 Q100 78 25 71" 
          fill="url(#waterReflect)"
          opacity="0.5"
        />
      </svg>
      
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 100 20" className="w-full h-full">
          <path 
            d="M0 10 Q12 5 25 10 T50 10 T75 10 T100 10" 
            fill="none" 
            stroke="rgba(139,90,43,0.4)" 
            strokeWidth="2"
            className="animate-wave-flow"
          />
          <path 
            d="M-25 12 Q0 7 12 12 T37 12 T62 12 T87 12 T112 12" 
            fill="none" 
            stroke="rgba(139,90,43,0.3)" 
            strokeWidth="1.5"
            className="animate-wave-flow-2"
          />
        </svg>
      </div>
    </div>
  );
}
