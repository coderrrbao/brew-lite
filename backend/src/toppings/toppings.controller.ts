import { Controller, Get } from "@nestjs/common";
import { ToppingsService } from "./toppings.service";

@Controller("toppings")
export class ToppingsController {
  constructor(private readonly toppings: ToppingsService) {}

  @Get()
  findAll() {
    return this.toppings.findAll();
  }
}
