import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SizeOption } from "../generated/prisma/client";

@Injectable()
export class SizesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SizeOption[]> {
    return this.prisma.sizeOption.findMany({
      orderBy: { priceAdd: "asc" },
    });
  }

  async findOne(value: string): Promise<SizeOption> {
    const size = await this.prisma.sizeOption.findUnique({
      where: { value },
    });
    if (!size) {
      throw new NotFoundException(`Không tìm thấy size: ${value}`);
    }
    return size;
  }
}
