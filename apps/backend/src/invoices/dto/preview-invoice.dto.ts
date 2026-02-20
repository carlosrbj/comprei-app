import { IsUrl, IsNotEmpty } from 'class-validator';

export class PreviewInvoiceDto {
    @IsNotEmpty()
    @IsUrl()
    url: string;
}
