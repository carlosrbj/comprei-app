import { Controller, Post, Body, UseGuards, Request, Get, Param, Delete } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AuthGuard } from '@nestjs/passport';
import { PreviewInvoiceDto } from './dto/preview-invoice.dto';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    // POST /invoices/scan — fluxo completo: QR code → parse → salvar automaticamente
    @Post('scan')
    scan(@Request() req: any, @Body() body: { qrCodeUrl: string }) {
        return this.invoicesService.processQrCode(req.user.id, body.qrCodeUrl);
    }

    @Post('preview')
    preview(@Body() previewInvoiceDto: PreviewInvoiceDto) {
        return this.invoicesService.preview(previewInvoiceDto.url);
    }

    @Post()
    create(@Request() req: any, @Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoicesService.create(createInvoiceDto, req.user.id);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.invoicesService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.invoicesService.findOne(id, req.user.id);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.invoicesService.remove(id, req.user.id);
    }
}
