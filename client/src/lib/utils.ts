import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MOJIBAKE_REGEX = /Ã.|Â.|â[\u0080-\u00BF]|�/g

function mojibakeScore(value: string): number {
  const replacementCount = (value.match(/�/g) || []).length
  const mojibakeCount = (value.match(/Ã.|Â.|â[\u0080-\u00BF]/g) || []).length
  return (replacementCount * 4) + mojibakeCount
}

function decodeUtf8FromLatin1String(value: string): string {
  try {
    const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 0xff)
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
  } catch {
    return value
  }
}

function fixCommonBrokenWords(value: string): string {
  const commonMap: Record<string, string> = {
    "S�o": "São",
    "Par�": "Pará",
    "Amap�": "Amapá",
    "Maranh�o": "Maranhão",
    "Goi�s": "Goiás",
    "Educa��o": "Educação",
    "Munic�pio": "Município",
    "Regi�o": "Região",
    "Aprova��o": "Aprovação",
    "Reprova��o": "Reprovação",
    "Situa��o": "Situação",
    "Presta��o": "Prestação",
    "Execu��o": "Execução",
    "Concess�o": "Concessão",
    "Localiza��o": "Localização",
    "Administra��o": "Administração",
    "Gest�o": "Gestão",
    "N�o": "Não",
    "Raz�o": "Razão",
    "Suspens�o": "Suspensão",
    "Exce��o": "Exceção",
    "Hist�rico": "Histórico",
    "Anal�se": "Análise",
  }

  let output = value
  for (const [broken, fixed] of Object.entries(commonMap)) {
    output = output.split(broken).join(fixed)
  }
  return output
}

export function normalizeText(value: string): string {
  if (!value || !MOJIBAKE_REGEX.test(value)) {
    MOJIBAKE_REGEX.lastIndex = 0
    return value
  }
  MOJIBAKE_REGEX.lastIndex = 0

  const decoded = decodeUtf8FromLatin1String(value)
  const best = mojibakeScore(decoded) < mojibakeScore(value) ? decoded : value
  return fixCommonBrokenWords(best)
}

export function normalizeTextDeep<T>(input: T): T {
  if (typeof input === "string") {
    return normalizeText(input) as T
  }
  if (Array.isArray(input)) {
    return input.map((item) => normalizeTextDeep(item)) as T
  }
  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).map(([key, value]) => [key, normalizeTextDeep(value)])
    return Object.fromEntries(entries) as T
  }
  return input
}
