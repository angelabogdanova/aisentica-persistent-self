import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { PersistentSelfApp } from "./app.js";
import { getConfig } from "./config.js";
import { CockroachMemoryRepository } from "./repositories/cockroach.js";
import { MemoryEngine } from "./services/memory-engine.js";
import { createMemoryModel } from "./services/model.js";
import { ProvenanceExporter } from "./services/exporter.js";

let app: PersistentSelfApp | undefined;

function getApp(): PersistentSelfApp {
  if (!app) {
    const config = getConfig();
    const repository = new CockroachMemoryRepository(config.DATABASE_URL);
    const model = createMemoryModel(config);
    const engine = new MemoryEngine(repository, model);
    const exporter = new ProvenanceExporter(config.AWS_REGION, config.EXPORT_BUCKET);
    app = new PersistentSelfApp(engine, exporter);
  }
  return app;
}

function parseBody(body: string | undefined, isBase64Encoded: boolean | undefined): unknown {
  if (!body) return undefined;
  const decoded = isBase64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;
  return JSON.parse(decoded);
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const config = getConfig();
  const origin = event.headers.origin ?? event.headers.Origin;
  const allowedOrigin = config.ALLOWED_ORIGIN === "*" || origin === config.ALLOWED_ORIGIN
    ? (origin ?? "*")
    : config.ALLOWED_ORIGIN;

  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "access-control-allow-origin": allowedOrigin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400"
      }
    };
  }

  let body: unknown;
  try {
    body = parseBody(event.body, event.isBase64Encoded);
  } catch {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json", "access-control-allow-origin": allowedOrigin },
      body: JSON.stringify({ error: "Request body must be valid JSON" })
    };
  }

  const result = await getApp().handle({
    method: event.requestContext.http.method,
    path: event.rawPath,
    body
  });

  return {
    statusCode: result.statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": allowedOrigin,
      "x-content-type-options": "nosniff"
    },
    body: JSON.stringify(result.body)
  };
};
