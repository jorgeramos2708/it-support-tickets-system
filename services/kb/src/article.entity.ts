import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("articles")
export class ArticleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column()
  title!: string;

  @Column()
  practice!: string;

  @Column()
  summary!: string;

  @Column({ type: "jsonb" })
  sections!: Array<{ heading: string; body: string }>;

  @Column()
  views!: number;

  @Column()
  helpful!: number;

  @Column({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}

export interface ArticleDto {
  id: number;
  code: string;
  title: string;
  practice: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  views: number;
  helpful: number;
  updatedAt: string;
}

export function toDto(a: ArticleEntity): ArticleDto {
  return {
    id: a.id,
    code: a.code,
    title: a.title,
    practice: a.practice,
    summary: a.summary,
    sections: a.sections ?? [],
    views: a.views,
    helpful: a.helpful,
    updatedAt: a.updatedAt.toISOString(),
  };
}
