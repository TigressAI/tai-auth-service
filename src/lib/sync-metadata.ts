import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Syncs a user's product entitlements to Clerk's public_metadata.
 * This allows downstream apps (like RIE) to check access via the JWT
 * without needing to query the centralized database.
 */
export async function syncUserMetadata(userId: string) {
    try {
        // Fetch all active product access records for the user
        const accessRecords = await prisma.userProductAccess.findMany({
            where: {
                userId: userId,
                isActive: true,
            },
            include: {
                product: true,
                plan: true,
            },
        });

        // Construct the metadata object
        // Format: { products: ["rie", "copilot"], plans: { "rie": "pro", "copilot": "basic" } }
        const products: string[] = [];
        const plans: Record<string, string> = {};

        for (const record of accessRecords) {
            products.push(record.product.key);
            if (record.plan) {
                plans[record.product.key] = record.plan.key;
            }
        }

        // Update Clerk user metadata
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                products,
                plans,
            },
        });

        console.log(`Synced metadata for user ${userId}:`, { products, plans });
    } catch (error) {
        console.error(`Failed to sync metadata for user ${userId}:`, error);
        throw error;
    }
}
