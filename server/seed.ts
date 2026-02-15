import { storage } from "./storage";

async function main() {
  console.log("Seeding database...");
  
  try {
    // Seed Schools
    const existingSchools = await storage.getSchools();
    console.log(`Current schools: ${existingSchools.length}`);
    if (existingSchools.length === 0) {
      await storage.createSchool({
        inep: "12345678",
        name: "Escola Municipal Rio Verde",
        city: "Rio Verde",
        state: "GO",
        network: "Municipal",
        location: "Rural",
        enrollmentCount: 312,
        dataStatus: "Parcial",
      });
      console.log("Created test school 12345678");
    }

    // Seed Datasets
    const existingDatasets = await storage.getDashboardDatasets();
    console.log(`Current datasets: ${existingDatasets.length}`);
    if (existingDatasets.length === 0) {
      const mockDatasets = [
        {
          category: "enrollment",
          label: "Matrículas",
          data: [
            { year: 2022, total: 280, iniciais: 140, finais: 140 },
            { year: 2023, total: 300, iniciais: 150, finais: 150 },
            { year: 2024, total: 312, iniciais: 156, finais: 156 }
          ]
        },
        {
          category: "repasses",
          label: "Repasses",
          data: [
            { year: 2023, pdde: 15000, pnae: 12000, pnate: 8000, total: 35000 },
            { year: 2024, pdde: 18000, pnae: 14000, pnate: 9000, total: 41000 }
          ]
        }
      ];

      for (const ds of mockDatasets) {
        // SQLite doesn't support complex objects directly in blobs via Drizzle without serialization
        // though better-sqlite3 handles it if configured, here we ensure it's a string if needed
        await storage.upsertDashboardDataset(ds.category, ds.data, ds.label);
        console.log(`Created dataset: ${ds.category}`);
      }
    }

    // Seed Glossary
    const glossaryItems = await storage.getGlossary();
    if (glossaryItems.length === 0) {
      const glossaryData = [
        { term: 'Adesão', explanation: 'Quando a escola "se inscreve" pra receber um dinheiro.', letter: 'A', iconName: 'Handshake', sortOrder: 1 },
        { term: 'PDDE', explanation: 'Programa Dinheiro Direto na Escola.', letter: 'P', iconName: 'Banknote', sortOrder: 2 }
      ];
      for (const item of glossaryData) {
        await storage.createGlossaryItem(item);
      }
      console.log("Created glossary items");
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();
