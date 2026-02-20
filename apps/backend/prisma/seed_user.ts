import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
        console.log(`Creating user: ${email}`);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Test User',
            },
        });
        console.log('User created successfully.');
    } else {
        console.log('User already exists.');
        // Update password just in case
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('Password updated just in case.');

        const u = await prisma.user.findUnique({ where: { email } });
        console.log('User details:', JSON.stringify(u, null, 2));

    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
