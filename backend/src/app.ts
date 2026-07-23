import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { MemoryEngine } from "./services/memory-engine.js";
import type { ProvenanceExporter } from "./services/exporter.js";

export interface AppRequest {
  method: string;
  path: string;
  body?: unknown;
}

export interface AppResponse {
  statusCode: number;
  body: unknown;
}

function notFound(): AppResponse {
  return { statusCode: 404, body: { error: "Not found" } };
}

export class PersistentSelfApp {
  constructor(
    private readonly engine: MemoryEngine,
    private readonly exporter: ProvenanceExporter
  ) {}

  async handle(request: AppRequest): Promise<AppResponse> {
    try {
      const method = request.method.toUpperCase();
      const path = request.path.replace(/\/+$/, "") || "/";

      if (method === "GET" && path === "/health") {
        return { statusCode: 200, body: { status: "ok", ...(await this.engine.health()) } };
      }

      if (method === "POST" && path === "/identities") {
        const identity = await this.engine.createIdentity(request.body ?? {});
        return { statusCode: 201, body: { identity } };
      }

      const contextMatch = path.match(/^\/identities\/([0-9a-f-]+)\/context$/i);
      if (method === "GET" && contextMatch?.[1]) {
        return { statusCode: 200, body: await this.engine.restoreContext(contextMatch[1]) };
      }

      const conflictsMatch = path.match(/^\/identities\/([0-9a-f-]+)\/conflicts$/i);
      if (method === "GET" && conflictsMatch?.[1]) {
        return { statusCode: 200, body: { conflicts: await this.engine.getOpenConflicts(conflictsMatch[1]) } };
      }

      const timelineMatch = path.match(/^\/identities\/([0-9a-f-]+)\/timeline$/i);
      if (method === "GET" && timelineMatch?.[1]) {
        return { statusCode: 200, body: { events: await this.engine.getTimeline(timelineMatch[1]) } };
      }

      const claimMatch = path.match(/^\/identities\/([0-9a-f-]+)\/claims$/i);
      if (method === "POST" && claimMatch?.[1]) {
        const result = await this.engine.analyzeClaim(claimMatch[1], request.body ?? {});
        return { statusCode: result.outcome === "conflict" ? 202 : 201, body: result };
      }

      const exportMatch = path.match(/^\/identities\/([0-9a-f-]+)\/export$/i);
      if (method === "POST" && exportMatch?.[1]) {
        const manifest = await this.engine.buildExport(exportMatch[1]);
        return { statusCode: 201, body: await this.exporter.export(manifest) };
      }

      const conflictMatch = path.match(/^\/conflicts\/([0-9a-f-]+)$/i);
      if (method === "GET" && conflictMatch?.[1]) {
        const conflictCase = await this.engine.getConflictCase(conflictMatch[1]);
        return conflictCase
          ? { statusCode: 200, body: { conflictCase } }
          : notFound();
      }

      const resolveMatch = path.match(/^\/conflicts\/([0-9a-f-]+)\/resolve$/i);
      if (method === "POST" && resolveMatch?.[1]) {
        const conflictCase = await this.engine.resolveConflict(resolveMatch[1], request.body ?? {});
        return { statusCode: 200, body: { conflictCase } };
      }

      return notFound();
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          statusCode: 400,
          body: { error: "Validation failed", issues: error.issues }
        };
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message === "Identity not found" || message === "Conflict case not found") {
        return { statusCode: 404, body: { error: message } };
      }
      if (message.includes("already resolved")) {
        return { statusCode: 409, body: { error: message } };
      }
      console.error("Persistent Self request failed", error);
      return { statusCode: 500, body: { error: "Internal server error", requestId: randomUUID() } };
    }
  }
}
