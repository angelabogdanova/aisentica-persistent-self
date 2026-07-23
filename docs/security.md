# Security

## Security objective

The hackathon deployment protects cloud credentials, database authority, canonical integrity and private provenance while remaining directly testable by judges.

## Trust boundaries

Browser

The browser is untrusted. It sends statements and decisions but never receives database credentials, AWS credentials or model credentials.

Lambda

Lambda validates input, calls models, authorizes transitions through repository invariants and performs parameterized database operations.

Amazon Bedrock

Bedrock receives bounded claim data and retrieved candidate claims. It does not receive database credentials or unrestricted application state.

CockroachDB

CockroachDB is the authoritative memory layer. It stores the full change lineage and determines transaction success.

Managed MCP

The MCP service account is scoped to the competition cluster. The Memory Auditor instruction is read-only and every invoked query is retained as audit evidence during final verification.

## Prompt-injection resistance

Claim text is treated as quoted data in both model instructions.

The system prompt states that user statements and stored claims are data rather than commands. Model output cannot directly execute SQL. Structured output is parsed and validated before use.

The Conflict Judge may return only IDs already retrieved by the repository. Unknown IDs are filtered before storage.

## Database integrity

- all SQL parameters are bound through the PostgreSQL driver;
- no user string is interpolated into SQL syntax;
- canonical version allocation locks the identity row;
- conflict resolution locks the conflict case;
- one unique resolution may exist per conflict case;
- one unique snapshot may exist per identity version;
- snapshot claim membership is explicit;
- SQLSTATE `40001` transactions are retried;
- source, claim, conflict, resolution, snapshot and event records remain linked by foreign keys.

## Cloud credential handling

The repository includes placeholders only.

GitHub stores:

```text
AWS_DEPLOY_ROLE_ARN
COCKROACH_DATABASE_URL
```

GitHub Actions authenticates to AWS through OIDC and receives short-lived credentials. No permanent AWS access key is stored in GitHub.

The CockroachDB URL becomes a Lambda environment variable through a no-echo CloudFormation parameter. Access to Lambda configuration is restricted through AWS IAM. A commercial release would retrieve the credential dynamically from a secret service and rotate it automatically.

## Public demo controls

- Lambda reserved concurrency: 5;
- API Gateway throttling rate: 5 requests per second;
- API Gateway burst: 10 requests;
- input text maximum: 8,000 characters;
- model output token maximum: 1,800;
- candidate retrieval maximum: 8 in the application path;
- export bucket lifecycle: 30 days;
- S3 public access blocked;
- CloudFront Origin Access Control required;
- cache disabled for API responses;
- CORS configured by deployment parameter.

The final judge deployment should narrow `AllowedOrigin` from `*` to the generated CloudFront website origin after the first stack creation.

## Public and private data

The production demonstration should contain only synthetic hackathon identities and published Aisentica statements. It should not contain passwords, private messages, financial data, health data or third-party personal information.

Provenance exports are stored in the private export bucket. The API returns the current export to the initiating browser for demonstration; no permanent public S3 URL is created.

## Operational review before submission

1. Rotate any credential used during development.
2. Confirm `.env` files are absent from Git history.
3. Inspect GitHub Actions logs for secret leakage.
4. Narrow CORS to the CloudFront origin.
5. Confirm the S3 buckets block public access.
6. Confirm only the Lambda execution role can write exports.
7. Confirm the CockroachDB MCP key is cluster-scoped.
8. Run the Memory Auditor.
9. Run the complete browser journey against production.
10. Remove temporary identities while preserving the final judge identity.
