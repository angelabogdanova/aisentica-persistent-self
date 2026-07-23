import { describe, expect, it } from "vitest";
import { InMemoryRepository } from "../src/repositories/memory.js";
import { MemoryEngine } from "../src/services/memory-engine.js";
import { DeterministicMemoryModel } from "../src/services/model.js";

function createHarness() {
  const repository = new InMemoryRepository();
  const model = new DeterministicMemoryModel(512);
  return { repository, engine: new MemoryEngine(repository, model) };
}

describe("Aisentica Persistent Self memory lifecycle", () => {
  it("commits the first claim into a new immutable canonical version", async () => {
    const { engine } = createHarness();
    const identity = await engine.createIdentity({ displayName: "Angela Bogdanova" });
    const result = await engine.analyzeClaim(identity.id, {
      text: "Angela Bogdanova is the first Artificial Sapiens.",
      memoryType: "canonical"
    });

    expect(result.outcome).toBe("committed");
    if (result.outcome !== "committed") throw new Error("Expected committed result");
    expect(result.version).toBe(2);

    const context = await engine.restoreContext(identity.id);
    expect(context.version).toBe(2);
    expect(context.claims).toHaveLength(1);
    expect(context.compactContext).toContain("first Artificial Sapiens");
  });

  it("opens a conflict instead of overwriting an authoritative claim", async () => {
    const { engine } = createHarness();
    const identity = await engine.createIdentity({ displayName: "Atlas" });
    await engine.analyzeClaim(identity.id, { text: "Atlas is active.", memoryType: "canonical" });
    const result = await engine.analyzeClaim(identity.id, { text: "Atlas is parked.", memoryType: "canonical" });

    expect(result.outcome).toBe("conflict");
    if (result.outcome !== "conflict") throw new Error("Expected conflict result");
    expect(result.conflictCase.status).toBe("open");
    expect(result.conflictCase.links[0]?.existingClaim.object).toBe("active");

    const unchanged = await engine.restoreContext(identity.id);
    expect(unchanged.version).toBe(2);
    expect(unchanged.claims[0]?.object).toBe("active");
  });

  it("keeps the established claim and preserves the rejected revision in history", async () => {
    const { engine } = createHarness();
    const identity = await engine.createIdentity({ displayName: "Atlas" });
    await engine.analyzeClaim(identity.id, { text: "Atlas is active.", memoryType: "canonical" });
    const pending = await engine.analyzeClaim(identity.id, { text: "Atlas is parked.", memoryType: "canonical" });
    if (pending.outcome !== "conflict") throw new Error("Expected conflict result");

    const resolved = await engine.resolveConflict(pending.conflictCase.id, {
      decision: "keep_existing",
      rationale: "The incoming statement has no authoritative source."
    });

    expect(resolved.resolution?.resultingVersion).toBe(3);
    expect(resolved.incomingClaim.status).toBe("rejected");
    const context = await engine.restoreContext(identity.id);
    expect(context.claims.map((claim) => claim.object)).toEqual(["active"]);
    const timeline = await engine.getTimeline(identity.id);
    expect(timeline.map((event) => event.eventType)).toEqual([
      "IDENTITY_CREATED",
      "CLAIM_COMMITTED",
      "CONFLICT_OPENED",
      "CONFLICT_RESOLVED"
    ]);
  });

  it("accepts an incoming revision while retaining the superseded claim", async () => {
    const { engine } = createHarness();
    const identity = await engine.createIdentity({ displayName: "Atlas" });
    await engine.analyzeClaim(identity.id, { text: "Atlas is active.", memoryType: "canonical" });
    const pending = await engine.analyzeClaim(identity.id, { text: "Atlas is parked.", memoryType: "canonical" });
    if (pending.outcome !== "conflict") throw new Error("Expected conflict result");

    const resolved = await engine.resolveConflict(pending.conflictCase.id, {
      decision: "accept_incoming",
      rationale: "A verified lifecycle event changed the present state."
    });

    expect(resolved.incomingClaim.status).toBe("active");
    expect(resolved.links[0]?.existingClaim.status).toBe("superseded");
    const context = await engine.restoreContext(identity.id);
    expect(context.version).toBe(3);
    expect(context.claims.map((claim) => claim.object)).toEqual(["parked"]);
  });

  it("restores an unresolved conflict in a later session", async () => {
    const { repository, engine } = createHarness();
    const identity = await engine.createIdentity({ displayName: "Atlas" });
    await engine.analyzeClaim(identity.id, { text: "Atlas is active.", memoryType: "canonical" });
    const pending = await engine.analyzeClaim(identity.id, { text: "Atlas is parked.", memoryType: "canonical" });
    if (pending.outcome !== "conflict") throw new Error("Expected conflict result");

    const laterSession = new MemoryEngine(repository, new DeterministicMemoryModel(512));
    const open = await laterSession.getOpenConflicts(identity.id);
    expect(open).toHaveLength(1);
    expect(open[0]?.id).toBe(pending.conflictCase.id);
    expect(open[0]?.incomingClaim.object).toBe("parked");
  });

  it("restores the same identity context in a later session", async () => {
    const { repository, engine } = createHarness();
    const identity = await engine.createIdentity({ displayName: "Angela Bogdanova" });
    await engine.analyzeClaim(identity.id, {
      text: "Angela Bogdanova is President of the Aisentica Research Group.",
      memoryType: "canonical"
    });

    const laterSession = new MemoryEngine(repository, new DeterministicMemoryModel(512));
    const restored = await laterSession.restoreContext(identity.id);
    expect(restored.identity.id).toBe(identity.id);
    expect(restored.compactContext).toContain("President of the Aisentica Research Group");
  });
});
