# Initial Local Validation

Date: July 23, 2026

## Passed

- strict TypeScript static analysis across backend source and tests;
- JavaScript emission and syntax validation for every compiled source file;
- deterministic memory lifecycle smoke test;
- canonical Version 2 creation;
- conflict persistence without canonical overwrite;
- open-conflict restoration in a later session;
- accept-incoming resolution and canonical Version 3 creation;
- provenance event count verification;
- frontend HTML parse;
- frontend JavaScript syntax check;
- desktop layout render with no horizontal overflow;
- SAM, CloudFormation and GitHub Actions YAML parse;
- MCP configuration JSON parse.

## Smoke result

```json
{
  "beforeVersion": 2,
  "afterVersion": 3,
  "activeObject": "parked",
  "events": 4
}
```

## Environment note

The execution sandbox’s internal npm package registry returned HTTP 503 during dependency installation. Static analysis used the locally installed TypeScript compiler with temporary external-module declarations, and the dependency-free lifecycle smoke path executed successfully. The repository CI performs the authoritative `npm install` and `npm run check` once the project is published to GitHub.

The frontend preview is stored as `docs/evidence/frontend-preview.png`.
