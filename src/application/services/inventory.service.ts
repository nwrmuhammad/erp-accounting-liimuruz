import { BadRequestError, NotFoundError } from '@/core/errors/app-error';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext, Paginated } from '@/core/types/auth';
import { authorize, assertBranchAccess } from '@/presentation/guards/rbac';
import type { IInventoryRepository } from '@/domain/repositories/inventory.repository';
import type { IProductRepository } from '@/domain/repositories/product.repository';
import {
  toInventoryMovementDto,
  type InventoryMovementDto,
  type StockSummary,
} from '@/application/dto/inventory.dto';
import type {
  CreateInventoryMovementInput,
  ListInventoryQuery,
} from '@/presentation/validators/inventory.schema';

export class InventoryService {
  constructor(
    private readonly inventory: IInventoryRepository,
    private readonly products: IProductRepository,
  ) {}

  async list(
    ctx: AuthContext,
    query: ListInventoryQuery,
  ): Promise<Paginated<InventoryMovementDto>> {
    authorize(ctx, PERMISSIONS.INVENTORY_LIST);
    const branchId = isGlobalRole(ctx.roleType)
      ? query.branchId
      : (ctx.branchId ?? '__none__');

    const { items, total } = await this.inventory.list({
      branchId,
      productId: query.productId,
      type: query.type,
      search: query.search,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    });

    return {
      items: items.map(toInventoryMovementDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(ctx: AuthContext, id: string): Promise<InventoryMovementDto> {
    authorize(ctx, PERMISSIONS.INVENTORY_READ);
    const movement = await this.inventory.findById(id);
    if (!movement) throw new NotFoundError('Inventory movement not found');
    assertBranchAccess(ctx, movement.branchId);
    return toInventoryMovementDto(movement);
  }

  async create(
    ctx: AuthContext,
    input: CreateInventoryMovementInput,
  ): Promise<InventoryMovementDto> {
    authorize(ctx, PERMISSIONS.INVENTORY_CREATE);

    const branchId = isGlobalRole(ctx.roleType)
      ? (input.branchId ?? ctx.branchId!)
      : ctx.branchId!;

    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.branchId !== branchId) {
      throw new BadRequestError('Product does not belong to this branch');
    }

    if (input.type === 'OUTGOING' && product.stock < input.quantity) {
      throw new BadRequestError(
        `Insufficient stock. Available: ${product.stock}, requested: ${input.quantity}`,
      );
    }

    const totalCost =
      input.unitCost !== undefined && input.unitCost !== null
        ? input.unitCost * input.quantity
        : null;

    const movement = await this.inventory.create({
      branch: { connect: { id: branchId } },
      product: { connect: { id: input.productId } },
      type: input.type,
      quantity: input.quantity,
      unitCost: input.unitCost ?? null,
      totalCost,
      reason: input.reason ?? null,
      referenceId: input.referenceId ?? null,
      createdBy: { connect: { id: ctx.userId } },
    });

    // Update product stock
    if (input.type === 'INCOMING') {
      await this.products.incrementStock(input.productId, input.quantity);
    } else {
      await this.products.decrementStock(input.productId, input.quantity);
    }

    return toInventoryMovementDto(movement);
  }

  async getStockSummary(
    ctx: AuthContext,
    productId?: string,
  ): Promise<StockSummary[]> {
    authorize(ctx, PERMISSIONS.INVENTORY_LIST);
    const branchId = isGlobalRole(ctx.roleType)
      ? undefined
      : (ctx.branchId ?? undefined);

    if (!branchId && !isGlobalRole(ctx.roleType)) {
      throw new BadRequestError('Branch required');
    }

    return this.inventory.getStockSummary(branchId!, productId);
  }
}
