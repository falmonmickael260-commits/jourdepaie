import { describe, expect, it } from "vitest";
import { isOfficialModeUnlocked, listUnverifiedRules, economyRules } from "./edition-2024";

describe("edition-2024 — traçabilité des règles", () => {
  it("débloque le mode officiel une fois les règles critiques confirmées contre la notice", () => {
    expect(isOfficialModeUnlocked()).toBe(true);
  });

  it("ne liste plus les règles critiques comme non confirmées", () => {
    const unverified = listUnverifiedRules();
    expect(unverified).not.toContain("startingCash");
    expect(unverified).not.toContain("salary");
    expect(unverified).not.toContain("monthsPerGame");
  });

  it("chaque règle confirmée porte une référence documentaire précise", () => {
    const confirmedRules = Object.values(economyRules).filter((r) => r.status === "confirmed");
    expect(confirmedRules.length).toBeGreaterThan(0);
    for (const r of confirmedRules) {
      expect(r.source?.reference).toBeTruthy();
    }
  });

  it("le capital de départ et le salaire sont confirmés à 1500€ (notice Hasbro officielle)", () => {
    expect(economyRules.startingCash.status).toBe("confirmed");
    expect(economyRules.startingCash.value).toBe(1500);
    expect(economyRules.salary.status).toBe("confirmed");
    expect(economyRules.salary.value).toBe(1500);
  });
});
