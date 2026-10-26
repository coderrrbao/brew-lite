import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // TODO: protect with JwtAuthGuard and read userId from the token
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get('me')
  findMine() {
    return this.orders.findMine();
  }
}
