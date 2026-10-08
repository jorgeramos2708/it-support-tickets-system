import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  role!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;
}

export type PublicUser = Pick<User, "email" | "name" | "role">;
