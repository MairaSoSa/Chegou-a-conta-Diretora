import { pgTable, text, integer, bigint, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { conversations, messages } from "./models/chat";

export { conversations, messages };

// === SCHOOLS (for Dashboard) ===
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  inep: text("inep").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  network: text("network").notNull(),
  location: text("location").notNull(),
  enrollmentCount: integer("enrollment_count").notNull(),
  dataStatus: text("data_status").notNull(),
  lastUpdate: bigint("last_update", { mode: "number" }),
});

// === PROGRAMS ===
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  lastReferenceYear: integer("last_reference_year"),
  status: text("status").notNull(),
  observation: text("observation"),
});

// === PROGRAM DETAILS ===
export const programDetails = pgTable("program_details", {
  id: serial("id").primaryKey(),
  programCode: text("program_code").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  category: text("category"),
});

// === TOOLS (Caixa de Ferramentas) ===
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  downloadUrl: text("download_url"),
  type: text("type").notNull(),
  featured: boolean("featured").default(false),
  sortOrder: integer("sort_order").default(0),
});

// === GLOSSARY (Glossário) ===
export const glossary = pgTable("glossary", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  explanation: text("explanation").notNull(),
  letter: text("letter").notNull(),
  iconName: text("icon_name"),
  sortOrder: integer("sort_order").default(0),
});

// === SITE SETTINGS ===
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  label: text("label"),
});

// === DASHBOARD DATASETS ===
export const dashboardDatasets = pgTable("dashboard_datasets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  label: text("label"),
  data: text("data").notNull(),
  lastUpdated: bigint("last_updated", { mode: "number" }),
});

// === AI KNOWLEDGE BASE ===
export const aiDocuments = pgTable("ai_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  link: text("link"),
  sortOrder: integer("sort_order").default(0),
  createdAt: bigint("created_at", { mode: "number" }),
});

// === AI DOCUMENT EMBEDDINGS ===
export const aiDocumentEmbeddings = pgTable("ai_document_embeddings", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().unique(),
  embedding: text("embedding").notNull(),
  createdAt: bigint("created_at", { mode: "number" }),
  updatedAt: bigint("updated_at", { mode: "number" }),
});

// === AI API SOURCES ===
export const aiApiSources = pgTable("ai_api_sources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category"),
  authHeaderName: text("auth_header_name"),
  authHeaderValue: text("auth_header_value"),
  refreshMinutes: integer("refresh_minutes").default(1440),
  enabled: boolean("enabled").default(true),
  lastFetchedAt: bigint("last_fetched_at", { mode: "number" }),
  lastStatus: integer("last_status"),
  lastError: text("last_error"),
});

// === TRILHA UNITS ===
export const trilhaUnits = pgTable("trilha_units", {
  id: serial("id").primaryKey(),
  unitId: text("unit_id").notNull().unique(),
  part: text("part").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  duration: text("duration"),
  intro: text("intro"),
  sections: text("sections"),
  materials: text("materials"),
  previousUnit: text("previous_unit"),
  nextUnit: text("next_unit"),
  sortOrder: integer("sort_order").default(0),
});

// === EDUCATIONAL INDICATORS (from INEP — views in Railway) ===
export const censoEscolar = pgTable("censo_escolar", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  inep: text("inep").notNull(),
  ano: text("ano").notNull(),
  nome: text("nome"),
  municipio: text("municipio"),
  uf: text("uf"),
  dependencia: text("dependencia"),
  localizacao: text("localizacao"),
  situacao: text("situacao"),
  matriculas: integer("matriculas"),
  docentes: integer("docentes"),
  turmas: integer("turmas"),
  dados: text("dados"),
  updatedAt: bigint("updated_at", { mode: "number" }),
});

export const indicadoresEducacionais = pgTable("indicadores_educacionais", {
  inep: text("inep").notNull(),
  ano: integer("ano").notNull(),
  tipo: text("tipo").notNull(),
  dados: text("dados"),
  updatedAt: bigint("updated_at", { mode: "number" }),
});

export const importacaoStatus = pgTable("importacao_status", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(),
  ano: integer("ano").notNull(),
  status: text("status").notNull(),
  totalRegistros: integer("total_registros"),
  registrosImportados: integer("registros_importados"),
  erro: text("erro"),
  iniciadoEm: bigint("iniciado_em", { mode: "number" }),
  finalizadoEm: bigint("finalizado_em", { mode: "number" }),
});

// === CADERNO DA DIRETORA: DOCUMENTS ===
export const cadernoDocuments = pgTable("caderno_documents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  inep: text("inep"),
  headerData: text("header_data"),
  bodyHtml: text("body_html").default(""),
  status: text("status").notNull().default("rascunho"),
  qualityScore: text("quality_score").default("red"),
  logoUrl: text("logo_url"),
  createdAt: bigint("created_at", { mode: "number" }),
  updatedAt: bigint("updated_at", { mode: "number" }),
});

