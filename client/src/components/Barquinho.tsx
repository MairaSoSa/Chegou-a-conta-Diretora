import { cn } from "@/lib/utils";

interface BarquinhoProps {
  className?: string;
  floating?: boolean;
}

export function Barquinho({ className, floating = true }: BarquinhoProps) {
  return (
    <div className={cn("relative", floating && "animate-float", className)}>
      <svg 
        viewBox="0 0 180 90" 
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 3px 6px rgba(101,67,33,0.3))' }}
      >
        <defs>
          <linearGradient id="ghibliHull" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5E6D3" />
            <stop offset="60%" stopColor="#E8D4BC" />
            <stop offset="100%" stopColor="#D4C4A8" />
          </linearGradient>
          <linearGradient id="ghibliCabin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5A2B" />
            <stop offset="100%" stopColor="#654321" />
          </linearGradient>
          <linearGradient id="ghibliRoof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C75146" />
            <stop offset="50%" stopColor="#A63D33" />
            <stop offset="100%" stopColor="#8B2E24" />
          </linearGradient>
          <linearGradient id="ghibliWater" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,115,85,0)" />
            <stop offset="30%" stopColor="rgba(139,115,85,0.3)" />
            <stop offset="50%" stopColor="rgba(160,130,90,0.4)" />
            <stop offset="70%" stopColor="rgba(139,115,85,0.3)" />
            <stop offset="100%" stopColor="rgba(139,115,85,0)" />
          </linearGradient>
        </defs>
        
        <ellipse cx="90" cy="72" rx="75" ry="8" fill="url(#ghibliWater)" opacity="0.6" />
        
        <path 
          d="M20 55 
             C15 55 12 50 14 45
             L22 38
             C28 34 40 32 55 32
             L125 32
             C140 32 152 34 158 38
             L166 45
             C168 50 165 55 160 55
             C155 58 145 60 90 60
             C35 60 25 58 20 55
             Z" 
          fill="url(#ghibliHull)" 
          stroke="#8B7355"
          strokeWidth="1.5"
        />
        
        <path d="M25 48 L155 48" stroke="#C75146" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 42 L152 42" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
        <path d="M23 54 L157 54" stroke="#C75146" strokeWidth="1.5" strokeLinecap="round" />
        
        <circle cx="35" cy="48" r="3.5" fill="#F5E6D3" stroke="#8B7355" strokeWidth="1" />
        <circle cx="48" cy="48" r="3.5" fill="#F5E6D3" stroke="#8B7355" strokeWidth="1" />
        
        <path 
          d="M55 32 
             L55 18
             C55 14 60 12 70 12
             L110 12
             C120 12 125 14 125 18
             L125 32" 
          fill="url(#ghibliCabin)" 
          stroke="#4A3728"
          strokeWidth="1"
        />
        
        <rect x="62" y="16" width="10" height="12" rx="1.5" fill="#87CEEB" stroke="#4A3728" strokeWidth="0.8">
          <animate attributeName="fill" values="#87CEEB;#9DD5F0;#87CEEB" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="78" y="16" width="10" height="12" rx="1.5" fill="#87CEEB" stroke="#4A3728" strokeWidth="0.8">
          <animate attributeName="fill" values="#87CEEB;#9DD5F0;#87CEEB" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </rect>
        <rect x="94" y="16" width="10" height="12" rx="1.5" fill="#87CEEB" stroke="#4A3728" strokeWidth="0.8">
          <animate attributeName="fill" values="#87CEEB;#9DD5F0;#87CEEB" dur="3s" repeatCount="indefinite" begin="1s" />
        </rect>
        <rect x="110" y="16" width="10" height="12" rx="1.5" fill="#87CEEB" stroke="#4A3728" strokeWidth="0.8">
          <animate attributeName="fill" values="#87CEEB;#9DD5F0;#87CEEB" dur="3s" repeatCount="indefinite" begin="1.5s" />
        </rect>
        
        <path 
          d="M52 12 
             C52 6 60 3 90 3
             C120 3 128 6 128 12" 
          fill="url(#ghibliRoof)" 
          stroke="#6B2318"
          strokeWidth="1"
        />
        
        <path d="M60 12 C60 7 75 5 90 5 C105 5 120 7 120 12" fill="none" stroke="#8B3A2F" strokeWidth="0.5" opacity="0.5" />
        
        <rect x="87" y="0" width="6" height="5" rx="1" fill="#654321" />
        <line x1="90" y1="0" x2="90" y2="-8" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M90 -8 L90 -12 L100 -10 L90 -8" fill="#2E7D32" stroke="#1B5E20" strokeWidth="0.5" />
        
        <rect x="130" y="24" width="20" height="8" rx="2" fill="#E8D4BC" stroke="#8B7355" strokeWidth="0.8" />
        <rect x="133" y="26" width="6" height="4" rx="1" fill="#87CEEB" stroke="#4A3728" strokeWidth="0.5" />
        <circle cx="145" cy="28" r="1.5" fill="#333" />
        
        <text 
          x="70" 
          y="40" 
          fontFamily="Georgia, serif" 
          fontSize="6" 
          fontWeight="bold"
          fill="#8B3A2F"
          opacity="0.9"
        >
          DIRETORA
        </text>
        
        <circle cx="148" cy="48" r="2.5" fill="#F5E6D3" stroke="#8B7355" strokeWidth="0.8" />
        <circle cx="148" cy="48" r="1" fill="#C75146" />
      </svg>
      
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-36 h-5 pointer-events-none overflow-hidden opacity-70">
        <svg viewBox="0 0 120 20" className="w-full h-full">
          <path 
            d="M-10 10 Q5 6 20 10 T50 10 T80 10 T110 10 T140 10" 
            fill="none" 
            stroke="rgba(139,115,85,0.5)" 
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-wave-flow"
          />
          <path 
            d="M-20 14 Q0 10 15 14 T45 14 T75 14 T105 14 T135 14" 
            fill="none" 
            stroke="rgba(139,115,85,0.35)" 
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-wave-flow-2"
          />
        </svg>
      </div>
    </div>
  );
}
