import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Topping } from "../generated/prisma/client";

@Injectable()
export class ToppingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Topping[]> {
    return this.prisma.topping.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });
  }

  async findByIds(ids: string[]): Promise<Topping[]> {
    if (!ids || ids.length === 0) return [];

    const uniqueIds = Array.from(new Set(ids));
    const toppings = await this.prisma.topping.findMany({
      where: {
        id: { in: uniqueIds },
        active: true,
      },
    });

    if (toppings.length !== uniqueIds.length) {
      throw new BadRequestException("Một hoặc nhiều topping không hợp lệ hoặc đã ngừng bán");
    }

    return toppings;
  }
}
