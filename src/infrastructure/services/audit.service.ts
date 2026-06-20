import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface AuditEntry {
  userId?: string | null;
  branchId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Fire-and-forget audit writer; failures are swallowed to avoid blocking flows. */
export class AuditService {
  async record(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          branchId: entry.branchId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (err) {
      console.error('[AuditService] failed to record entry', err);
    }
  }
}
