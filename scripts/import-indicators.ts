import "dotenv/config";
import { importAllIndicators, importIdeb, importInse, generateSaebFromIdeb } from "../server/import-inep-indicators";

const ANOS = [2020, 2021, 2022, 2023, 2024];

async function run() {
  console.log("Importando indicadores anuais do INEP...");
  console.log("Anos:", ANOS.join(", "));
  console.log("");

  const result = await importAllIndicators(undefined, ANOS);
  if (result.errors?.length) {
    console.log("Erros:", result.errors);
  } else {
    console.log("Indicadores anuais importados com sucesso!");
  }

  console.log("\nImportando IDEB (2019, 2021, 2023)...");
  const idebResult = await importIdeb();
  if (idebResult.errors?.length) {
    console.log("Erros IDEB:", idebResult.errors);
  } else {
    console.log("IDEB importado com sucesso!");
  }

  console.log("\nImportando INSE...");
  const inseResult = await importInse();
  if (inseResult.errors?.length) {
    console.log("Erros INSE:", inseResult.errors);
  } else {
    console.log("INSE importado com sucesso!");
  }

  console.log("\nGerando SAEB a partir do IDEB...");
  const saebResult = await generateSaebFromIdeb();
  console.log("SAEB:", JSON.stringify(saebResult));

  console.log("\nConcluido!");
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
