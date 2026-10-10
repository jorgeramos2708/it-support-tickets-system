// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCountUp } from "./useCountUp";

describe("useCountUp (hallazgo C1 — KPIs vivos)", () => {
  it("reduced-motion: el valor aparece de inmediato", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    const { result } = renderHook(() => useCountUp(42, 600));
    expect(result.current).toBe(42);
    vi.unstubAllGlobals();
  });

  it("arranca en 0 y termina en el target con rAF", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }),
    );
    let now = 0;
    const frames: Array<() => void> = [];
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
      frames.push(() => cb((now += 100)));
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.stubGlobal("performance", { now: () => 0 });

    const { result } = renderHook(() => useCountUp(10, 600));
    expect(result.current).toBe(0); // primer frame aún no corre

    // Correr toda la animación
    act(() => {
      while (frames.length) frames.shift()!();
    });
    expect(result.current).toBe(10);
    vi.unstubAllGlobals();
  });

  it("C1: cambio de target anima DESDE el valor actual, nunca desde 0", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }),
    );
    let now = 0;
    const frames: Array<() => void> = [];
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
      frames.push(() => cb((now += 100)));
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.stubGlobal("performance", { now: () => 0 });

    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target, 600),
      { initialProps: { target: 4 } },
    );

    // Avanzar ~un tercio del recorrido (2 frames de 100ms / 600ms)
    act(() => {
      for (let i = 0; i < 2; i++) frames.shift()!();
    });
    const mid = result.current;
    expect(mid).toBeGreaterThanOrEqual(1);
    expect(mid).toBeLessThan(4);

    // Target cambia: el punto de partida es el valor actual, no 0
    rerender({ target: 5 });
    act(() => {
      frames.shift()!();
    });
    // Tras un frame del nuevo tramo, el valor sigue cerca del actual
    // (si re-arrancara desde 0, el primer frame daría ~0)
    expect(result.current).toBeGreaterThanOrEqual(mid);
    vi.unstubAllGlobals();
  });
});