export const cadernoDocumentVersions = pgTable("caderno_document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  bodyHtml: text("body_html").notNull(),
  headerData: text("header_data"),
  createdAt: bigint("created_at", { mode: "number" }),
});

export const cadernoNotes = pgTable("caderno_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  sourceTitle: text("source_title"),
  sourceExcerpt: text("source_excerpt"),
  tags: text("tags"),
  documentId: integer("document_id"),
  conversationId: integer("conversation_id"),
  createdAt: bigint("created_at", { mode: "number" }),
});

export const cadernoSources = pgTable("caderno_sources", {
  id: serial("id").primaryKey(),
  url: text("url"),
  title: text("title").notNull(),
  content: text("content"),
  excerpt: text("excerpt"),
  fetchedAt: bigint("fetched_at", { mode: "number" }),
  pinned: boolean("pinned").default(false),
  category: text("category"),
  conversationId: integer("conversation_id"),
});

// === UNANSWERED QUESTIONS ===
export const unansweredQuestions = pgTable("unanswered_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  createdAt: bigint("created_at", { mode: "number" }),
  status: text("status").notNull().default("pending"),
});

// === ZOD SCHEMAS ===
export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true });
export const insertProgramDetailSchema = createInsertSchema(programDetails).omit({ id: true });
export const insertToolSchema = createInsertSchema(tools).omit({ id: true });
export const insertGlossarySchema = createInsertSchema(glossary).omit({ id: true });
export const insertTrilhaUnitSchema = createInsertSchema(trilhaUnits).omit({ id: true }).extend({
  sections: z.union([z.string(), z.array(z.any()), z.null()]).optional(),
  materials: z.union([z.string(), z.array(z.any()), z.null()]).optional(),
});
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertDashboardDatasetSchema = createInsertSchema(dashboardDatasets).omit({ id: true, lastUpdated: true });
export const insertAiDocumentSchema = createInsertSchema(aiDocuments).omit({ id: true, createdAt: true });
export const insertAiDocumentEmbeddingSchema = createInsertSchema(aiDocumentEmbeddings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiApiSourceSchema = createInsertSchema(aiApiSources).omit({ id: true });
export const insertCadernoDocumentSchema = createInsertSchema(cadernoDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCadernoNoteSchema = createInsertSchema(cadernoNotes).omit({ id: true, createdAt: true });
export const insertCadernoSourceSchema = createInsertSchema(cadernoSources).omit({ id: true });
export const insertUnansweredQuestionSchema = createInsertSchema(unansweredQuestions).omit({ id: true, createdAt: true });

// === TYPES ===
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type ProgramDetail = typeof programDetails.$inferSelect;
export type InsertProgramDetail = z.infer<typeof insertProgramDetailSchema>;

export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;

export type GlossaryItem = typeof glossary.$inferSelect;
export type InsertGlossaryItem = z.infer<typeof insertGlossarySchema>;

export type TrilhaUnit = typeof trilhaUnits.$inferSelect;
export type InsertTrilhaUnit = z.infer<typeof insertTrilhaUnitSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

export type DashboardDataset = typeof dashboardDatasets.$inferSelect;
export type InsertDashboardDataset = z.infer<typeof insertDashboardDatasetSchema>;

export type AiDocument = typeof aiDocuments.$inferSelect;
export type InsertAiDocument = z.infer<typeof insertAiDocumentSchema>;

export type AiDocumentEmbedding = typeof aiDocumentEmbeddings.$inferSelect;
export type InsertAiDocumentEmbedding = z.infer<typeof insertAiDocumentEmbeddingSchema>;

export type AiApiSource = typeof aiApiSources.$inferSelect;
export type InsertAiApiSource = z.infer<typeof insertAiApiSourceSchema>;

export type CadernoDocument = typeof cadernoDocuments.$inferSelect;
export type InsertCadernoDocument = z.infer<typeof insertCadernoDocumentSchema>;

export type CadernoNote = typeof cadernoNotes.$inferSelect;
export type InsertCadernoNote = z.infer<typeof insertCadernoNoteSchema>;

export type CadernoSource = typeof cadernoSources.$inferSelect;
export type InsertCadernoSource = z.infer<typeof insertCadernoSourceSchema>;

export type UnansweredQuestion = typeof unansweredQuestions.$inferSelect;
export type InsertUnansweredQuestion = z.infer<typeof insertUnansweredQuestionSchema>;

export type SchoolSearchRequest = { query: string };
