import { RoleType } from '@prisma/client';

export const PERMISSIONS = {
  // Users
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LIST: 'user:list',

  // Branches
  BRANCH_CREATE: 'branch:create',
  BRANCH_READ: 'branch:read',
  BRANCH_UPDATE: 'branch:update',
  BRANCH_DELETE: 'branch:delete',
  BRANCH_LIST: 'branch:list',

  // Roles
  ROLE_READ: 'role:read',
  ROLE_LIST: 'role:list',

  // Audit
  AUDIT_READ: 'audit:read',
  AUDIT_LIST: 'audit:list',

  // Notifications
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_LIST: 'notification:list',

  // Products
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_LIST: 'product:list',

  // Product Categories
  PRODUCT_CATEGORY_CREATE: 'product_category:create',
  PRODUCT_CATEGORY_READ: 'product_category:read',
  PRODUCT_CATEGORY_UPDATE: 'product_category:update',
  PRODUCT_CATEGORY_DELETE: 'product_category:delete',
  PRODUCT_CATEGORY_LIST: 'product_category:list',

  // Sales
  SALE_CREATE: 'sale:create',
  SALE_READ: 'sale:read',
  SALE_UPDATE: 'sale:update',
  SALE_DELETE: 'sale:delete',
  SALE_LIST: 'sale:list',

  // Debts
  DEBT_CREATE: 'debt:create',
  DEBT_READ: 'debt:read',
  DEBT_UPDATE: 'debt:update',
  DEBT_DELETE: 'debt:delete',
  DEBT_LIST: 'debt:list',
  DEBT_PAYMENT_CREATE: 'debt_payment:create',
  DEBT_PAYMENT_LIST: 'debt_payment:list',

  // Inventory
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_LIST: 'inventory:list',

  // Expenses
  EXPENSE_CREATE: 'expense:create',
  EXPENSE_READ: 'expense:read',
  EXPENSE_UPDATE: 'expense:update',
  EXPENSE_DELETE: 'expense:delete',
  EXPENSE_LIST: 'expense:list',
  // Kirim (Incoming)
  KIRIM_CREATE: 'kirim:create',
  KIRIM_READ: 'kirim:read',
  KIRIM_UPDATE: 'kirim:update',
  KIRIM_DELETE: 'kirim:delete',
  KIRIM_LIST: 'kirim:list',

  // Chiqim (Outgoing)
  CHIQIM_CREATE: 'chiqim:create',
  CHIQIM_READ: 'chiqim:read',
  CHIQIM_UPDATE: 'chiqim:update',
  CHIQIM_DELETE: 'chiqim:delete',
  CHIQIM_LIST: 'chiqim:list',

  // Hisobot
  HISOBOT_READ: 'hisobot:read',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

interface PermissionDefinition {
  key: PermissionKey;
  name: string;
  resource: string;
  action: string;
}

function def(key: PermissionKey, name: string): PermissionDefinition {
  const [resource, action] = key.split(':');
  return { key, name, resource: resource!, action: action! };
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  def(PERMISSIONS.USER_CREATE, 'Create users'),
  def(PERMISSIONS.USER_READ, 'View user details'),
  def(PERMISSIONS.USER_UPDATE, 'Update users'),
  def(PERMISSIONS.USER_DELETE, 'Delete users'),
  def(PERMISSIONS.USER_LIST, 'List users'),
  def(PERMISSIONS.BRANCH_CREATE, 'Create branches'),
  def(PERMISSIONS.BRANCH_READ, 'View branch details'),
  def(PERMISSIONS.BRANCH_UPDATE, 'Update branches'),
  def(PERMISSIONS.BRANCH_DELETE, 'Delete branches'),
  def(PERMISSIONS.BRANCH_LIST, 'List branches'),
  def(PERMISSIONS.ROLE_READ, 'View role details'),
  def(PERMISSIONS.ROLE_LIST, 'List roles'),
  def(PERMISSIONS.AUDIT_READ, 'View audit log entry'),
  def(PERMISSIONS.AUDIT_LIST, 'List audit logs'),
  def(PERMISSIONS.NOTIFICATION_READ, 'View notification'),
  def(PERMISSIONS.NOTIFICATION_LIST, 'List notifications'),
  def(PERMISSIONS.PRODUCT_CREATE, 'Create products'),
  def(PERMISSIONS.PRODUCT_READ, 'View product details'),
  def(PERMISSIONS.PRODUCT_UPDATE, 'Update products'),
  def(PERMISSIONS.PRODUCT_DELETE, 'Delete products'),
  def(PERMISSIONS.PRODUCT_LIST, 'List products'),
  def(PERMISSIONS.PRODUCT_CATEGORY_CREATE, 'Create product categories'),
  def(PERMISSIONS.PRODUCT_CATEGORY_READ, 'View product category details'),
  def(PERMISSIONS.PRODUCT_CATEGORY_UPDATE, 'Update product categories'),
  def(PERMISSIONS.PRODUCT_CATEGORY_DELETE, 'Delete product categories'),
  def(PERMISSIONS.PRODUCT_CATEGORY_LIST, 'List product categories'),
  def(PERMISSIONS.SALE_CREATE, 'Create sales'),
  def(PERMISSIONS.SALE_READ, 'View sale details'),
  def(PERMISSIONS.SALE_UPDATE, 'Update sales'),
  def(PERMISSIONS.SALE_DELETE, 'Delete sales'),
  def(PERMISSIONS.SALE_LIST, 'List sales'),
  def(PERMISSIONS.DEBT_CREATE, 'Create debts'),
  def(PERMISSIONS.DEBT_READ, 'View debt details'),
  def(PERMISSIONS.DEBT_UPDATE, 'Update debts'),
  def(PERMISSIONS.DEBT_DELETE, 'Delete debts'),
  def(PERMISSIONS.DEBT_LIST, 'List debts'),
  def(PERMISSIONS.DEBT_PAYMENT_CREATE, 'Record debt payments'),
  def(PERMISSIONS.DEBT_PAYMENT_LIST, 'List debt payments'),
  def(PERMISSIONS.INVENTORY_CREATE, 'Record inventory movements'),
  def(PERMISSIONS.INVENTORY_READ, 'View inventory movement details'),
  def(PERMISSIONS.INVENTORY_LIST, 'List inventory movements'),
  def(PERMISSIONS.EXPENSE_CREATE, 'Create expenses'),
  def(PERMISSIONS.EXPENSE_READ, 'View expense details'),
  def(PERMISSIONS.EXPENSE_UPDATE, 'Update expenses'),
  def(PERMISSIONS.EXPENSE_DELETE, 'Delete expenses'),
  def(PERMISSIONS.EXPENSE_LIST, 'List expenses'),
  def(PERMISSIONS.KIRIM_CREATE, 'Create kirim entries'),
  def(PERMISSIONS.KIRIM_READ, 'View kirim details'),
  def(PERMISSIONS.KIRIM_UPDATE, 'Update kirim entries'),
  def(PERMISSIONS.KIRIM_DELETE, 'Delete kirim entries'),
  def(PERMISSIONS.KIRIM_LIST, 'List kirim entries'),
  def(PERMISSIONS.CHIQIM_CREATE, 'Create chiqim entries'),
  def(PERMISSIONS.CHIQIM_READ, 'View chiqim details'),
  def(PERMISSIONS.CHIQIM_UPDATE, 'Update chiqim entries'),
  def(PERMISSIONS.CHIQIM_DELETE, 'Delete chiqim entries'),
  def(PERMISSIONS.CHIQIM_LIST, 'List chiqim entries'),
  def(PERMISSIONS.HISOBOT_READ, 'View hisobot report'),
  def(PERMISSIONS.ANALYTICS_READ, 'View analytics'),
];

export const ROLE_PERMISSION_MATRIX: Record<RoleType, PermissionKey[]> = {
  SUPER_ADMIN: PERMISSION_DEFINITIONS.map((p) => p.key),
  BOSS: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_LIST,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_LIST,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_LIST,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_LIST,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_LIST,
    PERMISSIONS.PRODUCT_CATEGORY_CREATE,
    PERMISSIONS.PRODUCT_CATEGORY_READ,
    PERMISSIONS.PRODUCT_CATEGORY_UPDATE,
    PERMISSIONS.PRODUCT_CATEGORY_DELETE,
    PERMISSIONS.PRODUCT_CATEGORY_LIST,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.SALE_UPDATE,
    PERMISSIONS.SALE_DELETE,
    PERMISSIONS.SALE_LIST,
    PERMISSIONS.DEBT_CREATE,
    PERMISSIONS.DEBT_READ,
    PERMISSIONS.DEBT_UPDATE,
    PERMISSIONS.DEBT_DELETE,
    PERMISSIONS.DEBT_LIST,
    PERMISSIONS.DEBT_PAYMENT_CREATE,
    PERMISSIONS.DEBT_PAYMENT_LIST,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_LIST,
    PERMISSIONS.EXPENSE_CREATE,
    PERMISSIONS.EXPENSE_READ,
    PERMISSIONS.EXPENSE_UPDATE,
    PERMISSIONS.EXPENSE_DELETE,
    PERMISSIONS.EXPENSE_LIST,
    PERMISSIONS.KIRIM_CREATE,
    PERMISSIONS.KIRIM_READ,
    PERMISSIONS.KIRIM_UPDATE,
    PERMISSIONS.KIRIM_DELETE,
    PERMISSIONS.KIRIM_LIST,
    PERMISSIONS.CHIQIM_CREATE,
    PERMISSIONS.CHIQIM_READ,
    PERMISSIONS.CHIQIM_UPDATE,
    PERMISSIONS.CHIQIM_DELETE,
    PERMISSIONS.CHIQIM_LIST,
    PERMISSIONS.HISOBOT_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
  EMPLOYEE: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_LIST,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_LIST,
    PERMISSIONS.PRODUCT_CATEGORY_READ,
    PERMISSIONS.PRODUCT_CATEGORY_LIST,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.SALE_UPDATE,
    PERMISSIONS.SALE_LIST,
    PERMISSIONS.DEBT_READ,
    PERMISSIONS.DEBT_LIST,
    PERMISSIONS.DEBT_PAYMENT_CREATE,
    PERMISSIONS.DEBT_PAYMENT_LIST,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_LIST,
    PERMISSIONS.EXPENSE_CREATE,
    PERMISSIONS.EXPENSE_READ,
    PERMISSIONS.EXPENSE_LIST,
    PERMISSIONS.KIRIM_CREATE,
    PERMISSIONS.KIRIM_READ,
    PERMISSIONS.KIRIM_LIST,
    PERMISSIONS.CHIQIM_CREATE,
    PERMISSIONS.CHIQIM_READ,
    PERMISSIONS.CHIQIM_LIST,
    PERMISSIONS.HISOBOT_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
};
