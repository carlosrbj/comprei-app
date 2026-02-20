import {
    Controller,
    Get,
    Query,
    Request,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { PlanGuard } from '../common/guards/plan.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';

@Controller('products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    /**
     * GET /products/search?q=arroz
     * Returns distinct product descriptions matching the query.
     */
    @Get('search')
    async search(@Request() req, @Query('q') q: string) {
        if (!q || q.trim().length < 2) return [];
        return this.productsService.searchProducts(req.user.id, q.trim());
    }

    /**
     * GET /products/price-history?name=arroz tiopinho&limit=30
     * Returns the recent price history for a product across stores.
     */
    @Get('price-history')
    @UseGuards(PlanGuard)
    @RequiresPlan('pro')
    async priceHistory(
        @Request() req,
        @Query('name') name: string,
        @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    ) {
        if (!name) return [];
        return this.productsService.getPriceHistory(req.user.id, name, limit);
    }

    /**
     * GET /products/compare?name=arroz tiopinho
     * Returns price comparison across stores for a given product.
     */
    @Get('compare')
    @UseGuards(PlanGuard)
    @RequiresPlan('pro')
    async compare(@Request() req, @Query('name') name: string) {
        if (!name) return null;
        return this.productsService.compareStores(req.user.id, name);
    }

    /**
     * GET /products/top-savings?limit=5
     * Returns top products where switching to the cheapest store saves the most.
     */
    @Get('top-savings')
    @UseGuards(PlanGuard)
    @RequiresPlan('pro')
    async topSavings(
        @Request() req,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ) {
        return this.productsService.getTopSavings(req.user.id, limit);
    }

    /**
     * GET /products/savings-summary
     * Returns total potential savings (used in dashboard widget).
     */
    @Get('savings-summary')
    @UseGuards(PlanGuard)
    @RequiresPlan('pro')
    async savingsSummary(@Request() req) {
        const total = await this.productsService.getTotalSavingsPotential(req.user.id);
        return { totalPotential: total };
    }
}
