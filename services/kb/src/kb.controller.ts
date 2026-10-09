import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtGuard } from "./jwt.guard";
import { ArticleEntity, toDto, type ArticleDto } from "./article.entity";

/** Salud del servicio — pública, para monitoreo del stack. */
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "kb" };
  }
}

@Controller()
@UseGuards(JwtGuard)
export class KbController {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articles: Repository<ArticleEntity>,
  ) {}

  @Get("articles")
  async list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<ArticleDto[]> {
    const take = Math.min(Number(limit ?? 100) || 100, 200);
    const skip = Math.max(Number(offset ?? 0) || 0, 0);
    const rows = await this.articles.find({ order: { views: "DESC" }, take, skip });
    return rows.map(toDto);
  }

  @Get("articles/:code")
  async byCode(@Param("code") code: string): Promise<ArticleDto> {
    const article = await this.articles.findOne({ where: { code } });
    if (!article) throw new NotFoundException("Artículo no encontrado");
    article.views += 1;
    await this.articles.save(article);
    return toDto(article);
  }

  @Patch("articles/:code")
  async markHelpful(
    @Param("code") code: string,
    @Body() body: { helpful?: boolean },
  ): Promise<ArticleDto> {
    const article = await this.articles.findOne({ where: { code } });
    if (!article) throw new NotFoundException("Artículo no encontrado");
    if (body.helpful) article.helpful += 1;
    await this.articles.save(article);
    return toDto(article);
  }
}
