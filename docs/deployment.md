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

Select `hybrid` for the initial deployment.

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

## 6. Narrow CORS

Read the `WebsiteUrl` stack output. Re-run deployment with `AllowedOrigin` set to that URL in the workflow or deploy command.

The competition baseline defaults to `*` only because the CloudFront URL does not exist before the first stack deployment.

## 7. Configure Managed MCP

1. Create a CockroachDB Cloud API key restricted to the competition cluster.
2. Connect the official Managed MCP endpoint.
3. Run `mcp/memory-auditor-prompt.md`.
4. Save the resulting audit JSON under `docs/evidence/` before submission.

## 8. Production verification

Run the judge path in `docs/judge-flow.md` from a clean browser profile.

Capture:

- CloudFront URL;
- API health output;
- CockroachDB table and vector-index evidence;
- one committed claim;
- one open conflict;
- one resolution;
- canonical version increment;
- provenance timeline;
- S3 export result;
- MCP audit.

## 9. Cost guardrails

- keep Lambda reserved concurrency at 5;
- keep API Gateway throttling active;
- use `hybrid` mode;
- use a single CockroachDB Basic cluster;
- set CockroachDB monthly RU and storage limits;
- set an AWS Budget alert;
- avoid EC2, ECS, EKS, provisioned model throughput and SageMaker endpoints;
- delete temporary CloudFormation stacks after judging concludes;
- retain the public demo through the announced judging period.
