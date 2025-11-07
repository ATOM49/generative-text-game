/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';

// Helper to build query key from path and params
function buildQueryKey(
  path: string | ((data: any) => string),
  params?: Record<string, any>,
): QueryKey {
  if (!params || Object.keys(params).length === 0) return [path];
  return [path, params];
}

// Helper to build URL with query params
function buildUrl(path: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return path;

  // Check if path is already a full URL
  try {
    const url = new URL(path);
    // It's a full URL, add params to it
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
    return url.toString();
  } catch {
    // It's a relative path, build normally
    const search = new URLSearchParams(params).toString();
    return `${path}?${search}`;
  }
}

// Generic GET hook
export function useApiQuery<T = unknown>(
  path: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error>({
    queryKey: buildQueryKey(path, params),
    queryFn: async () => {
      const res = await fetch(buildUrl(path, params));
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    ...options,
  });
}

// Generic mutation hook (POST, PUT, DELETE)
export function useApiMutation<T = unknown, TVariables = any>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string | ((variables: TVariables) => string),
  params?: Record<string, any>,
  options?: Omit<
    UseMutationOptions<T, Error, TVariables>,
    'mutationKey' | 'mutationFn'
  >,
) {
  return useMutation<T, Error, TVariables>({
    mutationKey: buildQueryKey(path, params),
    mutationFn: async (variables: TVariables) => {
      const res = await fetch(
        buildUrl(typeof path === 'function' ? path(variables) : path, params),
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'DELETE' ? undefined : JSON.stringify(variables),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    ...options,
  });
}
