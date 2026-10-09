import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
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
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
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

  async listUsers(): Promise<PublicUser[]> {
    const rows = await this.users.find({ order: { id: "ASC" } });
    return rows.map((u) => this.toPublic(u));
  }

  async createUser(dto: {
    email: string;
    name: string;
    role: string;
    password: string;
  }): Promise<PublicUser> {
    if (!dto.email?.trim() || !dto.password?.trim() || !dto.name?.trim()) {
      throw new BadRequestException("Email, nombre y contraseña son obligatorios");
    }
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Ya existe un usuario con el correo ${dto.email}`);
    }
    const validRoles = ["agente", "usuario", "admin"];
    if (!validRoles.includes(dto.role)) {
      throw new BadRequestException(`Rol inválido: usa uno de ${validRoles.join(", ")}`);
    }
    const user = await this.users.save(
      this.users.create({
        email: dto.email.trim(),
        name: dto.name.trim(),
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, 12),
      }),
    );
    return this.toPublic(user);
  }

  async updateUser(
    email: string,
    dto: { name?: string; role?: string },
  ): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new NotFoundException(`Usuario ${email} no encontrado`);
    if (dto.name?.trim()) user.name = dto.name.trim();
    if (dto.role) {
      const validRoles = ["agente", "usuario", "admin"];
      if (!validRoles.includes(dto.role)) {
        throw new BadRequestException(`Rol inválido: usa uno de ${validRoles.join(", ")}`);
      }
      user.role = dto.role;
    }
    await this.users.save(user);
    return this.toPublic(user);
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: boolean }> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new NotFoundException(`Usuario ${email} no encontrado`);
    if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException("La contraseña actual no es correcta");
    }
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException("La nueva contraseña debe tener al menos 8 caracteres");
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.save(user);
    return { ok: true };
  }
}
