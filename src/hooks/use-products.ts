'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { Product, ProductCategory, PaginatedResponse, CreateProductDto } from '@/types';

interface ProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Product>>(`/products${buildQuery(params)}`),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => apiClient.get<Product>(`/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProductDto) => apiClient.post<Product>('/products', dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CreateProductDto>) =>
      apiClient.patch<Product>(`/products/${id}`, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

// ─── Categories ────────────────────────────────────────────────────────────────
export function useProductCategories(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['product-categories', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ProductCategory>>(
        `/products/categories${buildQuery(params)}`,
      ),
  });
}

export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; description?: string }) =>
      apiClient.post<ProductCategory>('/products/categories', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}

export function useUpdateProductCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name?: string; description?: string }) =>
      apiClient.patch<ProductCategory>(`/products/categories/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}
