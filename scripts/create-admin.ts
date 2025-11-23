import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdminUser(email: string, clerkUserId: string, firstName?: string, lastName?: string) {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            console.log(`ℹ️  User ${email} already exists`)
            console.log(`   Granting admin privileges...`)

            await prisma.user.update({
                where: { email },
                data: { isAdmin: true }
            })

            console.log(`✅ Successfully granted admin privileges to ${email}`)
            return
        }

        // Create new user with admin privileges
        const user = await prisma.user.create({
            data: {
                id: clerkUserId,
                email,
                firstName: firstName || null,
                lastName: lastName || null,
                isAdmin: true
            }
        })

        console.log(`✅ Successfully created admin user: ${email}`)
        console.log(`   User ID: ${user.id}`)
        console.log(`   Admin: ${user.isAdmin}`)
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

const email = process.argv[2]
const clerkUserId = process.argv[3]
const firstName = process.argv[4]
const lastName = process.argv[5]

if (!email || !clerkUserId) {
    console.error('❌ Please provide email and Clerk User ID')
    console.log('\nUsage: npm run create-admin <email> <clerk-user-id> [firstName] [lastName]')
    console.log('Example: npm run create-admin admin@tigressai.com user_2abc123xyz "John" "Doe"')
    console.log('\n💡 You can find your Clerk User ID in the Clerk Dashboard or in the "Access Denied" message')
    process.exit(1)
}

createAdminUser(email, clerkUserId, firstName, lastName)
