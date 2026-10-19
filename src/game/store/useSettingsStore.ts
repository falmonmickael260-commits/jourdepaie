import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  musicVolume: number;
  sfxVolume: number;
  setMusicEnabled: (v: boolean) => void;
  setSfxEnabled: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      musicEnabled: true,
      sfxEnabled: true,
      reducedMotion: false,
      highContrast: false,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      setMusicEnabled: (v) => set({ musicEnabled: v }),
      setSfxEnabled: (v) => set({ sfxEnabled: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
    }),
    {
      name: "ejdp-settings",
      partialize: (s) => ({
        musicEnabled: s.musicEnabled,
        sfxEnabled: s.sfxEnabled,
        reducedMotion: s.reducedMotion,
        highContrast: s.highContrast,
        musicVolume: s.musicVolume,
        sfxVolume: s.sfxVolume,
      }),
    }
  )
);
