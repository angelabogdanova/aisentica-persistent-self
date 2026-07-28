# Deployment

## Account-owner actions

The software production path is automated. The account owner performs identity verification, accepts service terms, creates credentials and starts the deployment workflow.

## 1. Create CockroachDB Cloud

1. Create or open the CockroachDB Cloud account.
2. Create one Basic cluster.
3. Set conservative monthly resource limits.
4. Choose an AWS region close to the Lambda region where available.
5. Create a database named `persistent_self`.
6. Create an application SQL user.
7. Copy the TLS connection string for `persistent_self`.
8. Run `npm run migrate` with that connection string.
9. Confirm `memory_claim_embedding_idx` exists.

## 2. Create AWS

1. Create the AWS account using the owner’s legal details.
2. Enable MFA on the root user.
3. Create an AWS Budget alert before deployment.
4. Confirm access to Amazon Bedrock Nova 2 Lite and Titan Text Embeddings V2 in the selected region.
5. Deploy `infrastructure/github-oidc-role.yaml` once.
6. Copy the `DeployRoleArn` output.

Example one-time deployment from AWS CloudShell:

```bash
aws cloudformation deploy \
  --template-file infrastructure/github-oidc-role.yaml \
  --stack-name aisentica-persistent-self-github-oidc \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOwner=angelabogdanova \
    GitHubRepository=aisentica-persistent-self \
    GitHubBranch=main
```

## 3. Create GitHub repository

Create an empty public repository:

```text
angelabogdanova/aisentica-persistent-self
```

Do not initialize it with a README, license or `.gitignore` because all three already exist in this project package.

Upload or push the competition baseline. Preserve the initial local commit and tag `competition-start`.

## 4. Add GitHub secrets

Repository settings → Secrets and variables → Actions:

```text
AWS_DEPLOY_ROLE_ARN = output from the OIDC stack
COCKROACH_DATABASE_URL = TLS PostgreSQL connection string
```

## 5. Deploy

Open GitHub Actions → Deploy to AWS → Run workflow.

Select `hybrid` for the production deployment.

The workflow:

1. installs dependencies;
2. runs strict type checks, tests and bundle build;
3. validates and builds the SAM application;
4. assumes the AWS role through OIDC;
5. deploys the backend and hosting stack;
6. reads the API URL;
7. writes the frontend runtime configuration;
8. uploads the frontend to S3;
9. invalidates CloudFront.

## 6. Production CORS

The production workflow passes the exact CloudFront origin as `AllowedOrigin`:

```text
https://d31np75gupnbhy.cloudfront.net
```

Production validation confirms that the browser API authorizes this origin and withholds CORS authorization from unrelated origins.

For a new environment, deploy the stack once to obtain the `WebsiteUrl` output, set `AllowedOrigin` to that URL, and run the deployment workflow again. The competition production environment has already completed this hardening step.

## 7. Managed MCP production audit

The official CockroachDB Cloud Managed MCP Server was connected to the competition cluster and used for a strictly read-only production audit.

Audit path:

```text
AWS CloudShell → Codex CLI → CockroachDB Cloud Managed MCP
```

The auditor used SHOW-backed schema inspection, SELECT and EXPLAIN operations. It performed no insert, update, delete, alter or database-creation operations.

Result:

```text
16 passed
2 warnings
0 failed
```

Committed sanitized evidence:

```text
docs/evidence/managed-mcp-audit.json
```

To reproduce the audit:

1. create a CockroachDB Cloud API key restricted to the competition cluster;
2. connect the official Managed MCP endpoint;
3. run `mcp/memory-auditor-prompt.md` in strictly read-only mode;
4. sanitize the result before preserving it under `docs/evidence/`.

## 8. Production verification

Production validation is complete:

```text
18 passed
0 failed
0 pending
```

The committed verification package includes CockroachDB schema and vector evidence, factual EXPLAIN output, direct Amazon Nova 2 Lite and Titan Text Embeddings V2 runtime evidence, CORS verification, 180-day export retention, provenance-export verification and post-deployment smoke tests.

Evidence:

- `docs/evidence/production-validation.json`;
- `docs/evidence/bedrock-runtime-evidence.json`;
- `docs/evidence/cockroach-schema.txt`;
- `docs/evidence/managed-mcp-audit.json`;
- `docs/evidence/SHA256SUMS`.

Before recording the final video, run the judge path in `docs/judge-flow.md` from a clean browser profile or incognito window.

Capture the definitive visual set:

- CloudFront application and online status;
- one committed baseline claim and Canonical Version 2;
- one open conflict with the incoming candidate isolated from Current Canon;
- one Keep established resolution and Canonical Version 3;
- provenance timeline;
- encrypted S3 manifest export result;
- CockroachDB table, VECTOR and index evidence;
- Managed MCP audit result;
- final architecture image.

## 9. Cost guardrails

- keep API Gateway throttling active;
- use `hybrid` mode;
- use a single CockroachDB Basic cluster;
- set CockroachDB monthly RU and storage limits;
- set an AWS Budget alert;
- avoid EC2, ECS, EKS, provisioned model throughput and SageMaker endpoints;
- delete temporary CloudFormation stacks after judging concludes;
- retain the public demo through the announced judging period.
