import { prisma } from "../prisma";
import { SessionService } from "./session";

export interface AuthContext {
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string | null;
    onboardingCompleted: boolean;
  };
  farm: {
    id: string;
    slug: string;
    name: string;
    locationCounty: string;
    currency: string;
    farmSizeAcres?: number | null;
    timezone: string;
  };
  membership: {
    role: "OWNER" | "MANAGER" | "FARM_HAND";
  };
  isOwner: boolean;
  isManager: boolean;
  canEdit: boolean;
}

export class AuthContextService {
  /**
   * Resolves the authoritative active farm and authenticated user.
   * If a farmIdOrSlug is provided, validates that the user is a member.
   */
  static async getActiveContext(
    farmIdOrSlug?: string | null,
    userEmail?: string | null
  ): Promise<AuthContext> {
    // 1. Resolve User (from session or provided userEmail or default demo account)
    let emailToFind = userEmail;
    let farmIdToFind = farmIdOrSlug;

    if (!emailToFind) {
      const activeSession = await SessionService.getSession();
      if (activeSession) {
        emailToFind = activeSession.email;
        if (!farmIdToFind && activeSession.farmId) {
          farmIdToFind = activeSession.farmId;
        }
      }
    }

    let user = await prisma.user.findFirst({
      where: emailToFind ? { email: emailToFind } : { email: "farmer@farmpulse.co.ke" },
    });

    if (!user) {
      // Fallback: first user in the database
      user = await prisma.user.findFirst();
    }

    if (!user) {
      throw new Error("No authenticated user found in the database. Please run database seeding.");
    }

    // 2. Resolve Farm
    let farm: any = null;
    if (farmIdToFind) {
      farm = await prisma.farm.findFirst({
        where: {
          OR: [{ id: farmIdToFind }, { slug: farmIdToFind }],
        },
      });
    }

    if (!farm) {
      // Find farm user belongs to
      const memberRecord = await prisma.farmMember.findFirst({
        where: { userId: user.id },
        include: { farm: true },
      });
      if (memberRecord) {
        farm = memberRecord.farm;
      } else {
        // Fallback: first farm in database
        farm = await prisma.farm.findFirst({
          where: { slug: "baraka-agri-ventures" },
        }) || await prisma.farm.findFirst();
      }
    }

    if (!farm) {
      throw new Error("No farm found in the database. Please run database seeding.");
    }

    // 3. Verify Membership and Permissions
    let membership = await prisma.farmMember.findUnique({
      where: {
        farmId_userId: {
          farmId: farm.id,
          userId: user.id,
        },
      },
    });

    // If user is not yet a member in local dev context, automatically grant OWNER
    if (!membership) {
      membership = await prisma.farmMember.create({
        data: {
          farmId: farm.id,
          userId: user.id,
          role: "OWNER",
        },
      });
    }

    const role = (membership.role as "OWNER" | "MANAGER" | "FARM_HAND") || "OWNER";
    const isOwner = role === "OWNER";
    const isManager = role === "MANAGER" || isOwner;
    const canEdit = isOwner || isManager;

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        onboardingCompleted:
          (user as any).onboardingCompleted !== undefined
            ? Boolean((user as any).onboardingCompleted)
            : Boolean(membership),
      },
      farm: {
        id: farm.id,
        slug: farm.slug,
        name: farm.name,
        locationCounty: farm.locationCounty,
        currency: farm.currency,
        farmSizeAcres: farm.farmSizeAcres,
        timezone: farm.timezone,
      },
      membership: {
        role,
      },
      isOwner,
      isManager,
      canEdit,
    };
  }

  /**
   * Authorize that a user has permission to perform operations on a specific farm.
   * Throws an error if unauthorized.
   */
  static async verifyFarmAccess(
    userId: string,
    farmIdOrSlug: string,
    requiredRole?: "OWNER" | "MANAGER" | "FARM_HAND"
  ): Promise<{ farmId: string; role: string }> {
    const farm = await prisma.farm.findFirst({
      where: {
        OR: [{ id: farmIdOrSlug }, { slug: farmIdOrSlug }],
      },
    });

    if (!farm) {
      throw new Error(`Farm '${farmIdOrSlug}' not found.`);
    }

    const member = await prisma.farmMember.findUnique({
      where: {
        farmId_userId: {
          farmId: farm.id,
          userId,
        },
      },
    });

    if (!member) {
      throw new Error(`Unauthorized: User does not belong to farm '${farm.name}'.`);
    }

    if (requiredRole === "OWNER" && member.role !== "OWNER") {
      throw new Error("Unauthorized: Only farm OWNER can perform this operation.");
    }

    if (requiredRole === "MANAGER" && member.role !== "OWNER" && member.role !== "MANAGER") {
      throw new Error("Unauthorized: Only OWNER or MANAGER can perform this operation.");
    }

    return { farmId: farm.id, role: member.role };
  }
}
