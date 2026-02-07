import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  lastUpdate: timestamp("last_update").defaultNow(),
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
  data: jsonb("data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// === AI KNOWLEDGE BASE ===
export const aiDocuments = pgTable("ai_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  sortOrder: integer("sort_order").default(0),
});

// === TRILHA UNITS ===
export const trilhaUnits = pgTable("trilha_units", {
  id: serial("id").primaryKey(),
  unitId: text("unit_id").notNull().unique(),
  part: integer("part").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  duration: text("duration").notNull(),
  intro: text("intro"),
  sections: jsonb("sections").$type<Array<{
    tipo: string;
    titulo: string;
    conteudo: string | string[];
  }>>().default([]),
  materials: jsonb("materials").$type<Array<{
    nome: string;
    descricao: string;
    tipo: string;
  }>>().default([]),
  previousUnit: text("previous_unit"),
  nextUnit: text("next_unit"),
  sortOrder: integer("sort_order").default(0),
});

// === UNANSWERED QUESTIONS ===
export const unansweredQuestions = pgTable("unanswered_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
export const insertAiDocumentSchema = createInsertSchema(aiDocuments).omit({ id: true });
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

export type UnansweredQuestion = typeof unansweredQuestions.$inferSelect;
export type InsertUnansweredQuestion = z.infer<typeof insertUnansweredQuestionSchema>;

export type SchoolSearchRequest = { query: string };
