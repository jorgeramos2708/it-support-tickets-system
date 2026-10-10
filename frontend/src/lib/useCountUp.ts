import { useEffect, useRef, useState } from "react";

/**
 * Conteo animado hacia el target con ease-out cúbico.
 * Cambios de target animan DESDE el valor actual (nunca re-arranca en 0,
 * para que un KPI vivo no "parpadee" al recalcularse).
 * Respeta prefers-reduced-motion: el valor aparece de inmediato.
 */
export function useCountUp(target: number, ms = 600): number {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      valueRef.current = target;
      setValue(target);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || ms <= 0) {
      valueRef.current = target;
      setValue(target);
      return;
    }
    const from = valueRef.current;
    if (from === target) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (target - from) * eased);
      valueRef.current = next;
      setValue(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}
