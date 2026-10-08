import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";
import { User } from "./user.entity";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "agente@tickitflow.dev",
    name: "Jorge Ramos",
    role: "agente",
    passwordHash: bcrypt.hashSync("demo1234", 4),
    ...overrides,
  } as User;
}

function makeService(user: User | null) {
  const repo = {
    findOne: async () => user,
    count: async () => 1,
  };
  const jwt = { signAsync: async () => "token-de-prueba" };
  return new AuthService(repo as never, jwt as never);
}

describe("AuthService", () => {
  it("emite token y usuario público con credenciales válidas", async () => {
    const service = makeService(makeUser());
    const result = await service.login("agente@tickitflow.dev", "demo1234");
    expect(result.token).toBe("token-de-prueba");
    expect(result.user).toEqual({
      email: "agente@tickitflow.dev",
      name: "Jorge Ramos",
      role: "agente",
    });
  });

  it("rechaza contraseña incorrecta", async () => {
    const service = makeService(makeUser());
    await expect(
      service.login("agente@tickitflow.dev", "otra-clave"),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("rechaza correo inexistente", async () => {
    const service = makeService(null);
    await expect(
      service.login("nadie@tickitflow.dev", "demo1234"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
