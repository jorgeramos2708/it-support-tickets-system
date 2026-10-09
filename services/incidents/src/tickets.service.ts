import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  TicketEntity,
  type Practice,
  type Priority,
  type TicketStatus,
} from "./ticket.entity";
import { TicketEventEntity } from "./ticket.entity";
import { publishEvent } from "./bus";
import client from "prom-client";

const ticketsCreated = new client.Counter({
  name: "tickitflow_tickets_created_total",
  help: "Tickets registrados, por práctica",
  labelNames: ["practice"],
});

const ticketsUpdated = new client.Counter({
  name: "tickitflow_tickets_updated_total",
  help: "Actualizaciones de tickets, por estado resultante",
  labelNames: ["status"],
});

const ALLOWED: Record<TicketStatus, TicketStatus[]> = {
  nuevo: ["en_progreso"],
  en_progreso: ["pendiente_usuario", "resuelto"],
  pendiente_usuario: ["en_progreso", "resuelto"],
  resuelto: ["cerrado"],
  cerrado: [],
};

export interface EventInput {
  at: Date;
  kind: string;
  actor: string;
  detail?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface TicketDto {
  id: number;
  code: string;
  practice: Practice;
  subject: string;
  description: string;
  requester: string;
  dept: string;
  priority: string;
  status: TicketStatus;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  attachments: Array<{ name: string; sizeKb: number }>;
  events: Array<{
    id: string;
    at: string;
    kind: string;
    actor: string;
    detail: string | null;
    from: string | null;
    to: string | null;
  }>;
}

function toDto(
  ticket: TicketEntity,
  events: TicketEventEntity[],
): TicketDto {
  return {
    id: ticket.id,
    code: ticket.code,
    practice: ticket.practice,
    subject: ticket.subject,
    description: ticket.description,
    requester: ticket.requester,
    dept: ticket.dept,
    priority: ticket.priority,
    status: ticket.status,
    assignee: ticket.assignee,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
    attachments: ticket.attachments ?? [],
    events: [...events]
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map((ev) => ({
        id: `${ticket.code}-ev-${ev.id}`,
        at: ev.at.toISOString(),
        kind: ev.kind,
        actor: ev.actor,
        detail: ev.detail,
        from: ev.from,
        to: ev.to,
      })),
  };
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly tickets: Repository<TicketEntity>,
    @InjectRepository(TicketEventEntity)
    private readonly events: Repository<TicketEventEntity>,
  ) {}

  private async eventsOf(ticketId: number): Promise<TicketEventEntity[]> {
    return this.events.find({
      where: { ticketId },
      order: { at: "ASC" as const },
    });
  }

  async list(
    practice?: Practice,
    take = 100,
    skip = 0,
    requesterFilter?: string,
  ): Promise<TicketDto[]> {
    const where: Record<string, unknown> = {};
    if (practice) where.practice = practice;
    if (requesterFilter) where.requester = requesterFilter;
    const rows = await this.tickets.find({
      where,
      order: { createdAt: "DESC" },
      take,
      skip,
    });
    const all = await this.events.find();
    return rows.map((t) =>
      toDto(
        t,
        all.filter((e) => e.ticketId === t.id),
      ),
    );
  }

  async byCode(code: string): Promise<TicketDto> {
    const ticket = await this.tickets.findOne({ where: { code } });
    if (!ticket) throw new NotFoundException("Ticket no encontrado");
    return toDto(ticket, await this.eventsOf(ticket.id));
  }

  private async addEvent(ticketId: number, event: EventInput): Promise<void> {
    await this.events.save({ ticketId, ...event });
  }

