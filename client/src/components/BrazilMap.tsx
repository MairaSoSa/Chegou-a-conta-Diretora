

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import React, { useState } from "react";

const BRAZIL_TOPOJSON = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

const COLORS = [
  "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7",
  "#e76f51", "#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#f6bd60",
  "#f7ede2", "#f28482", "#84a59d", "#f5cac3", "#9a8c98", "#b5838d",
  "#6d6875", "#ffb4a2", "#b5ead7", "#c7ceea", "#ffdac1", "#e2f0cb",
  "#b5ead7", "#ffb7b2", "#b5ead7"
];

/* cores fixas para estados com problemas visuais no array acima */
const STATE_COLOR_OVERRIDES: Record<string, string> = {
  MT: "#d4554a",  /* terracota — contrasta com AM(mint), GO(verde-água), MS(amarelo) */
  RO: "#e8a825",  /* âmbar dourado — contrasta com AM(mint), AC(verde-escuro), PA(salmão) */
};

type Props = {
  onStateClick?: (uf: string) => void;
  ufStats?: Record<string, { name: string; escolas: number; color?: string }>;
};

export function BrazilMap({ onStateClick, ufStats }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; uf: string; escolas: number; name: string } | null>(null);
  // Para garantir cores únicas por estado, mapeia siglas para índice
  const ufColorMap = React.useMemo(() => {
    if (!ufStats) return {};
    const ufs = Object.keys(ufStats).sort();
    const map: Record<string, string> = {};
    ufs.forEach((uf, i) => {
      const customColor = ufStats[uf]?.color;
      map[uf] = customColor || STATE_COLOR_OVERRIDES[uf] || COLORS[i % COLORS.length];
    });
    return map;
  }, [ufStats]);

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "0 auto", position: "relative" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 850, center: [-55, -15] }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={BRAZIL_TOPOJSON}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const uf = geo.properties.sigla || geo.properties.UF || geo.properties.name;
              const stat = ufStats?.[uf];
              const fill = ufColorMap[uf] || STATE_COLOR_OVERRIDES[uf] || "#b7e4c7";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onStateClick && onStateClick(uf)}
                  onMouseEnter={e => {
                    if (!stat) return;
                    const bounds = (e.target as SVGPathElement).getBoundingClientRect();
                    setTooltip({
                      x: bounds.left + bounds.width / 2,
                      y: bounds.top,
                      uf,
                      escolas: stat.escolas,
                      name: stat.name,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { fill, outline: "none", cursor: "pointer" },
                    hover: { fill: "#40916c", outline: "none" },
                    pressed: { fill: "#2d6a4f", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y - 40,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            color: "#222",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 1000,
            transform: "translate(-50%, -100%)"
          }}
        >
          <strong>{tooltip.name} ({tooltip.uf})</strong><br />
          {tooltip.escolas} escolas
        </div>
      )}
    </div>
  );
}
