import { NotFoundError } from '@/core/errors/app-error';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext, Paginated } from '@/core/types/auth';
import { authorize, assertBranchAccess } from '@/presentation/guards/rbac';
import type { ISaleRepository } from '@/domain/repositories/sale.repository';
import type { IBranchRepository } from '@/domain/repositories/branch.repository';
import { toSaleDto, type SaleDto } from '@/application/dto/sale.dto';
import type {
  CreateSaleInput,
  UpdateSaleInput,
  ListSalesQuery,
} from '@/presentation/validators/sale.schema';

export class SaleService {
  constructor(
    private readonly sales: ISaleRepository,
    private readonly branches: IBranchRepository,
  ) {}

  async list(ctx: AuthContext, query: ListSalesQuery): Promise<Paginated<SaleDto>> {
    authorize(ctx, PERMISSIONS.SALE_LIST);
    const branchId = isGlobalRole(ctx.roleType)
      ? query.branchId
      : (ctx.branchId ?? '__none__');

    const { items, total } = await this.sales.list({
      branchId,
      paymentType: query.paymentType,
      onlineReceiver: query.onlineReceiver,
      currency: query.currency,
      search: query.search,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
      mode: query.mode,
    });

    return {
      items: items.map(toSaleDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(ctx: AuthContext, id: string): Promise<SaleDto> {
    authorize(ctx, PERMISSIONS.SALE_READ);
    const sale = await this.sales.findById(id);
    if (!sale) throw new NotFoundError('Sale not found');
    assertBranchAccess(ctx, sale.branchId);
    return toSaleDto(sale);
  }

  async create(ctx: AuthContext, input: CreateSaleInput): Promise<SaleDto> {
    authorize(ctx, PERMISSIONS.SALE_CREATE);

    const branchId = isGlobalRole(ctx.roleType)
      ? (input.branchId ?? ctx.branchId!)
      : ctx.branchId!;

    const branch = await this.branches.findById(branchId);
    if (!branch) throw new NotFoundError('Branch not found');

    const saleNumber = await this.sales.getNextSaleNumber(branch.code);

    const sale = await this.sales.create({
      saleNumber,
      branch: { connect: { id: branchId } },
      createdBy: { connect: { id: ctx.userId } },
      productName: input.productName ?? null,
      quantity: input.quantity ?? null,
      paymentType: input.paymentType,
      onlineReceiver: input.onlineReceiver ?? null,
      totalAmount: input.totalAmount,
      currency: input.currency ?? 'UZS',
      saleDate: input.saleDate ? new Date(input.saleDate) : new Date(),
      status: input.status ?? 'OCHIQ',
      notes: input.notes ?? null,
    });

    return toSaleDto(sale);
  }

  async update(ctx: AuthContext, id: string, input: UpdateSaleInput): Promise<SaleDto> {
    authorize(ctx, PERMISSIONS.SALE_UPDATE);
    const sale = await this.sales.findById(id);
    if (!sale) throw new NotFoundError('Sale not found');
    assertBranchAccess(ctx, sale.branchId);

    const updated = await this.sales.update(id, {
      ...(input.productName !== undefined ? { productName: input.productName || null } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.paymentType !== undefined ? { paymentType: input.paymentType } : {}),
      ...(input.onlineReceiver !== undefined ? { onlineReceiver: input.onlineReceiver } : {}),
      ...(input.saleDate !== undefined ? { saleDate: new Date(input.saleDate) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.puliOlindi !== undefined ? { puliOlindi: input.puliOlindi } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    return toSaleDto(updated);
  }

  async remove(ctx: AuthContext, id: string): Promise<void> {
    authorize(ctx, PERMISSIONS.SALE_DELETE);
    const sale = await this.sales.findById(id);
    if (!sale) throw new NotFoundError('Sale not found');
    assertBranchAccess(ctx, sale.branchId);
    await this.sales.delete(id);
  }
}
