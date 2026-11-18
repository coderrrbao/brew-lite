import { IsNotEmpty, IsString } from "class-validator";

export class RedeemPromotionDto {
  @IsString()
  @IsNotEmpty({ message: "Mã giảm giá không được để trống" })
  code: string;
}