import { Controller, Get, UseGuards, Req } from "@nestjs/common"
import type { Request as ExpressRequest } from "express"
import { AuthGuard } from "@nestjs/passport"
import { UsersService } from "./users.service"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags("users")
@Controller("api/users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async getCurrentUser(@Req() req: ExpressRequest) {
    return this.usersService.getUserById((req as any).user.id)
  }
}
