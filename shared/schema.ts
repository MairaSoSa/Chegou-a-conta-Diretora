import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { conversations, messages } from "./models/chat";

export { conversations, messages };

// === SCHOOLS (for Dashboard) ===
export const schools = sqliteTable("schools", {
  id: integer("id").primaryKey(),
  inep: text("inep").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  network: text("network").notNull(),
  location: text("location").notNull(),
  enrollmentCount: integer("enrollment_count").notNull(),
  dataStatus: text("data_status").notNull(),
  lastUpdate: integer("last_update"),
});

// === PROGRAMS ===
export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  lastReferenceYear: integer("last_reference_year"),
  status: text("status").notNull(),
  observation: text("observation"),
});

// === PROGRAM DETAILS ===
export const programDetails = sqliteTable("program_details", {
  id: integer("id").primaryKey(),
  programCode: text("program_code").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  category: text("category"),
});

// === TOOLS (Caixa de Ferramentas) ===
export const tools = sqliteTable("tools", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  downloadUrl: text("download_url"),
  type: text("type").notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
});

// === GLOSSARY (Glossário) ===
export const glossary = sqliteTable("glossary", {
  id: integer("id").primaryKey(),
  term: text("term").notNull(),
  explanation: text("explanation").notNull(),
  letter: text("letter").notNull(),
  iconName: text("icon_name"),
  sortOrder: integer("sort_order").default(0),
});

// === SITE SETTINGS ===
export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  label: text("label"),
});

// === DASHBOARD DATASETS ===
export const dashboardDatasets = sqliteTable("dashboard_datasets", {
  id: integer("id").primaryKey(),
  category: text("category").notNull(),
  label: text("label"),
  data: blob("data").notNull(),
  lastUpdated: integer("last_updated"),
});

// === AI KNOWLEDGE BASE ===
export const aiDocuments = sqliteTable("ai_documents", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  link: text("link"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at"),
});

// === AI DOCUMENT EMBEDDINGS ===
export const aiDocumentEmbeddings = sqliteTable("ai_document_embeddings", {
  id: integer("id").primaryKey(),
  documentId: integer("document_id").notNull().unique(),
  embedding: text("embedding").notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// === AI API SOURCES ===
export const aiApiSources = sqliteTable("ai_api_sources", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category"),
  authHeaderName: text("auth_header_name"),
  authHeaderValue: text("auth_header_value"),
  refreshMinutes: integer("refresh_minutes").default(1440),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  lastFetchedAt: integer("last_fetched_at"),
  lastStatus: integer("last_status"),
  lastError: text("last_error"),
});

// === TRILHA UNITS ===
export const trilhaUnits = sqliteTable("trilha_units", {
  id: integer("id").primaryKey(),
  unitId: text("unit_id").notNull().unique(),
  part: integer("part").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  duration: text("duration").notNull(),
  intro: text("intro"),
  sections: blob("sections"),
  materials: blob("materials"),
  previousUnit: text("previous_unit"),
  nextUnit: text("next_unit"),
  sortOrder: integer("sort_order").default(0),
});

// === UNANSWERED QUESTIONS ===
export const unansweredQuestions = sqliteTable("unanswered_questions", {
  id: integer("id").primaryKey(),
  question: text("question").notNull(),
  createdAt: integer("created_at"),
  status: text("status").notNull().default("pending"),
});

// === ZOD SCHEMAS ===
export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true });
export const insertProgramDetailSchema = createInsertSchema(programDetails).omit({ id: true });
export const insertToolSchema = createInsertSchema(tools).omit({ id: true });
export const insertGlossarySchema = createInsertSchema(glossary).omit({ id: true });
export const insertTrilhaUnitSchema = createInsertSchema(trilhaUnits).omit({ id: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertDashboardDatasetSchema = createInsertSchema(dashboardDatasets).omit({ id: true, lastUpdated: true });
export const insertAiDocumentSchema = createInsertSchema(aiDocuments).omit({ id: true, createdAt: true });
export const insertAiDocumentEmbeddingSchema = createInsertSchema(aiDocumentEmbeddings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiApiSourceSchema = createInsertSchema(aiApiSources).omit({ id: true });
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

export type UnansweredQuestion = typeof unansweredQuestions.$inferSelect;
export type InsertUnansweredQuestion = z.infer<typeof insertUnansweredQuestionSchema>;

export type SchoolSearchRequest = { query: string };
