import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsBoolean()
  success: boolean;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
