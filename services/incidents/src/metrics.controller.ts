import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtGuard } from "./jwt.guard";
import { MetricsService } from "./metrics.service";
import type { MetricDto } from "./daily-metric.entity";

@Controller("metrics")
@UseGuards(JwtGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get("daily")
  async daily(@Query("days") days?: string): Promise<MetricDto[]> {
    return this.metrics.daily(Math.min(Number(days ?? 30) || 30, 90));
  }
}
