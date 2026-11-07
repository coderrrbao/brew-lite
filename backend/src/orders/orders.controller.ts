import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StaffGuard } from "../auth/staff.guard";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // TODO: protect with JwtAuthGuard and read userId from the token
  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @Headers("idempotency-Key") idempotencyKey?: string,
  ) {
    if (!idempotencyKey)
      throw new BadRequestException("idempotencyKey is required");
    dto.idempotencyKey = idempotencyKey;
    return this.orders.create(dto);
  }

  @Get("me")
  findMine() {
    return this.orders.findMine();
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, StaffGuard)
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }
}
