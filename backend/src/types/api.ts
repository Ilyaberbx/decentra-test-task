export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMetadata;
  filters?: FilterMetadata | null;
}

export interface PaginationMetadata {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface FilterMetadata {
  minValue: number | null;
  maxValue: number | null;
}

export interface PaginationQuery {
  limit: number;
  offset: number;
}

export interface CardsFilterQuery extends PaginationQuery {
  minValue: number | null;
  maxValue: number | null;
}

