import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
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
  promotionCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
