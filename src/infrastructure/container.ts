/**
 * Composition root — wires concrete repositories into services.
 * Route handlers import the singletons from here (simple DI without a framework).
 */
import { PrismaUserRepository } from '@/infrastructure/repositories/prisma-user.repository';
import { PrismaBranchRepository } from '@/infrastructure/repositories/prisma-branch.repository';
import { PrismaRoleRepository } from '@/infrastructure/repositories/prisma-role.repository';
import { PrismaAuthRepository } from '@/infrastructure/repositories/prisma-auth.repository';
import { PrismaProductRepository } from '@/infrastructure/repositories/prisma-product.repository';
import { PrismaSaleRepository } from '@/infrastructure/repositories/prisma-sale.repository';
import { PrismaInventoryRepository } from '@/infrastructure/repositories/prisma-inventory.repository';
import { PrismaExpenseRepository } from '@/infrastructure/repositories/prisma-expense.repository';
import { AuditService } from '@/infrastructure/services/audit.service';
import { AuthService } from '@/application/services/auth.service';
import { UserService } from '@/application/services/user.service';
import { BranchService } from '@/application/services/branch.service';
import { ProductService } from '@/application/services/product.service';
import { SaleService } from '@/application/services/sale.service';
import { InventoryService } from '@/application/services/inventory.service';
import { ExpenseService } from '@/application/services/expense.service';
import { AnalyticsService } from '@/application/services/analytics.service';

// Repositories
const userRepository = new PrismaUserRepository();
const branchRepository = new PrismaBranchRepository();
const roleRepository = new PrismaRoleRepository();
const authRepository = new PrismaAuthRepository();
const productRepository = new PrismaProductRepository();
const saleRepository = new PrismaSaleRepository();
const inventoryRepository = new PrismaInventoryRepository();
const expenseRepository = new PrismaExpenseRepository();

// Services
export const auditService = new AuditService();
export const authService = new AuthService(userRepository, authRepository);
export const userService = new UserService(userRepository, branchRepository, roleRepository);
export const branchService = new BranchService(branchRepository);
export const productService = new ProductService(productRepository);
export const saleService = new SaleService(saleRepository, branchRepository);
export const inventoryService = new InventoryService(inventoryRepository, productRepository);
export const expenseService = new ExpenseService(expenseRepository);
export const analyticsService = new AnalyticsService();
