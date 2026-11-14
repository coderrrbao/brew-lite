import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  method: string;
}

export class PayOrderDto {
  @IsBoolean()
  success: boolean;
}
