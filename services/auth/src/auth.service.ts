import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { User, type PublicUser } from "./user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  private toPublic(user: User): PublicUser {
    return { email: user.email, name: user.name, role: user.role };
  }

  async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException("Credenciales no válidas");
    }
    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return { token, user: this.toPublic(user) };
  }

  async me(email: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }
}
