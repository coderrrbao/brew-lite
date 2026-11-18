import { Controller, Get } from "@nestjs/common";
import { SizesService } from "./sizes.service";

@Controller("sizes")
export class SizesController {
  constructor(private readonly sizes: SizesService) {}

  @Get()
  findAll() {
    return this.sizes.findAll();
  }
}
