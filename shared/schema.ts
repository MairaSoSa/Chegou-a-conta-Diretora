import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { conversations, messages } from "./models/chat";

// Re-export chat models
export { conversations, messages };

// === SCHOOLS (for Dashboard) ===
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  inep: text("inep").notNull().unique(), // INEP code
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  network: text("network").notNull(), // Municipal, Estadual
  location: text("location").notNull(), // Rural, Urbana
  enrollmentCount: integer("enrollment_count").notNull(),
  dataStatus: text("data_status").notNull(), // "Completo", "Parcial"
  lastUpdate: timestamp("last_update").defaultNow(),
});

// === PROGRAMS (for Dashboard & Programs page) ===
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // PDDE, PNAE, PNATE
  name: text("name").notNull(),
  description: text("description").notNull(),
  lastReferenceYear: integer("last_reference_year"),
  status: text("status").notNull(), // "Regular", "Atrasado", "Pendente"
  observation: text("observation"),
});

// === PROGRAM DETAILS (Pode/Não Pode, Docs) ===
export const programDetails = pgTable("program_details", {
  id: serial("id").primaryKey(),
  programCode: text("program_code").notNull(), // FK to programs.code logical
  type: text("type").notNull(), // "allowed", "forbidden", "documents", "errors"
  content: text("content").notNull(),
  category: text("category"), // Optional: "Financeiro", "Alimentação"
});

// === TOOLS (Caixa de Ferramentas) ===
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // Planejar, Pesquisar, Contratar...
  description: text("description").notNull(),
  downloadUrl: text("download_url"),
  type: text("type").notNull(), // "checklist", "model", "spreadsheet"
});

// === ZOD SCHEMAS ===
export const insertSchoolSchema = createInsertSchema(schools);
export const insertProgramSchema = createInsertSchema(programs);
export const insertProgramDetailSchema = createInsertSchema(programDetails);
export const insertToolSchema = createInsertSchema(tools);

// === TYPES ===
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type ProgramDetail = typeof programDetails.$inferSelect;
export type InsertProgramDetail = z.infer<typeof insertProgramDetailSchema>;

export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;

// Request Types
export type SchoolSearchRequest = { query: string };
