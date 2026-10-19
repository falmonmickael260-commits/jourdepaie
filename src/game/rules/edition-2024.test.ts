import { describe, expect, it } from "vitest";
import { isOfficialModeUnlocked, listUnverifiedRules, economyRules } from "./edition-2024";

describe("edition-2024 — traçabilité des règles", () => {
  it("ne débloque jamais le mode officiel tant que des règles critiques sont 'pending'", () => {
    expect(isOfficialModeUnlocked()).toBe(false);
  });

  it("liste les règles non confirmées", () => {
    const unverified = listUnverifiedRules();
    expect(unverified).toContain("startingCash");
    expect(unverified).toContain("salary");
    expect(unverified).not.toContain("monthsPerGame");
  });

  it("monthsPerGame est la seule règle économique actuellement confirmée", () => {
    expect(economyRules.monthsPerGame.status).toBe("confirmed");
    expect(economyRules.startingCash.status).toBe("pending");
  });
});
