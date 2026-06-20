import type {
  ProductCategoryWithRelations,
  ProductWithRelations,
} from '@/domain/repositories/product.repository';

export interface ProductCategoryDto {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
  branchId: string;
  branchName: string;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export function toProductCategoryDto(
  c: ProductCategoryWithRelations,
): ProductCategoryDto {
  return {
    id: c.id,
    name: c.name,
    branchId: c.branchId,
    branchName: c.branch.name,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function toProductDto(p: ProductWithRelations): ProductDto {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    unit: p.unit,
    costPrice: p.costPrice.toNumber(),
    sellingPrice: p.sellingPrice.toNumber(),
    stock: p.stock,
    isActive: p.isActive,
    branchId: p.branchId,
    branchName: p.branch.name,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
