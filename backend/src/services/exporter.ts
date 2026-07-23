import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ExportManifest } from "../domain.js";

export interface ExportResult {
  stored: boolean;
  key: string | null;
  bucket: string | null;
  manifest: ExportManifest;
}

export class ProvenanceExporter {
  private readonly client: S3Client;

  constructor(
    private readonly region: string,
    private readonly bucket?: string
  ) {
    this.client = new S3Client({ region });
  }

  async export(manifest: ExportManifest): Promise<ExportResult> {
    if (!this.bucket) {
      return { stored: false, key: null, bucket: null, manifest };
    }
    const key = `exports/${manifest.identity.id}/v${manifest.currentContext.version}-${Date.now()}.json`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(manifest, null, 2),
        ContentType: "application/json",
        ServerSideEncryption: "AES256",
        Metadata: {
          identity: manifest.identity.id,
          version: String(manifest.currentContext.version),
          schema: manifest.schemaVersion
        }
      })
    );
    return { stored: true, key, bucket: this.bucket, manifest };
  }
}
