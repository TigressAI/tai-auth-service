import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.error(`❌ User with email ${email} not found in database`)
            console.log('\n💡 The user must sign in at least once before they can be made an admin.')
            console.log('   After they sign in, the webhook will create their user record.')
            return
        }

        await prisma.user.update({
            where: { email },
            data: { isAdmin: true }
        })

        console.log(`✅ Successfully granted admin privileges to ${email}`)
        console.log(`   User ID: ${user.id}`)
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

const email = process.argv[2]

if (!email) {
    console.error('❌ Please provide an email address')
    console.log('\nUsage: npm run make-admin <email>')
    console.log('Example: npm run make-admin admin@tigressai.com')
    process.exit(1)
}

makeAdmin(email)
