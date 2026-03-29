import { Users, School, BarChart3, Award, BookOpen, TrendingUp } from "@/components/Icons";
import clsx from "clsx";

const metricsConfig = [
  {
    label: "Alunos Matriculados",
    icon: Users,
    color: "theme-blue",
    key: "matriculas",
  },
  {
    label: "Docentes",
    icon: BookOpen,
    color: "theme-green",
    key: "docentes",
  },
  {
    label: "Turmas",
    icon: BarChart3,
    color: "theme-yellow",
    key: "turmas",
  },
  {
    label: "IDEB",
    icon: Award,
    color: "theme-purple",
    key: "ideb",
  },
  {
    label: "Rede",
    icon: School,
    color: "theme-pink",
    key: "rede",
  },
  {
    label: "Evolução",
    icon: TrendingUp,
    color: "theme-teal",
    key: "evolucao",
  },
];

export function MetricsPanel({ metrics }: { metrics: Record<string, any> }) {
  return (
    <div className="summary-grid mt-4 mb-8">
      {metricsConfig.map((m, i) => {
        const Icon = m.icon;
        const value = metrics[m.key] ?? "-";
        return (
          <div
            key={m.key}
            className={clsx(
              "metric",
              m.color,
              "shadow-md border p-6 rounded-2xl relative transition-transform duration-150",
              i % 2 === 0 ? "-rotate-1.5" : "rotate-1.5"
            )}
          >
            <div className="metric-top flex items-center gap-3 mb-2">
              <span className="metric-icon w-12 h-12 flex items-center justify-center bg-white/80 border border-white/90 rounded-xl text-2xl shadow">
                <Icon />
              </span>
            </div>
            <label className="block text-muted-foreground text-xs font-semibold mb-1">{m.label}</label>
            <strong className="block text-3xl font-bold leading-tight">{value}</strong>
          </div>
        );
      })}
    </div>
  );
}
