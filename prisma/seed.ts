import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.discount.create({
        data: {
            code: 'SAVE10',
            type: 'PERCENTAGE',
            value: 10.00,
            minValue: 50.00,
            maxUses: 100,
            usedCount: 0,
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31'),
            active: true
        }
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
