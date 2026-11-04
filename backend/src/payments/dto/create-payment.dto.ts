import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsBoolean()
  success: boolean;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
