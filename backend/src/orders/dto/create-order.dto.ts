import { IsArray, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsArray() items: Array<Record<string, unknown>>;
  @IsNumber() total: number;
}
