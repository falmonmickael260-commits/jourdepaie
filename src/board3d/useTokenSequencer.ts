import { useEffect, useRef, useState } from "react";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fait avancer un pion case par case entre sa position affichée et sa
 * position logique, au lieu de le téléporter : identique en esprit à
 * `AnimatedPlayerMarker` (version 2D), mais expose un index de case plutôt
 * qu'un style DOM — c'est le pion 3D (`Tokens.tsx`) qui anime le bond entre
 * deux cases consécutives.
 */
export function useTokenSequencer(
  logicalPosition: number,
  boardLength: number,
  callbacks: { onStep?: (tileIndex: number) => void; onArrived?: () => void },
): number {
  const [displayTile, setDisplayTile] = useState(logicalPosition);
  const prevRef = useRef(logicalPosition);
  const cbRef = useRef(callbacks);
  useEffect(() => {
    cbRef.current = callbacks;
  });

  useEffect(() => {
    const from = prevRef.current;
    const to = logicalPosition;
    prevRef.current = to;
    if (from === to || boardLength <= 0) {
      setDisplayTile(to);
      return;
    }

    let cancelled = false;
    let settled = false;

    const wraps = to < from;
    const forward: number[] = [from];
    {
      let i = from;
      const end = wraps ? boardLength - 1 : to;
      while (i !== end) {
        i++;
        forward.push(i);
      }
    }
    const rest: number[] = wraps ? [0] : [];
    if (wraps) {
      let j = 0;
      while (j !== to) {
        j++;
        rest.push(j);
      }
    }

    const finish = () => {
      if (settled) return;
      settled = true;
      cbRef.current.onArrived?.();
    };

    const expectedMs = (forward.length + rest.length) * 260 + (wraps ? 400 : 0) + 800;
    const safetyTimer = setTimeout(() => {
      setDisplayTile(to);
      finish();
    }, expectedMs);

    async function run() {
      for (let k = 1; k < forward.length; k++) {
        await delay(260);
        if (cancelled) return;
        setDisplayTile(forward[k]);
        cbRef.current.onStep?.(forward[k]);
      }
      if (wraps) {
        await delay(180);
        if (cancelled) return;
        setDisplayTile(0);
        for (let k = 1; k < rest.length; k++) {
          await delay(260);
          if (cancelled) return;
          setDisplayTile(rest[k]);
          cbRef.current.onStep?.(rest[k]);
        }
      }
      if (!cancelled) {
        clearTimeout(safetyTimer);
        finish();
      }
    }

    run();
    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
     
  }, [logicalPosition, boardLength]);

  return displayTile;
}
