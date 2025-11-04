import { z } from 'zod';

const SortOrder = z.enum(['asc', 'desc'] as const);
const WorldSortBy = z.enum(['name', 'createdAt', 'updatedAt'] as const);

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: WorldSortBy.default('createdAt'),
  sortOrder: SortOrder.default('desc'),
});

export const WorldQueryParamsSchema = PaginationParamsSchema.extend({
  theme: z.string().optional(),
  search: z.string().optional(),
});

export type SortOrder = z.infer<typeof SortOrder>;
export type WorldSortBy = z.infer<typeof WorldSortBy>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type WorldQueryParams = z.infer<typeof WorldQueryParamsSchema>;

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type QueryConfig<T extends Record<string, unknown>> = {
  where?: T;
  skip?: number;
  take?: number;
  orderBy?: Record<string, SortOrder>;
};
