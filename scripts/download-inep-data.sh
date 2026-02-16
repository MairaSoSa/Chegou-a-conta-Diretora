#!/bin/bash
set -e

echo "============================================"
echo "  Download dos Microdados INEP"
echo "  Censo Escolar 2020-2024"
echo "============================================"
echo ""

DATA_DIR="/tmp/inep-data"
mkdir -p "$DATA_DIR"

ANOS="${1:-2020 2021 2022 2023 2024}"

for ANO in $ANOS; do
  echo ""
  echo "--- Baixando Censo $ANO ---"

  if [ "$ANO" = "2024" ]; then
    ZIP_URL="https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_${ANO}.zip"
  else
    ZIP_URL="https://download.inep.gov.br/microdados/microdados_censo_escolar_${ANO}.zip"
  fi

  ZIP_FILE="$DATA_DIR/censo_${ANO}.zip"

  if [ -f "$ZIP_FILE" ]; then
    echo "  Arquivo ja existe: $ZIP_FILE"
  else
    echo "  Baixando de: $ZIP_URL"
    curl -L -o "$ZIP_FILE" "$ZIP_URL" --progress-bar --fail || {
      echo "  AVISO: Falha ao baixar $ANO. Tentando URL alternativa..."
      ALT_URL="https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_${ANO}.zip"
      curl -L -o "$ZIP_FILE" "$ALT_URL" --progress-bar --fail || {
        echo "  ERRO: Nao foi possivel baixar o censo $ANO"
        rm -f "$ZIP_FILE"
        continue
      }
    }
  fi

  echo "  Extraindo..."
  unzip -o -q "$ZIP_FILE" -d "$DATA_DIR" 2>/dev/null || {
    echo "  AVISO: Falha ao extrair. Arquivo pode estar corrompido."
    continue
  }

  CSV_FOUND=$(find "$DATA_DIR" -iname "microdados_ed_basica_${ANO}.csv" 2>/dev/null | head -1)
  if [ -n "$CSV_FOUND" ]; then
    SIZE_MB=$(du -m "$CSV_FOUND" | cut -f1)
    echo "  CSV encontrado: $CSV_FOUND (${SIZE_MB}MB)"

    YEAR_DIR="$DATA_DIR/censo_${ANO}"
    mkdir -p "$YEAR_DIR"
    if [ "$CSV_FOUND" != "$YEAR_DIR/microdados_ed_basica_${ANO}.csv" ]; then
      cp "$CSV_FOUND" "$YEAR_DIR/microdados_ed_basica_${ANO}.csv"
      echo "  Copiado para: $YEAR_DIR/microdados_ed_basica_${ANO}.csv"
    fi
  else
    echo "  AVISO: CSV nao encontrado para $ANO"
  fi
done

echo ""
echo "============================================"
echo "  Download concluido!"
echo "  CSVs disponiveis em: $DATA_DIR/censo_YYYY/"
echo "============================================"
