import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsArray()
  @IsString({ each: true })
  toppings: string[];

  @IsInt()
  @Min(1)
  qty: number;

  @IsInt()
  @Min(0)
  unitPrice: number;

  @IsInt()
  @Min(0)
  lineTotal: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  subTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  promotionId?: string | null;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}
