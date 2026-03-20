
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

const STATE_COLOR_OVERRIDES: Record<string, string> = {
  MT: "#d4554a",
  RO: "#e8a825",
};

type Props = {
  onStateClick?: (uf: string) => void;
  ufStats?: Record<string, { name: string; escolas: number; matriculas?: number; color?: string }>;
  selectedUf?: string | null;
  clickedUf?: string | null;
};

export function BrazilMap({ onStateClick, ufStats, selectedUf, clickedUf }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; uf: string; escolas: number; matriculas?: number; name: string;
  } | null>(null);

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
      {/* Legenda */}
      {selectedUf && (
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#f59e0b", border: "2px solid #92400e" }} />
            Estado da sua escola
          </span>
          {clickedUf && clickedUf !== selectedUf && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#3b82f6", border: "2px solid #1e40af" }} />
              Estado selecionado
            </span>
          )}
        </div>
      )}

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
              const isSchoolState = selectedUf && uf === selectedUf;
              const isClickedState = clickedUf && uf === clickedUf && uf !== selectedUf;
              const baseFill = isSchoolState
                ? "#f59e0b"
                : isClickedState
                ? "#3b82f6"
                : (ufColorMap[uf] || STATE_COLOR_OVERRIDES[uf] || "#b7e4c7");

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
                      matriculas: stat.matriculas,
                      name: stat.name,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: baseFill,
                      outline: "none",
                      cursor: "pointer",
                      stroke: isSchoolState ? "#92400e" : isClickedState ? "#1e40af" : "#fff",
                      strokeWidth: isSchoolState || isClickedState ? 2 : 0.5,
                    },
                    hover: { fill: isSchoolState ? "#fbbf24" : "#60a5fa", outline: "none", stroke: "#1e3a5f", strokeWidth: 1.5 },
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
            top: tooltip.y - 44,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            color: "#222",
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 1000,
            transform: "translate(-50%, -100%)",
            minWidth: 160,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.name} ({tooltip.uf})</div>
          <div style={{ color: "#555", fontSize: 12 }}>
            🏫 {tooltip.escolas?.toLocaleString("pt-BR")} escolas
          </div>
          {tooltip.matriculas != null && tooltip.matriculas > 0 && (
            <div style={{ color: "#555", fontSize: 12 }}>
              👩‍🎓 {tooltip.matriculas?.toLocaleString("pt-BR")} matrículas
            </div>
          )}
          {tooltip.uf === selectedUf && (
            <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600, marginTop: 3 }}>
              ⭐ Estado da sua escola
            </div>
          )}
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Clique para ver detalhes</div>
        </div>
      )}
    </div>
  );
}
