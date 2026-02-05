import { z } from 'zod';
import { insertSchoolSchema, insertProgramSchema, insertToolSchema, schools, programs, tools, programDetails } from './schema';

// === API CONTRACT ===
export const api = {
  schools: {
    search: {
      method: 'GET' as const,
      path: '/api/schools',
      input: z.object({
        q: z.string().optional(), // Search by INEP, name, city
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
  // Chat is handled by the integration routes registerChatRoutes
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