  async create(
    dto: {
      practice: Practice;
      subject: string;
      description: string;
      requester: string;
      dept: string;
      priority: Priority;
      attachments?: Array<{ name: string; sizeKb: number }>;
    },
    actor: string,
    actorRole: string = "agente",
  ): Promise<TicketDto> {
    if (!dto.subject?.trim()) {
      throw new BadRequestException("El asunto es obligatorio");
    }
    const now = new Date();
    const prefix = dto.practice === "incidente" ? "INC" : "REQ";
    // Un usuario final siempre registra a su propio nombre; el solicitante
    // declarado en el cuerpo solo se respeta para operadores.
    const requester =
      actorRole === "usuario" ? actor : (dto.requester ?? actor);
    // El evento "creado" también respeta el token: un usuario final
    // nunca puede firmar con el nombre de otra persona.
    const createdEventActor = requester;
    const saved = await this.tickets.save(
      this.tickets.create({
        code: "PENDIENTE",
        practice: dto.practice,
        subject: dto.subject.trim(),
        description: dto.description ?? "",
        requester,
        dept: dto.dept ?? "Sin departamento",
        priority: dto.priority ?? "P3",
        status: "nuevo" as TicketStatus,
        assignee: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        attachments: dto.attachments ?? [],
      }),
    );
    saved.code = `${prefix}-${2400 + saved.id}`;
    await this.tickets.save(saved);

    await this.addEvent(saved.id, {
      at: now,
      kind: "creado",
      actor: createdEventActor,
      detail: `Registrado como ${prefix}.`,
    });
    if (saved.attachments && saved.attachments.length > 0) {
      await this.addEvent(saved.id, {
        at: now,
        kind: "adjunto",
        actor: createdEventActor,
        detail: saved.attachments.map((a) => a.name).join(", "),
      });
    }

    const result = toDto(saved, await this.eventsOf(saved.id));
    ticketsCreated.inc({ practice: result.practice });
    await publishEvent("ticket.created", {
      code: result.code,
      practice: result.practice,
      priority: result.priority,
      requester: result.requester,
      subject: result.subject,
      summary: `${result.code} registrado — ${result.subject}`,
    });
    return result;
  }

  async patch(
    code: string,
    dto: {
      status?: TicketStatus;
      assignee?: string;
      priority?: Priority;
      note?: string;
      actor?: string;
    },
    actorFromToken: string,
    roleFromToken: string = "agente",
  ): Promise<TicketDto> {
    const ticket = await this.tickets.findOne({ where: { code } });
    if (!ticket) throw new NotFoundException("Ticket no encontrado");
    // La firma de notas y eventos de un usuario final es siempre su token.
    const actor = roleFromToken === "usuario" ? actorFromToken : (dto.actor ?? actorFromToken);
    const now = new Date();

    // Separación de roles: un usuario final solo puede agregar notas a SUS tickets.
    if (roleFromToken === "usuario") {
      if (ticket.requester !== actorFromToken) {
        throw new ForbiddenException("Solo puedes escribir en tus tickets");
      }
      if (
        dto.status !== undefined ||
        dto.assignee !== undefined ||
        dto.priority !== undefined
      ) {
        throw new ForbiddenException(
          "Los estados, prioridades y asignaciones las gestiona el equipo de soporte",
        );
      }
    }

    if (dto.status) {
      if (!ALLOWED[ticket.status].includes(dto.status)) {
        throw new ForbiddenException(
          `Transición no permitida: ${ticket.status} → ${dto.status}`,
        );
      }
      await this.addEvent(ticket.id, {
        at: now,
        kind: "estado",
        actor,
        from: ticket.status,
        to: dto.status,
      });
      ticket.status = dto.status;
      if (dto.status === "resuelto") ticket.resolvedAt = now;
    }

    if (dto.assignee && !ticket.assignee) {
      await this.addEvent(ticket.id, {
        at: now,
        kind: "asignacion",
        actor: "Sistema",
        to: dto.assignee,
      });
      ticket.assignee = dto.assignee;
    }

    if (dto.priority && dto.priority !== ticket.priority) {
      await this.addEvent(ticket.id, {
        at: now,
        kind: "prioridad",
        actor,
        from: ticket.priority,
        to: dto.priority,
      });
      ticket.priority = dto.priority;
    }

    if (dto.note?.trim()) {
      await this.addEvent(ticket.id, {
        at: now,
        kind: "nota",
        actor,
        detail: dto.note.trim(),
      });
    }

    ticket.updatedAt = now;
    await this.tickets.save(ticket);

    const result = toDto(ticket, await this.eventsOf(ticket.id));
    ticketsUpdated.inc({ status: result.status });
    await publishEvent("ticket.updated", {
      code: result.code,
      status: result.status,
      assignee: result.assignee,
      requester: result.requester,
      subject: result.subject,
      actor,
      summary: `${result.code} — estado ${result.status}${result.assignee ? " · asignado a " + result.assignee : ""}`,
    });
    return result;
  }
}
