import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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

  @Get("users")
  @UseGuards(JwtGuard)
  async listUsers() {
    return this.auth.listUsers();
  }

  @Post("users")
  @UseGuards(JwtGuard)
  async createUser(
    @Body() body: { email: string; name: string; role: string; password: string },
    @Req() req: Request,
  ) {
    const actorRole =
      (req as unknown as { user?: { role?: string } }).user?.role ?? "";
    if (actorRole !== "admin") {
      throw new UnauthorizedException("Solo un administrador puede crear usuarios");
    }
    return this.auth.createUser(body);
  }

  @Patch("users/:email")
  @UseGuards(JwtGuard)
  async updateUser(
    @Param("email") email: string,
    @Body() body: { name?: string; role?: string },
    @Req() req: Request,
  ) {
    const actorRole =
      (req as unknown as { user?: { role?: string } }).user?.role ?? "";
    if (actorRole !== "admin") {
      throw new UnauthorizedException("Solo un administrador puede editar usuarios");
    }
    return this.auth.updateUser(email, body);
  }

  @Put("users/:email/password")
  @UseGuards(JwtGuard)
  async changePassword(
    @Param("email") email: string,
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: Request,
  ) {
    const actorEmail =
      (req as unknown as { user?: { email?: string } }).user?.email ?? "";
    // Un usuario solo cambia su propia contraseña; un admin puede cambiar cualquiera
    if (actorEmail !== email) {
      const actorRole =
        (req as unknown as { user?: { role?: string } }).user?.role ?? "";
      if (actorRole !== "admin") {
        throw new UnauthorizedException("Solo puedes cambiar tu propia contraseña");
      }
    }
    return this.auth.changePassword(email, body.currentPassword, body.newPassword);
  }

  @Get("health")
  health() {
    return { status: "ok", service: "auth" };
  }
}
