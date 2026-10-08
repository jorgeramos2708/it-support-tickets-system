import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { JwtGuard } from "./jwt.guard";

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(
    @Body() body: { email?: string; password?: string },
  ): Promise<{ token: string; user: { email: string; name: string; role: string } }> {
    const { email, password } = body ?? {};
    if (!email || !password) {
      throw new UnauthorizedException("Credenciales no válidas");
    }
    return this.auth.login(email, password);
  }

  @Get("me")
  @UseGuards(JwtGuard)
  async me(@Req() req: Request) {
    const email = (req as unknown as { user?: { email?: string } }).user?.email;
    if (!email) throw new UnauthorizedException();
    return this.auth.me(email);
  }

  @Get("health")
  health() {
    return { status: "ok", service: "auth" };
  }
}
