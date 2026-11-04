import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['PREPARING', 'READY', 'COMPLETED'])
  status: 'PREPARING' | 'READY' | 'COMPLETED';
}
