// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { AuthProvider } from "./auth";
import { ModeProvider } from "./mode";
import { StoreProvider, useStore, type CreateTicketInput } from "./store";

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return {
    ...actual,
    api: {
      ...actual.api,
      health: vi.fn(),
      listTickets: vi.fn(),
      createTicket: vi.fn(),
      patchTicket: vi.fn(),
      listProblems: vi.fn(),
      listChanges: vi.fn(),
      listCis: vi.fn(),
      listArticles: vi.fn(),
      listNotifications: vi.fn(),
      listMetrics: vi.fn(),
      patchProblem: vi.fn(),
      patchChange: vi.fn(),
      patchArticle: vi.fn(),
      createProblem: vi.fn(),
      createChange: vi.fn(),
    },
  };
});

vi.mock("./data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./data")>();
  return { ...actual, ME: "Jorge Ramos" };
});

const input: CreateTicketInput = {
  practice: "incidente",
  subject: "Prueba del store",
  description: "d",
  requester: "M. Aguilar",
  dept: "Finanzas",
  priority: "P3",
  attachments: [],
};

/** Sonda: expone el store a un callback externo en cada render. */
function Probe({ onStore }: { onStore: (s: ReturnType<typeof useStore>) => void }) {
  const store = useStore();
  useEffect(() => {
    onStore(store);
  });
  return null;
}

let latest: ReturnType<typeof useStore> | null = null;
const grab = (s: ReturnType<typeof useStore>) => {
  latest = s;
};

async function flush(ms = 150) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe("Store dual — modo demo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.health).mockRejectedValue(new Error("sin backend"));
    localStorage.clear();
    (api.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("createTicket genera código consecutivo localmente y agrega al estado", async () => {
    const { unmount } = render(
      <ModeProvider>
        <AuthProvider>
          <StoreProvider>
            <Probe onStore={grab} />
          </StoreProvider>
        </AuthProvider>
      </ModeProvider>,
    );
    await flush(200);
    const before = latest!.tickets.length;
    let created = null as Awaited<ReturnType<ReturnType<typeof useStore>["createTicket"]>> | null;
    await act(async () => {
      created = await latest!.createTicket(input);
    });
    expect(created!.id).toMatch(/^INC-\d+$/);
    expect(latest!.tickets.length).toBe(before + 1);
    expect(api.createTicket).not.toHaveBeenCalled();
    unmount();
  });
});

describe("Store dual — modo live", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.health).mockResolvedValue({ status: "ok" });
    localStorage.setItem(
      "tickitflow.user",
      JSON.stringify({ name: "Jorge Ramos", email: "agente@tickitflow.dev", role: "agente" }),
    );
    localStorage.setItem("tickitflow.token", "tok");
  });

  it("createTicket delega al servidor y antepone el ticket convertido", async () => {
    const nowIso = new Date().toISOString();
    (api.createTicket as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 99,
      code: "INC-2409",
      practice: "incidente",
      subject: input.subject,
      description: "d",
      requester: "M. Aguilar",
      dept: "Finanzas",
      priority: "P3",
      status: "nuevo",
      assignee: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      resolvedAt: null,
      attachments: [],
      events: [
        {
          id: "INC-2409-ev-0",
          at: nowIso,
          kind: "creado",
          actor: "M. Aguilar",
          detail: "Registrado como INC.",
          from: null,
          to: null,
        },
      ],
    });
    const { unmount } = render(
      <ModeProvider>
        <AuthProvider>
          <StoreProvider>
            <Probe onStore={grab} />
          </StoreProvider>
        </AuthProvider>
      </ModeProvider>,
    );
    await flush(250);
    let created = null as Awaited<ReturnType<ReturnType<typeof useStore>["createTicket"]>> | null;
    await act(async () => {
      created = await latest!.createTicket(input);
    });
    expect(api.createTicket).toHaveBeenCalledWith("tok", input);
    expect(created!.id).toBe("INC-2409");
    expect(latest!.tickets[0].id).toBe("INC-2409");
    unmount();
  });

  it("una mutación rechazada dispara rehidratación desde el servidor", async () => {
    (api.patchTicket as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("conflict"),
    );
    (api.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const { unmount } = render(
      <ModeProvider>
        <AuthProvider>
          <StoreProvider>
            <Probe onStore={grab} />
          </StoreProvider>
        </AuthProvider>
      </ModeProvider>,
    );
    await flush(250);
    const listCallsBefore = (api.listTickets as ReturnType<typeof vi.fn>).mock.calls.length;
    act(() => {
      latest!.transition("INC-2401", "en_progreso");
    });
    await flush(300);
    expect(api.patchTicket).toHaveBeenCalled();
    expect((api.listTickets as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      listCallsBefore,
    );
    unmount();
  });
});
