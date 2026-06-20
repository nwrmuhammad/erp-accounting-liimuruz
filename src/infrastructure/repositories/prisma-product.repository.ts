import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  IProductRepository,
  ProductCategoryListFilter,
  ProductCategoryWithRelations,
  ProductListFilter,
  ProductWithRelations,
} from '@/domain/repositories/product.repository';

const productInclude = {
  category: true,
  branch: true,
} satisfies Prisma.ProductInclude;

const categoryInclude = {
  branch: true,
} satisfies Prisma.ProductCategoryInclude;

export class PrismaProductRepository implements IProductRepository {
  findById(id: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  findBySku(sku: string, branchId: string) {
    return prisma.product.findUnique({ where: { sku_branchId: { sku, branchId } } });
  }

  async list(
    filter: ProductListFilter,
  ): Promise<{ items: ProductWithRelations[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { sku: { contains: filter.search, mode: 'insensitive' } },
              { description: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filter.orderBy
        ? { [filter.orderBy]: filter.orderDir ?? 'desc' }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: filter.skip,
        take: filter.take,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  create(data: Prisma.ProductCreateInput): Promise<ProductWithRelations> {
    return prisma.product.create({ data, include: productInclude });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithRelations> {
    return prisma.product.update({ where: { id }, data, include: productInclude });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }

  async incrementStock(id: string, qty: number): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { stock: { increment: qty } },
    });
  }

  async decrementStock(id: string, qty: number): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { stock: { decrement: qty } },
    });
  }

  // Categories
  findCategoryById(id: string): Promise<ProductCategoryWithRelations | null> {
    return prisma.productCategory.findUnique({ where: { id }, include: categoryInclude });
  }

  findCategoryByName(name: string, branchId: string): Promise<ProductCategoryWithRelations | null> {
    return prisma.productCategory.findUnique({
      where: { name_branchId: { name, branchId } },
      include: categoryInclude,
    });
  }

  async listCategories(
    filter: ProductCategoryListFilter,
  ): Promise<{ items: ProductCategoryWithRelations[]; total: number }> {
    const where: Prisma.ProductCategoryWhereInput = {
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.search
        ? { name: { contains: filter.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        include: categoryInclude,
        orderBy: { name: 'asc' },
        skip: filter.skip,
        take: filter.take,
      }),
      prisma.productCategory.count({ where }),
    ]);

    return { items, total };
  }

  createCategory(
    data: Prisma.ProductCategoryCreateInput,
  ): Promise<ProductCategoryWithRelations> {
    return prisma.productCategory.create({ data, include: categoryInclude });
  }

  updateCategory(
    id: string,
    data: Prisma.ProductCategoryUpdateInput,
  ): Promise<ProductCategoryWithRelations> {
    return prisma.productCategory.update({ where: { id }, data, include: categoryInclude });
  }

  async deleteCategory(id: string): Promise<void> {
    await prisma.productCategory.delete({ where: { id } });
  }
}
