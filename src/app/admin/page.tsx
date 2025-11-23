import { PrismaClient } from "@prisma/client";
import { syncUserMetadata } from "@/lib/sync-metadata";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

async function toggleRieAccess(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const enable = formData.get("enable") === "true";

    // Ensure RIE product exists
    let product = await prisma.product.findUnique({ where: { key: "rie" } });
    if (!product) {
        product = await prisma.product.create({
            data: { key: "rie", name: "Regulatory Intelligence Engine" },
        });
    }

    if (enable) {
        await prisma.userProductAccess.upsert({
            where: { userId_productId: { userId, productId: product.id } },
            update: { isActive: true },
            create: { userId, productId: product.id, isActive: true },
        });
    } else {
        await prisma.userProductAccess.updateMany({
            where: { userId, productId: product.id },
            data: { isActive: false },
        });
    }

    await syncUserMetadata(userId);
    revalidatePath("/admin");
}

export default async function AdminPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const user = await currentUser();

    // Check if user exists in database and has admin privileges
    const dbUser = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!dbUser || !dbUser.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">
                            You do not have admin privileges. Please contact your administrator.
                        </p>
                        <p className="text-sm text-gray-500">
                            User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const users = await prisma.user.findMany({
        include: {
            productAccess: {
                include: { product: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">TigressAI Admin</h1>
                <div className="text-sm text-gray-600">
                    Logged in as: <span className="font-semibold">{user?.emailAddresses[0]?.emailAddress}</span>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RIE Access</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                            const hasRieAccess = user.productAccess.some(
                                (a) => a.product.key === "rie" && a.isActive
                            );

                            return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.firstName} {user.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500">{user.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hasRieAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}>
                                            {hasRieAccess ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <form action={toggleRieAccess}>
                                            <input type="hidden" name="userId" value={user.id} />
                                            <input type="hidden" name="enable" value={(!hasRieAccess).toString()} />
                                            <button
                                                type="submit"
                                                className={`text-white px-3 py-1 rounded ${hasRieAccess ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                                                    }`}
                                            >
                                                {hasRieAccess ? "Revoke" : "Grant"}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
