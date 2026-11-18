import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-user';
import { StaffGuard } from '../auth/staff.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import type { OrderStatus } from '../generated/prisma/client';

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.orders.create(dto, req.user!.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.orders.findMine(user.sub);
  }

  @Get('staff')
  @UseGuards(JwtAuthGuard, StaffGuard)
  findAll() {
    return this.orders.findAll();
  }

  // Dành cho Staff cập nhật trạng thái đơn hàng (chuẩn dùng UpdateOrderStatusDto)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, StaffGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(id, dto.status);
  }

  // Dành riêng cho Khách hàng tự thao tác (Thanh toán lại -> PENDING hoặc Hủy -> CANCELLED)
  @Patch(':id/user-status')
  @UseGuards(JwtAuthGuard)
  async updateUserOrderStatus(
    @Param('id') id: string,
    @Body() dto: { status: OrderStatus },
    @CurrentUser() user: AuthUser,
  ) {
    // Dùng đúng `user.sub` và gọi qua `this.orders`
    return this.orders.updateStatusByUser(id, dto.status, user.sub);
  }
}