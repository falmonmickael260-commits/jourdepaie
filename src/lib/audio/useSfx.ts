"use client";

import { useCallback } from "react";
import { useSettingsStore } from "@/game/store/useSettingsStore";
import { playSfx, unlockAudio } from "./sfx-engine";

export function useSfx() {
  const sfxEnabled = useSettingsStore((s) => s.sfxEnabled);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);

  return useCallback(
    (name: Parameters<typeof playSfx>[0]) => {
      if (!sfxEnabled) return;
      unlockAudio();
      playSfx(name, sfxVolume);
    },
    [sfxEnabled, sfxVolume]
  );
}
