import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import type { Practice } from "./ticket.entity";

@Entity("daily_metrics")
@Unique("UQ_day_practice", ["day", "practice"])
export class DailyMetricEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Día en formato YYYY-MM-DD (zona UTC). */
  @Column({ type: "date" })
  day!: string;

  @Column()
  practice!: Practice;

  @Column()
  created!: number;

  @Column()
  resolved!: number;

  @Column({ name: "mttr_minutes", type: "integer" })
  mttrMinutes!: number;

  @Column({ name: "within_sla", type: "integer" })
  withinSla!: number;
}

export interface MetricDto {
  day: string;
  practice: Practice;
  created: number;
  resolved: number;
  mttrMinutes: number;
  withinSla: number;
}

export function metricToDto(m: DailyMetricEntity): MetricDto {
  return {
    day: typeof m.day === "string" ? m.day : String(m.day),
    practice: m.practice,
    created: m.created,
    resolved: m.resolved,
    mttrMinutes: m.mttrMinutes,
    withinSla: m.withinSla,
  };
}
