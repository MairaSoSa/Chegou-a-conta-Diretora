import { z } from 'zod';
import { insertSchoolSchema, insertProgramSchema, insertToolSchema, insertGlossarySchema, insertTrilhaUnitSchema, schools, programs, tools, programDetails, glossary, trilhaUnits } from './schema';

export const api = {
  schools: {
    search: {
      method: 'GET' as const,
      path: '/api/schools',
      input: z.object({
        q: z.string().optional(),
      }),
      responses: {
        200: z.array(z.custom<typeof schools.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/schools/:inep',
      responses: {
        200: z.custom<typeof schools.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  programs: {
    list: {
      method: 'GET' as const,
      path: '/api/programs',
      responses: {
        200: z.array(z.custom<typeof programs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/programs/:code',
      responses: {
        200: z.custom<typeof programs.$inferSelect & { details: typeof programDetails.$inferSelect[] }>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  tools: {
    list: {
      method: 'GET' as const,
      path: '/api/tools',
      input: z.object({
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof tools.$inferSelect>()),
      },
    },
  },
  glossary: {
    list: {
      method: 'GET' as const,
      path: '/api/glossary',
      responses: {
        200: z.array(z.custom<typeof glossary.$inferSelect>()),
      },
    },
  },
  trilha: {
    list: {
      method: 'GET' as const,
      path: '/api/trilha',
      responses: {
        200: z.array(z.custom<typeof trilhaUnits.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trilha/:unitId',
      responses: {
        200: z.custom<typeof trilhaUnits.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
