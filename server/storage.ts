import { db } from "./db";
import {
  schools, programs, programDetails, tools,
  type School, type InsertSchool,
  type Program, type InsertProgram,
  type ProgramDetail, type InsertProgramDetail,
  type Tool, type InsertTool
} from "@shared/schema";
import { eq, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // Schools
  getSchools(query?: string): Promise<School[]>;
  getSchoolByInep(inep: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;

  // Programs
  getPrograms(): Promise<Program[]>;
  getProgramByCode(code: string): Promise<Program | undefined>;
  getProgramDetails(programCode: string): Promise<ProgramDetail[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  createProgramDetail(detail: InsertProgramDetail): Promise<ProgramDetail>;

  // Tools
  getTools(category?: string): Promise<Tool[]>;
  createTool(tool: InsertTool): Promise<Tool>;
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

  async createProgramDetail(detail: InsertProgramDetail): Promise<ProgramDetail> {
    const [newDetail] = await db.insert(programDetails).values(detail).returning();
    return newDetail;
  }

  async getTools(category?: string): Promise<Tool[]> {
    if (!category) return db.select().from(tools);
    return db.select().from(tools).where(eq(tools.category, category));
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [newTool] = await db.insert(tools).values(tool).returning();
    return newTool;
  }
}

export const storage = new DatabaseStorage();
