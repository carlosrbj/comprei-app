import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.category.findUnique({
            where: { id },
            include: {
                products: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    /**
     * Categorize a product based on its description using keyword matching.
     * Returns the categoryId if a match is found, null otherwise.
     */
    async categorizeProduct(productDescription: string): Promise<string | null> {
        if (!productDescription) return null;

        const categories = await this.prisma.category.findMany();
        const normalized = productDescription
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        let bestMatch: { categoryId: string; matchCount: number } | null = null;

        for (const cat of categories) {
            let matchCount = 0;

            for (const keyword of cat.keywords) {
                const normalizedKeyword = keyword
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');

                if (normalized.includes(normalizedKeyword)) {
                    matchCount++;
                }
            }

            if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
                bestMatch = { categoryId: cat.id, matchCount };
            }
        }

        return bestMatch?.categoryId ?? null;
    }
}
