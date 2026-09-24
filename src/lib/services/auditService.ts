import { prisma } from "../prisma";

export interface AuditLogParams {
  farmId: string;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VOID";
  actorId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

export async function logAuditAction(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        farmId: params.farmId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Audit log failure should not crash transaction, but is reported
    return null;
  }
}
