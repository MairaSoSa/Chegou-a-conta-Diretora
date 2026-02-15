import { db } from "./db";
import {
  schools, programs, programDetails, tools, glossary, trilhaUnits,
  siteSettings, dashboardDatasets, aiDocuments, unansweredQuestions,
  aiDocumentEmbeddings,
  type School, type InsertSchool,
  type Program, type InsertProgram,
  type ProgramDetail, type InsertProgramDetail,
  type Tool, type InsertTool,
  type GlossaryItem, type InsertGlossaryItem,
  type TrilhaUnit, type InsertTrilhaUnit,
  type SiteSetting,
  type DashboardDataset,
  type AiDocument, type InsertAiDocument,
  type AiDocumentEmbedding, type InsertAiDocumentEmbedding,
  type UnansweredQuestion, type InsertUnansweredQuestion
} from "@shared/schema";
import { and, eq, like, or, asc, desc } from "drizzle-orm";

export interface IStorage {
  getSchools(query?: string): Promise<School[]>;
  getSchoolByInep(inep: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;

  getPrograms(): Promise<Program[]>;
  getProgramByCode(code: string): Promise<Program | undefined>;
  getProgramDetails(programCode: string): Promise<ProgramDetail[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  createProgramDetail(detail: InsertProgramDetail): Promise<ProgramDetail>;
  updateProgramDetail(id: number, detail: Partial<InsertProgramDetail>): Promise<ProgramDetail | undefined>;
  deleteProgramDetail(id: number): Promise<boolean>;

  getTools(category?: string): Promise<Tool[]>;
  getToolById(id: number): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: number, tool: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: number): Promise<boolean>;

  getGlossary(): Promise<GlossaryItem[]>;
  getGlossaryById(id: number): Promise<GlossaryItem | undefined>;
  createGlossaryItem(item: InsertGlossaryItem): Promise<GlossaryItem>;
  updateGlossaryItem(id: number, item: Partial<InsertGlossaryItem>): Promise<GlossaryItem | undefined>;
  deleteGlossaryItem(id: number): Promise<boolean>;

  getTrilhaUnits(): Promise<TrilhaUnit[]>;
  getTrilhaUnitByUnitId(unitId: string): Promise<TrilhaUnit | undefined>;
  createTrilhaUnit(unit: InsertTrilhaUnit): Promise<TrilhaUnit>;
  updateTrilhaUnit(id: number, unit: Partial<InsertTrilhaUnit>): Promise<TrilhaUnit | undefined>;
  deleteTrilhaUnit(id: number): Promise<boolean>;

  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSettingByKey(key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(key: string, value: string, label?: string): Promise<SiteSetting>;
  deleteSiteSetting(key: string): Promise<boolean>;

  getDashboardDatasets(): Promise<DashboardDataset[]>;
  getDashboardDatasetByCategory(category: string): Promise<DashboardDataset | undefined>;
  upsertDashboardDataset(category: string, data: unknown, label?: string): Promise<DashboardDataset>;
  updateDashboardDatasetLabel(id: number, label: string): Promise<DashboardDataset | undefined>;
  deleteDashboardDataset(id: number): Promise<boolean>;

  getAiDocuments(): Promise<AiDocument[]>;
  getAiDocumentById(id: number): Promise<AiDocument | undefined>;
  getAiDocumentsByLinkAndCategory(link: string, category?: string): Promise<AiDocument[]>;
  createAiDocument(doc: InsertAiDocument): Promise<AiDocument>;
  updateAiDocument(id: number, doc: Partial<InsertAiDocument>): Promise<AiDocument | undefined>;
  deleteAiDocument(id: number): Promise<boolean>;
  deleteAiDocumentsByLinkAndCategory(link: string, category?: string): Promise<number>;

  getAiDocumentEmbeddings(): Promise<AiDocumentEmbedding[]>;
  getAiDocumentEmbeddingByDocumentId(documentId: number): Promise<AiDocumentEmbedding | undefined>;
  upsertAiDocumentEmbedding(documentId: number, embedding: number[]): Promise<AiDocumentEmbedding>;
  deleteAiDocumentEmbeddingByDocumentId(documentId: number): Promise<boolean>;
  getAiDocumentEmbeddingsWithDocuments(): Promise<Array<{ embedding: AiDocumentEmbedding; document: AiDocument }>>;

  getUnansweredQuestions(): Promise<UnansweredQuestion[]>;
  createUnansweredQuestion(question: InsertUnansweredQuestion): Promise<UnansweredQuestion>;
  updateUnansweredQuestionStatus(id: number, status: string): Promise<UnansweredQuestion | undefined>;
  deleteUnansweredQuestion(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getSchools(query?: string): Promise<School[]> {
    if (!query) return db.select().from(schools);
    const search = `%${query}%`;
    return db.select().from(schools).where(
      or(
        like(schools.inep, search),
        like(schools.name, search),
        like(schools.city, search)
      )
    );
  }

  async getSchoolByInep(inep: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.inep, inep));
    return school;
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }

  async getPrograms(): Promise<Program[]> {
    return db.select().from(programs);
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.code, code));
    return program;
  }

  async getProgramDetails(programCode: string): Promise<ProgramDetail[]> {
    return db.select().from(programDetails).where(eq(programDetails.programCode, programCode));
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const [updated] = await db.update(programs).set(program).where(eq(programs.id, id)).returning();
    return updated;
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id)).returning();
    return result.length > 0;
  }

  async createProgramDetail(detail: InsertProgramDetail): Promise<ProgramDetail> {
    const [newDetail] = await db.insert(programDetails).values(detail).returning();
    return newDetail;
  }

  async updateProgramDetail(id: number, detail: Partial<InsertProgramDetail>): Promise<ProgramDetail | undefined> {
    const [updated] = await db.update(programDetails).set(detail).where(eq(programDetails.id, id)).returning();
    return updated;
  }

  async deleteProgramDetail(id: number): Promise<boolean> {
    const result = await db.delete(programDetails).where(eq(programDetails.id, id)).returning();
    return result.length > 0;
  }

  async getTools(category?: string): Promise<Tool[]> {
    if (!category) return db.select().from(tools).orderBy(asc(tools.sortOrder));
    return db.select().from(tools).where(eq(tools.category, category)).orderBy(asc(tools.sortOrder));
  }

  async getToolById(id: number): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [newTool] = await db.insert(tools).values(tool).returning();
    return newTool;
  }

  async updateTool(id: number, tool: Partial<InsertTool>): Promise<Tool | undefined> {
    const [updated] = await db.update(tools).set(tool).where(eq(tools.id, id)).returning();
    return updated;
  }

  async deleteTool(id: number): Promise<boolean> {
    const result = await db.delete(tools).where(eq(tools.id, id)).returning();
    return result.length > 0;
  }

  async getGlossary(): Promise<GlossaryItem[]> {
    return db.select().from(glossary).orderBy(asc(glossary.sortOrder), asc(glossary.term));
  }

  async getGlossaryById(id: number): Promise<GlossaryItem | undefined> {
    const [item] = await db.select().from(glossary).where(eq(glossary.id, id));
    return item;
  }

  async createGlossaryItem(item: InsertGlossaryItem): Promise<GlossaryItem> {
    const [newItem] = await db.insert(glossary).values(item).returning();
    return newItem;
  }

  async updateGlossaryItem(id: number, item: Partial<InsertGlossaryItem>): Promise<GlossaryItem | undefined> {
    const [updated] = await db.update(glossary).set(item).where(eq(glossary.id, id)).returning();
    return updated;
  }

  async deleteGlossaryItem(id: number): Promise<boolean> {
    const result = await db.delete(glossary).where(eq(glossary.id, id)).returning();
    return result.length > 0;
  }

  async getTrilhaUnits(): Promise<TrilhaUnit[]> {
    const units = await db.select().from(trilhaUnits).orderBy(asc(trilhaUnits.sortOrder), asc(trilhaUnits.unitId));
    return units.map((unit) => ({
      ...unit,
      sections: typeof unit.sections === 'string' ? JSON.parse(unit.sections) : unit.sections,
      materials: typeof unit.materials === 'string' ? JSON.parse(unit.materials) : unit.materials,
    })) as TrilhaUnit[];
  }

  async getTrilhaUnitByUnitId(unitId: string): Promise<TrilhaUnit | undefined> {
    const [unit] = await db.select().from(trilhaUnits).where(eq(trilhaUnits.unitId, unitId));
    if (!unit) return undefined;
    return {
      ...unit,
      sections: typeof unit.sections === 'string' ? JSON.parse(unit.sections) : unit.sections,
      materials: typeof unit.materials === 'string' ? JSON.parse(unit.materials) : unit.materials,
    } as TrilhaUnit;
  }

  async createTrilhaUnit(unit: InsertTrilhaUnit): Promise<TrilhaUnit> {
    // Serialize JSON fields for SQLite
    const serialized = {
      ...unit,
      sections: unit.sections ? JSON.stringify(unit.sections) : JSON.stringify([]),
      materials: unit.materials ? JSON.stringify(unit.materials) : JSON.stringify([]),
    };
    const [newUnit] = await db.insert(trilhaUnits).values(serialized).returning();
    return {
      ...newUnit,
      sections: typeof newUnit.sections === 'string' ? JSON.parse(newUnit.sections as string) : newUnit.sections,
      materials: typeof newUnit.materials === 'string' ? JSON.parse(newUnit.materials as string) : newUnit.materials,
    } as any;
  }

  async updateTrilhaUnit(id: number, unit: Partial<InsertTrilhaUnit>): Promise<TrilhaUnit | undefined> {
    const serialized = {
      ...unit,
      ...(unit.sections && { sections: JSON.stringify(unit.sections) }),
      ...(unit.materials && { materials: JSON.stringify(unit.materials) }),
    };
    const [updated] = await db.update(trilhaUnits).set(serialized).where(eq(trilhaUnits.id, id)).returning();
    if (!updated) return undefined;
    return {
      ...updated,
      sections: typeof updated.sections === 'string' ? JSON.parse(updated.sections) : updated.sections,
      materials: typeof updated.materials === 'string' ? JSON.parse(updated.materials) : updated.materials,
    } as TrilhaUnit;
  }

  async deleteTrilhaUnit(id: number): Promise<boolean> {
    const result = await db.delete(trilhaUnits).where(eq(trilhaUnits.id, id)).returning();
    return result.length > 0;
  }

  async getSiteSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings).orderBy(asc(siteSettings.key));
  }

  async getSiteSettingByKey(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSiteSetting(key: string, value: string, label?: string): Promise<SiteSetting> {
    const existing = await this.getSiteSettingByKey(key);
    if (existing) {
      const [updated] = await db.update(siteSettings).set({ value, ...(label !== undefined ? { label } : {}) }).where(eq(siteSettings.key, key)).returning();
      return updated;
    }
    const [created] = await db.insert(siteSettings).values({ key, value, label }).returning();
    return created;
  }

  async deleteSiteSetting(key: string): Promise<boolean> {
    const result = await db.delete(siteSettings).where(eq(siteSettings.key, key)).returning();
    return result.length > 0;
  }

  async getDashboardDatasets(): Promise<DashboardDataset[]> {
    return db.select().from(dashboardDatasets).orderBy(asc(dashboardDatasets.category));
  }

  async getDashboardDatasetByCategory(category: string): Promise<DashboardDataset | undefined> {
    const [dataset] = await db.select().from(dashboardDatasets).where(eq(dashboardDatasets.category, category)).orderBy(desc(dashboardDatasets.lastUpdated));
    return dataset;
  }

  async upsertDashboardDataset(category: string, data: unknown, label?: string): Promise<DashboardDataset> {
    const existing = await this.getDashboardDatasetByCategory(category);
    // Ensure data is serialized for blob storage if it's an object/array
    const serializedData = typeof data === 'object' ? JSON.stringify(data) : data;
    
    if (existing) {
      const updateData: Record<string, unknown> = { data: serializedData, lastUpdated: Date.now() };
      if (label !== undefined) {
        updateData.label = label;
      }
      const [updated] = await db.update(dashboardDatasets).set(updateData).where(eq(dashboardDatasets.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(dashboardDatasets).values({ category, data: serializedData, label, lastUpdated: Date.now() }).returning();
    return created;
  }

  async updateDashboardDatasetLabel(id: number, label: string): Promise<DashboardDataset | undefined> {
    const [updated] = await db.update(dashboardDatasets).set({ label }).where(eq(dashboardDatasets.id, id)).returning();
    return updated;
  }

  async deleteDashboardDataset(id: number): Promise<boolean> {
    const result = await db.delete(dashboardDatasets).where(eq(dashboardDatasets.id, id)).returning();
    return result.length > 0;
  }

  async getAiDocuments(): Promise<AiDocument[]> {
    return db.select().from(aiDocuments).orderBy(asc(aiDocuments.sortOrder));
  }

  async getAiDocumentById(id: number): Promise<AiDocument | undefined> {
    const [doc] = await db.select().from(aiDocuments).where(eq(aiDocuments.id, id));
    return doc;
  }

  async getAiDocumentsByLinkAndCategory(link: string, category?: string): Promise<AiDocument[]> {
    if (!category) {
      return db.select().from(aiDocuments).where(eq(aiDocuments.link, link));
    }
    return db
      .select()
      .from(aiDocuments)
      .where(and(eq(aiDocuments.link, link), eq(aiDocuments.category, category)));
  }

  async createAiDocument(doc: InsertAiDocument): Promise<AiDocument> {
    const [created] = await db
      .insert(aiDocuments)
      .values({ ...doc, createdAt: Date.now() })
      .returning();
    return created;
  }

  async updateAiDocument(id: number, doc: Partial<InsertAiDocument>): Promise<AiDocument | undefined> {
    const [updated] = await db.update(aiDocuments).set(doc).where(eq(aiDocuments.id, id)).returning();
    return updated;
  }

  async deleteAiDocument(id: number): Promise<boolean> {
    const result = await db.delete(aiDocuments).where(eq(aiDocuments.id, id)).returning();
    return result.length > 0;
  }

  async deleteAiDocumentsByLinkAndCategory(link: string, category?: string): Promise<number> {
    const result = category
      ? await db
          .delete(aiDocuments)
          .where(and(eq(aiDocuments.link, link), eq(aiDocuments.category, category)))
          .returning()
      : await db.delete(aiDocuments).where(eq(aiDocuments.link, link)).returning();
    return result.length;
  }

  async getAiDocumentEmbeddings(): Promise<AiDocumentEmbedding[]> {
    return db.select().from(aiDocumentEmbeddings).orderBy(desc(aiDocumentEmbeddings.updatedAt));
  }

  async getAiDocumentEmbeddingByDocumentId(documentId: number): Promise<AiDocumentEmbedding | undefined> {
    const [embedding] = await db
      .select()
      .from(aiDocumentEmbeddings)
      .where(eq(aiDocumentEmbeddings.documentId, documentId));
    return embedding;
  }

  async upsertAiDocumentEmbedding(documentId: number, embedding: number[]): Promise<AiDocumentEmbedding> {
    const serialized = JSON.stringify(embedding);
    const existing = await this.getAiDocumentEmbeddingByDocumentId(documentId);
    if (existing) {
      const [updated] = await db
        .update(aiDocumentEmbeddings)
        .set({ embedding: serialized, updatedAt: Date.now() })
        .where(eq(aiDocumentEmbeddings.documentId, documentId))
        .returning();
      return updated;
    }
    const now = Date.now();
    const [created] = await db
      .insert(aiDocumentEmbeddings)
      .values({ documentId, embedding: serialized, createdAt: now, updatedAt: now })
      .returning();
    return created;
  }

  async deleteAiDocumentEmbeddingByDocumentId(documentId: number): Promise<boolean> {
    const result = await db
      .delete(aiDocumentEmbeddings)
      .where(eq(aiDocumentEmbeddings.documentId, documentId))
      .returning();
    return result.length > 0;
  }

  async getAiDocumentEmbeddingsWithDocuments(): Promise<Array<{ embedding: AiDocumentEmbedding; document: AiDocument }>> {
    const rows = await db
      .select({ embedding: aiDocumentEmbeddings, document: aiDocuments })
      .from(aiDocumentEmbeddings)
      .leftJoin(aiDocuments, eq(aiDocumentEmbeddings.documentId, aiDocuments.id));
    return rows.filter((row) => row.document !== null) as Array<{
      embedding: AiDocumentEmbedding;
      document: AiDocument;
    }>;
  }

  async getUnansweredQuestions(): Promise<UnansweredQuestion[]> {
    return db.select().from(unansweredQuestions).orderBy(desc(unansweredQuestions.createdAt));
  }

  async createUnansweredQuestion(question: InsertUnansweredQuestion): Promise<UnansweredQuestion> {
    const [created] = await db.insert(unansweredQuestions).values(question).returning();
    return created;
  }

  async updateUnansweredQuestionStatus(id: number, status: string): Promise<UnansweredQuestion | undefined> {
    const [updated] = await db.update(unansweredQuestions).set({ status }).where(eq(unansweredQuestions.id, id)).returning();
    return updated;
  }

  async deleteUnansweredQuestion(id: number): Promise<boolean> {
    const result = await db.delete(unansweredQuestions).where(eq(unansweredQuestions.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
