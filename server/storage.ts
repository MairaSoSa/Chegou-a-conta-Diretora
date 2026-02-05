import { db } from "./db";
import {
  schools, programs, programDetails, tools, glossary, trilhaUnits,
  type School, type InsertSchool,
  type Program, type InsertProgram,
  type ProgramDetail, type InsertProgramDetail,
  type Tool, type InsertTool,
  type GlossaryItem, type InsertGlossaryItem,
  type TrilhaUnit, type InsertTrilhaUnit
} from "@shared/schema";
import { eq, ilike, or, asc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  async getSchools(query?: string): Promise<School[]> {
    if (!query) return db.select().from(schools);
    const search = `%${query}%`;
    return db.select().from(schools).where(
      or(
        ilike(schools.inep, search),
        ilike(schools.name, search),
        ilike(schools.city, search)
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
    return db.select().from(trilhaUnits).orderBy(asc(trilhaUnits.sortOrder), asc(trilhaUnits.unitId));
  }

  async getTrilhaUnitByUnitId(unitId: string): Promise<TrilhaUnit | undefined> {
    const [unit] = await db.select().from(trilhaUnits).where(eq(trilhaUnits.unitId, unitId));
    return unit;
  }

  async createTrilhaUnit(unit: InsertTrilhaUnit): Promise<TrilhaUnit> {
    const [newUnit] = await db.insert(trilhaUnits).values(unit).returning();
    return newUnit;
  }

  async updateTrilhaUnit(id: number, unit: Partial<InsertTrilhaUnit>): Promise<TrilhaUnit | undefined> {
    const [updated] = await db.update(trilhaUnits).set(unit).where(eq(trilhaUnits.id, id)).returning();
    return updated;
  }

  async deleteTrilhaUnit(id: number): Promise<boolean> {
    const result = await db.delete(trilhaUnits).where(eq(trilhaUnits.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
