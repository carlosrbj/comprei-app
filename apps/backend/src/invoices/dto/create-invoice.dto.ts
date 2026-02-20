import { IsUrl, IsNotEmpty, IsDateString, IsNumber, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CreateInvoiceItemDto {
    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsNotEmpty()
    @IsNumber()
    unitPrice: number;

    @IsNotEmpty()
    @IsNumber()
    totalPrice: number;
}

export class CreateInvoiceDto {
    @IsOptional()
    @IsString()
    url?: string;

    @IsNotEmpty()
    @IsString()
    accessKey: string;

    @IsOptional()
    @IsDateString()
    date?: Date;

    @IsNotEmpty()
    @IsNumber()
    totalValue: number;

    @IsNotEmpty()
    @IsString()
    establishmentName: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];
}
