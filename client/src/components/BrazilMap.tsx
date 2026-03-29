
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import React, { useState } from "react";
import { createPortal } from "react-dom";

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

// Approximate center + 2 scatter dots per UF (lon, lat)
const UF_DOTS: Record<string, [number, number][]> = {
  AC: [[-70.5, -9.2], [-68.9, -8.1], [-72.1, -10.0]],
  AL: [[-36.6, -9.7], [-35.7, -9.1], [-37.0, -10.3]],
  AM: [[-64.7, -3.5], [-60.0, -2.7], [-68.5, -4.5]],
  AP: [[-51.1, 1.4], [-52.4, 0.4], [-50.0, 2.3]],
  BA: [[-41.7, -12.5], [-38.5, -13.0], [-44.0, -11.2]],
  CE: [[-39.6, -5.5], [-38.2, -4.0], [-40.9, -6.5]],
  DF: [[-47.9, -15.8], [-47.7, -15.6], [-48.1, -16.0]],
  ES: [[-40.3, -19.6], [-40.8, -18.7], [-39.8, -20.3]],
  GO: [[-49.6, -16.0], [-48.0, -15.0], [-51.0, -17.8]],
  MA: [[-45.3, -5.4], [-43.5, -4.0], [-46.8, -6.5]],
  MG: [[-44.7, -18.0], [-42.5, -16.5], [-47.5, -19.5]],
  MS: [[-54.8, -20.5], [-52.5, -19.0], [-57.0, -22.0]],
  MT: [[-56.1, -12.6], [-53.0, -11.0], [-58.5, -14.5]],
  PA: [[-52.3, -3.9], [-48.5, -2.5], [-55.5, -5.5]],
  PB: [[-36.8, -7.2], [-35.5, -6.5], [-37.9, -7.8]],
  PE: [[-37.9, -8.4], [-35.5, -7.8], [-40.5, -9.0]],
  PI: [[-42.8, -6.6], [-41.0, -5.5], [-44.0, -8.0]],
  PR: [[-51.4, -24.9], [-49.5, -23.5], [-53.0, -26.0]],
  RJ: [[-43.1, -22.4], [-42.0, -21.5], [-44.2, -22.9]],
  RN: [[-36.5, -5.8], [-35.3, -5.2], [-37.6, -6.5]],
  RO: [[-63.0, -10.8], [-61.0, -9.5], [-64.8, -12.0]],
  RR: [[-61.3, 1.8], [-60.0, 3.0], [-62.5, 0.8]],
  RS: [[-53.0, -29.7], [-51.0, -28.5], [-55.0, -31.0]],
  SC: [[-50.8, -27.4], [-49.2, -26.5], [-52.5, -28.5]],
  SE: [[-37.4, -10.6], [-36.7, -10.0], [-38.1, -11.2]],
  SP: [[-48.5, -22.3], [-46.7, -21.5], [-50.5, -23.2]],
  TO: [[-48.3, -10.2], [-47.0, -9.0], [-49.5, -11.5]],
};

function getSimilarColor(count: number, max: number): string {
  if (!count) return "#e2e8f0";
  const intensity = Math.min(count / Math.max(max, 1), 1);
  if (intensity > 0.7) return "#0d9488";
  if (intensity > 0.4) return "#14b8a6";
  if (intensity > 0.2) return "#5eead4";
  return "#99f6e4";
}

type Props = {
  onStateClick?: (uf: string) => void;
  onStateHover?: (uf: string) => void;
  ufStats?: Record<string, { name: string; escolas: number; matriculas?: number; color?: string }>;
  selectedUf?: string | null;
  clickedUf?: string | null;
  similarMode?: boolean;
  similarUfCounts?: Record<string, number>;
};

export function BrazilMap({ onStateClick, onStateHover, ufStats, selectedUf, clickedUf, similarMode, similarUfCounts }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; uf: string; escolas: number; matriculas?: number; name: string; similarCount?: number;
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

  const maxSimilar = React.useMemo(() => {
    if (!similarUfCounts) return 1;
    return Math.max(...Object.values(similarUfCounts), 1);
  }, [similarUfCounts]);

  // Which UFs have dots to show
  const dotUfs = similarMode && similarUfCounts
    ? Object.entries(similarUfCounts).filter(([, n]) => n > 0).map(([uf]) => uf)
    : [];

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "0 auto", position: "relative" }}>
      {/* Legenda */}
      {similarMode ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#0d9488" }} />
            Muitas escolas similares
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#99f6e4" }} />
            Poucas escolas similares
          </span>
          {selectedUf && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#f59e0b", border: "2px solid #92400e" }} />
              Estado da sua escola
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>🟢 Clique no estado para ver as escolas</span>
        </div>
      ) : selectedUf && (
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
              const similarCount = similarUfCounts?.[uf] || 0;

              let baseFill: string;
              if (isSchoolState) {
                baseFill = "#f59e0b";
              } else if (similarMode) {
                baseFill = getSimilarColor(similarCount, maxSimilar);
              } else if (isClickedState) {
                baseFill = "#3b82f6";
              } else {
                baseFill = ufColorMap[uf] || STATE_COLOR_OVERRIDES[uf] || "#b7e4c7";
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onStateClick && onStateClick(uf)}
                  onMouseEnter={e => {
                    onStateHover?.(uf);
                    const bounds = (e.target as SVGPathElement).getBoundingClientRect();
                    setTooltip({
                      x: bounds.left + bounds.width / 2,
                      y: bounds.top,
                      uf,
                      escolas: stat?.escolas || 0,
                      matriculas: stat?.matriculas,
                      name: stat?.name || uf,
                      similarCount: similarMode ? similarCount : undefined,
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
                      opacity: similarMode && !isSchoolState && !similarCount ? 0.45 : 1,
                    },
                    hover: {
                      fill: isSchoolState ? "#fbbf24" : similarMode ? "#0d9488" : "#2f7a5f",
                      outline: "none",
                      stroke: "#1e3a5f",
                      strokeWidth: 1.5,
                    },
                    pressed: { fill: "#2d6a4f", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Pontinhos ilustrativos por estado no modo similar */}
        {dotUfs.map((uf) => {
          const dots = UF_DOTS[uf] || [];
          const count = similarUfCounts?.[uf] || 0;
          const r = count > 20 ? 4 : count > 5 ? 3 : 2.5;
          return dots.map(([lon, lat], idx) => (
            <Marker key={`${uf}-${idx}`} coordinates={[lon, lat]}>
              <circle
                r={r}
                fill={uf === selectedUf ? "#92400e" : "#0f766e"}
                fillOpacity={0.75}
                stroke="#fff"
                strokeWidth={0.8}
                style={{ pointerEvents: "none" }}
              />
            </Marker>
          ));
        })}
      </ComposableMap>

      {tooltip && createPortal(
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y - 8,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            color: "#222",
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 99999,
            transform: "translate(-50%, -100%)",
            minWidth: 160,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.name} ({tooltip.uf})</div>
          {tooltip.similarCount !== undefined ? (
            <>
              <div style={{ color: "#0d9488", fontSize: 12, fontWeight: 600 }}>
                🏫 {tooltip.similarCount} escolas com perfil similar
              </div>
              {tooltip.similarCount > 0 && (
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Clique para ver as escolas</div>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
