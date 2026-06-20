import { ConflictError, NotFoundError } from '@/core/errors/app-error';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext, Paginated } from '@/core/types/auth';
import { authorize, assertBranchAccess, branchScopeFilter } from '@/presentation/guards/rbac';
import type { IProductRepository } from '@/domain/repositories/product.repository';
import {
  toProductCategoryDto,
  toProductDto,
  type ProductCategoryDto,
  type ProductDto,
} from '@/application/dto/product.dto';
import type {
  CreateProductCategoryInput,
  CreateProductInput,
  ListProductCategoriesQuery,
  ListProductsQuery,
  UpdateProductCategoryInput,
  UpdateProductInput,
} from '@/presentation/validators/product.schema';

export class ProductService {
  constructor(private readonly products: IProductRepository) {}

  // --------------- Categories ---------------

  async listCategories(
    ctx: AuthContext,
    query: ListProductCategoriesQuery,
  ): Promise<Paginated<ProductCategoryDto>> {
    authorize(ctx, PERMISSIONS.PRODUCT_CATEGORY_LIST);
    const branchId = isGlobalRole(ctx.roleType) ? query.branchId : (ctx.branchId ?? '__none__');
    const { items, total } = await this.products.listCategories({
      branchId,
      search: query.search,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items: items.map(toProductCategoryDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getCategoryById(ctx: AuthContext, id: string): Promise<ProductCategoryDto> {
    authorize(ctx, PERMISSIONS.PRODUCT_CATEGORY_READ);
    const cat = await this.products.findCategoryById(id);
    if (!cat) throw new NotFoundError('Product category not found');
    assertBranchAccess(ctx, cat.branchId);
    return toProductCategoryDto(cat);
  }

  async createCategory(
    ctx: AuthContext,
    input: CreateProductCategoryInput,
  ): Promise<ProductCategoryDto> {
    authorize(ctx, PERMISSIONS.PRODUCT_CATEGORY_CREATE);
    const branchId = isGlobalRole(ctx.roleType)
      ? (input.branchId ?? ctx.branchId!)
      : ctx.branchId!;

    const existing = await this.products.findCategoryByName(input.name, branchId);
    if (existing) throw new ConflictError('Category with this name already exists');

    const cat = await this.products.createCategory({
      name: input.name,
      branch: { connect: { id: branchId } },
    });
    return toProductCategoryDto(cat);
  }

  async updateCategory(
    ctx: AuthContext,
    id: string,
    input: UpdateProductCategoryInput,
  ): Promise<ProductCategoryDto> {
    authorize(ctx, PERMISSIONS.PRODUCT_CATEGORY_UPDATE);
    const cat = await this.products.findCategoryById(id);
    if (!cat) throw new NotFoundError('Product category not found');
    assertBranchAccess(ctx, cat.branchId);

    if (input.name && input.name !== cat.name) {
      const existing = await this.products.findCategoryByName(input.name, cat.branchId);
      if (existing) throw new ConflictError('Category with this name already exists');
    }

    const updated = await this.products.updateCategory(id, {
      ...(input.name ? { name: input.name } : {}),
    });
    return toProductCategoryDto(updated);
  }

  async deleteCategory(ctx: AuthContext, id: string): Promise<void> {
    authorize(ctx, PERMISSIONS.PRODUCT_CATEGORY_DELETE);
    const cat = await this.products.findCategoryById(id);
    if (!cat) throw new NotFoundError('Product category not found');
    assertBranchAccess(ctx, cat.branchId);
    await this.products.deleteCategory(id);
  }

  // --------------- Products ---------------

  async list(
    ctx: AuthContext,
    query: ListProductsQuery,
  ): Promise<Paginated<ProductDto>> {
    authorize(ctx, PERMISSIONS.PRODUCT_LIST);
    const branchId = isGlobalRole(ctx.roleType) ? query.branchId : (ctx.branchId ?? '__none__');
    const { items, total } = await this.products.list({
      branchId,
      categoryId: query.categoryId,
      search: query.search,
      isActive: query.isActive,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    });
    return {
      items: items.map(toProductDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(ctx: AuthContext, id: string): Promise<ProductDto> {
    authorize(ctx, PERMISSIONS.PRODUCT_READ);
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    assertBranchAccess(ctx, product.branchId);
    return toProductDto(product);
  }

  async create(ctx: AuthContext, input: CreateProductInput): Promise<ProductDto> {
    authorize(ctx, PERMISSIONS.PRODUCT_CREATE);
    const branchId = isGlobalRole(ctx.roleType)
      ? (input.branchId ?? ctx.branchId!)
      : ctx.branchId!;

    const existing = await this.products.findBySku(input.sku, branchId);
    if (existing) throw new ConflictError('Product with this SKU already exists in this branch');

    if (input.categoryId) {
      const cat = await this.products.findCategoryById(input.categoryId);
      if (!cat) throw new NotFoundError('Product category not found');
      assertBranchAccess(ctx, cat.branchId);
    }

    const product = await this.products.create({
      name: input.name,
      sku: input.sku,
      description: input.description ?? null,
      unit: input.unit ?? 'pcs',
      costPrice: input.costPrice,
      sellingPrice: input.sellingPrice,
      stock: input.stock ?? 0,
      isActive: input.isActive ?? true,
      branch: { connect: { id: branchId } },
      ...(input.categoryId
        ? { category: { connect: { id: input.categoryId } } }
        : {}),
    });
    return toProductDto(product);
  }

  async update(
    ctx: AuthContext,
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDto> {
    authorize(ctx, PERMISSIONS.PRODUCT_UPDATE);
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    assertBranchAccess(ctx, product.branchId);

    if (input.sku && input.sku !== product.sku) {
      const existing = await this.products.findBySku(input.sku, product.branchId);
      if (existing) throw new ConflictError('Product with this SKU already exists in this branch');
    }

    if (input.categoryId) {
      const cat = await this.products.findCategoryById(input.categoryId);
      if (!cat) throw new NotFoundError('Product category not found');
    }

    const updated = await this.products.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
      ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
    });
    return toProductDto(updated);
  }

  async remove(ctx: AuthContext, id: string): Promise<void> {
    authorize(ctx, PERMISSIONS.PRODUCT_DELETE);
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    assertBranchAccess(ctx, product.branchId);
    await this.products.delete(id);
  }
}
