import type { Prisma, Product } from '@prisma/client';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: true; branch: true };
}>;

export type ProductCategoryWithRelations =
  Prisma.ProductCategoryGetPayload<{
    include: { branch: true };
  }>;

export interface ProductListFilter {
  branchId?: string;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  skip: number;
  take: number;
  orderBy?: keyof Pick<Product, 'name' | 'stock' | 'createdAt'>;
  orderDir?: 'asc' | 'desc';
}

export interface ProductCategoryListFilter {
  branchId?: string;
  search?: string;
  skip: number;
  take: number;
}

export interface IProductRepository {
  // Products
  findById(id: string): Promise<ProductWithRelations | null>;
  findBySku(sku: string, branchId: string): Promise<Product | null>;
  list(
    filter: ProductListFilter,
  ): Promise<{ items: ProductWithRelations[]; total: number }>;
  create(data: Prisma.ProductCreateInput): Promise<ProductWithRelations>;
  update(
    id: string,
    data: Prisma.ProductUpdateInput,
  ): Promise<ProductWithRelations>;
  delete(id: string): Promise<void>;
  incrementStock(id: string, qty: number): Promise<void>;
  decrementStock(id: string, qty: number): Promise<void>;

  // Categories
  findCategoryById(
    id: string,
  ): Promise<ProductCategoryWithRelations | null>;
  findCategoryByName(
    name: string,
    branchId: string,
  ): Promise<ProductCategoryWithRelations | null>;
  listCategories(
    filter: ProductCategoryListFilter,
  ): Promise<{ items: ProductCategoryWithRelations[]; total: number }>;
  createCategory(
    data: Prisma.ProductCategoryCreateInput,
  ): Promise<ProductCategoryWithRelations>;
  updateCategory(
    id: string,
    data: Prisma.ProductCategoryUpdateInput,
  ): Promise<ProductCategoryWithRelations>;
  deleteCategory(id: string): Promise<void>;
}
