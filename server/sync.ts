
import fetch from "node-fetch";
import { storage } from "./storage";

const BASE_URL = "https://planilha-competencias--msoaressales12.replit.app/api";

async function syncSchool(inep: string) {
  try {
    console.log(`[Sync] Sincronizando escola ${inep}...`);
    const response = await fetch(`${BASE_URL}/escola/${inep}`);
    if (!response.ok) {
      console.error(`[Sync] Erro ao buscar escola ${inep}: ${response.status}`);
      return;
    }

    const data: any = await response.json();
    
    // 1. Atualizar/Criar Escola
    await storage.createSchool({
      inep: data.inep || inep,
      name: data.nome || data.escola || "Escola sem nome",
      city: data.municipio || "Não informada",
      state: data.uf || "XX",
      network: data.rede || "Não informada",
      location: data.localizacao || "Não informada",
      enrollmentCount: data.censo_escolar?.[0]?.matriculas || 0,
      dataStatus: "Sincronizado",
    });

    // 2. Mapear Indicadores para Datasets
    const mappings = [
      { category: "icg", label: "ICG", source: data.icg },
      { category: "inse", label: "INSE", source: data.inse },
      { category: "tdi", label: "TDI", source: data.tdi },
      { category: "ird", label: "IRD", source: data.ird },
      { category: "dsu", label: "DSU", source: data.dsu },
      { category: "had", label: "HAD", source: data.had },
      { category: "atu", label: "ATU", source: data.atu },
      { category: "ied", label: "IED", source: data.ied },
      { category: "afd", label: "AFD", source: data.afd },
      { category: "ideb", label: "IDEB", source: data.ideb },
      { category: "enrollment", label: "Censo Escolar", source: data.censo_escolar }
    ];

    for (const mapping of mappings) {
      if (mapping.source && Array.isArray(mapping.source)) {
        await storage.upsertDashboardDataset(mapping.category, mapping.source, mapping.label);
        console.log(`[Sync] Atualizado dataset: ${mapping.category}`);
      }
    }

    console.log(`[Sync] Escola ${inep} sincronizada com sucesso!`);
  } catch (error) {
    console.error(`[Sync] Falha na sincronização da escola ${inep}:`, error);
  }
}

async function main() {
  const ineps = process.argv.slice(2);
  if (ineps.length === 0) {
    console.log("Uso: tsx server/sync.ts <inep1> <inep2> ...");
    process.exit(1);
  }

  for (const inep of ineps) {
    await syncSchool(inep);
  }
}

main();
