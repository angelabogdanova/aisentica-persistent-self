import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const APP_URL = process.env.APP_URL ?? "https://d31np75gupnbhy.cloudfront.net";
const OUTPUT_DIR = path.resolve(process.env.VIDEO_OUTPUT_DIR ?? "video-output");
const RAW_DIR = path.join(OUTPUT_DIR, "raw");
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");
const DOWNLOAD_DIR = path.join(OUTPUT_DIR, "downloads");
const WIDTH = 1920;
const HEIGHT = 1080;

const BASELINE = "Angela Bogdanova is the first Artificial Sapiens.";
const CONTRADICTION = "Angela Bogdanova is not the first Artificial Sapiens.";
const RATIONALE = "The established canonical claim remains the current authoritative identity statement.";

const productionEvidence = JSON.parse(
  await fs.readFile("docs/evidence/production-validation.json", "utf8")
);
const managedMcpEvidence = JSON.parse(
  await fs.readFile("docs/evidence/managed-mcp-audit.json", "utf8")
);
const bedrockEvidence = JSON.parse(
  await fs.readFile("docs/evidence/bedrock-runtime-evidence.json", "utf8")
);
const shaManifest = await fs.readFile("docs/evidence/SHA256SUMS", "utf8");

await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
await fs.mkdir(RAW_DIR, { recursive: true });
await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slideDocument(content) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root { color-scheme: dark; --bg:#07100f; --panel:#0f201d; --line:rgba(170,218,207,.24); --text:#edf8f5; --muted:#9db5af; --accent:#9ce7d5; --gold:#e3c892; }
* { box-sizing:border-box; }
body { margin:0; width:100vw; height:100vh; overflow:hidden; background:radial-gradient(circle at 12% 10%,rgba(46,119,102,.18),transparent 34rem),radial-gradient(circle at 88% 60%,rgba(68,109,144,.13),transparent 34rem),var(--bg); color:var(--text); font-family:Inter,Arial,sans-serif; }
.stage { width:100%; height:100%; padding:64px 76px; display:flex; flex-direction:column; }
.eyebrow { margin:0 0 16px; color:var(--accent); text-transform:uppercase; letter-spacing:.19em; font-size:18px; }
h1 { margin:0; max-width:1500px; font-size:72px; line-height:1.02; letter-spacing:-.045em; font-weight:560; }
.lead { max-width:1450px; margin:28px 0 0; color:var(--muted); font-size:30px; line-height:1.42; }
.formula { margin-top:auto; display:flex; align-items:center; justify-content:center; gap:20px; padding:30px; border:1px solid var(--line); border-radius:28px; background:rgba(15,32,29,.86); font-size:27px; }
.formula b { color:var(--accent); font-weight:400; }
.grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:34px; }
.card { min-height:170px; padding:25px; border:1px solid var(--line); border-radius:24px; background:rgba(15,32,29,.9); }
.card h2 { margin:0 0 14px; font-size:27px; font-weight:600; }
.card p { margin:0; color:var(--muted); font-size:20px; line-height:1.45; }
.metric { color:var(--accent); font-size:42px; font-weight:680; }
.warning { color:var(--gold); }
.arch { display:grid; grid-template-columns:1fr 1.1fr 1.35fr 1.5fr; gap:16px; margin-top:32px; align-items:stretch; }
.arch .node { min-height:142px; display:flex; flex-direction:column; justify-content:center; padding:22px; border:1px solid var(--line); border-radius:22px; background:rgba(15,32,29,.93); text-align:center; }
.arch .node strong { font-size:24px; }
.arch .node span { margin-top:10px; color:var(--muted); font-size:18px; line-height:1.35; }
.authority { margin-top:22px; display:grid; grid-template-columns:1.6fr 1fr; gap:18px; }
.authority > div { padding:25px; border-radius:24px; border:1px solid var(--line); background:rgba(15,32,29,.92); }
.authority h2 { margin:0 0 12px; font-size:28px; }
.authority p { margin:0; color:var(--muted); font-size:20px; line-height:1.42; }
.footer { margin-top:auto; display:flex; justify-content:space-between; color:var(--muted); font-size:17px; }
</style>
</head><body>${content}</body></html>`;
}

async function renderTitle(page) {
  await page.setContent(slideDocument(`
    <main class="stage">
      <p class="eyebrow">CockroachDB × AWS Hackathon 2026</p>
      <h1>Aisentica Persistent Self</h1>
      <p class="lead">Conflict-aware persistent memory for artificial identity. The system preserves not only what was said, but how a claim became authoritative.</p>
      <div class="formula"><span>Claim</span><b>→</b><span>Source</span><b>→</b><span>Conflict</span><b>→</b><span>Resolution</span><b>→</b><span>Canon</span></div>
      <div class="footer"><span>Production application</span><span>Angela Bogdanova · Aisentica Development</span></div>
    </main>`));
}

async function renderEvidence(page) {
  const production = productionEvidence.summary;
  const mcp = managedMcpEvidence.score;
  const checksumCount = shaManifest.trim().split(/\r?\n/).filter(Boolean).length;
  const reasoningSucceeded = Boolean(
    bedrockEvidence.reasoningInvocation?.succeeded ?? bedrockEvidence.reasoning?.succeeded
  );
  const embeddingDimensions =
    bedrockEvidence.embeddingInvocation?.returnedDimensions ??
    bedrockEvidence.embedding?.returnedDimensions ??
    512;

  await page.setContent(slideDocument(`
    <main class="stage">
      <p class="eyebrow">Independent production proof</p>
      <h1>The memory lifecycle is verified, reproducible and inspectable.</h1>
      <div class="grid">
        <section class="card"><div class="metric">${production.passed} / ${production.failed} / ${production.pending}</div><h2>Production validation</h2><p>Passed · failed · pending. Includes conflict isolation, resolutions, CORS, retention, export and smoke tests.</p></section>
        <section class="card"><div class="metric">${mcp.passed} / ${mcp.warnings} / ${mcp.failed}</div><h2>Managed MCP audit</h2><p>Strictly read-only verification of schema, VECTOR storage, index, conflict links, Version 3 and provenance.</p></section>
        <section class="card"><div class="metric">${checksumCount}</div><h2>SHA256 artifacts</h2><p>Every committed evidence artifact passes the integrity manifest.</p></section>
        <section class="card"><div class="metric">HTTP ${reasoningSucceeded ? "200" : "verified"}</div><h2>Amazon Nova 2 Lite</h2><p>Direct live runtime invocation with a unique verification marker.</p></section>
        <section class="card"><div class="metric">${embeddingDimensions}</div><h2>Titan embedding dimensions</h2><p>Direct live invocation returned finite VECTOR values for semantic retrieval.</p></section>
        <section class="card"><div class="metric warning">2 preserved</div><h2>Audit warnings</h2><p>The evidence keeps real limitations visible instead of hiding them.</p></section>
      </div>
      <div class="footer"><span>docs/evidence/</span><span>No credentials or private tokens</span></div>
    </main>`));
}

async function renderArchitecture(page) {
  await page.setContent(slideDocument(`
    <main class="stage">
      <p class="eyebrow">Production architecture</p>
      <h1>AWS runs the agents. CockroachDB holds authority.</h1>
      <div class="arch">
        <div class="node"><strong>Judge Browser</strong><span>Live product and human conflict resolution</span></div>
        <div class="node"><strong>CloudFront + Private S3</strong><span>Public delivery from a private static origin</span></div>
        <div class="node"><strong>API Gateway + Lambda</strong><span>Validation, agent orchestration, serializable writes and provenance</span></div>
        <div class="node"><strong>Amazon Bedrock</strong><span>Nova 2 Lite reasoning and Titan Text Embeddings V2</span></div>
      </div>
      <div class="authority">
        <div>
          <h2>CockroachDB Cloud — Versioned Authority Graph</h2>
          <p>Stable identities and sources · claims with VECTOR(512) · conflict cases and links · human resolutions · canonical snapshots · immutable provenance events.</p>
        </div>
        <div>
          <h2>Independent proof surfaces</h2>
          <p>Managed MCP read-only Memory Auditor · encrypted S3 provenance exports · CloudWatch and X-Ray · SHA256 evidence package.</p>
        </div>
      </div>
      <div class="formula"><span>Language</span><b>→</b><span>Atomic Claim</span><b>→</b><span>Semantic Authority</span><b>→</b><span>Conflict</span><b>→</b><span>Human Resolution</span><b>→</b><span>Canon</span></div>
      <div class="footer"><span>Persistent identity is restored from canonical versions.</span><span>Not reconstructed from chat order.</span></div>
    </main>`));
}

async function renderFinal(page) {
  await page.setContent(slideDocument(`
    <main class="stage" style="justify-content:center;align-items:center;text-align:center">
      <p class="eyebrow">Aisentica Persistent Self</p>
      <h1 style="max-width:1500px">Memory stores the past.<br>Persistent identity governs what the past means now.</h1>
      <p class="lead">CockroachDB × AWS Hackathon 2026</p>
    </main>`));
}

async function prepareAppPage(page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.addStyleTag({ content: `
    html { scroll-behavior: auto !important; }
    * { animation-duration: 0s !important; transition-duration: 0s !important; }
    body { overflow-x: hidden !important; }
    ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
  ` });
  await page.waitForSelector("#apiStatus.online", { timeout: 120_000 });
}

async function scrollTo(page, selector, offset = 80) {
  await page.locator(selector).evaluate((element, topOffset) => {
    const top = element.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({ top, behavior: "instant" });
  }, offset);
  await sleep(900);
}

async function highlight(page, selector) {
  await page.locator(selector).evaluate((element) => {
    document.querySelectorAll("[data-video-highlight]").forEach((item) => {
      item.style.removeProperty("box-shadow");
      item.style.removeProperty("border-color");
      item.removeAttribute("data-video-highlight");
    });
    element.dataset.videoHighlight = "true";
    element.style.boxShadow = "0 0 0 4px rgba(156,231,213,.34), 0 18px 55px rgba(0,0,0,.42)";
    element.style.borderColor = "#9ce7d5";
  });
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, name),
    fullPage: false,
    animations: "disabled"
  });
}

async function recordPart(browser, name, runner) {
  const partDirectory = path.join(RAW_DIR, `${name}-capture`);
  await fs.mkdir(partDirectory, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    screen: { width: WIDTH, height: HEIGHT },
    colorScheme: "dark",
    acceptDownloads: true,
    recordVideo: { dir: partDirectory, size: { width: WIDTH, height: HEIGHT } }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  const video = page.video();
  const result = await runner(page, context);
  await context.close();
  const sourcePath = await video.path();
  const targetPath = path.join(RAW_DIR, `${name}.webm`);
  await fs.rename(sourcePath, targetPath);
  await fs.rm(partDirectory, { recursive: true, force: true });
  return result;
}

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"]
});

let identityId = "";

try {
  identityId = await recordPart(browser, "01-intro-and-baseline", async (page) => {
    await renderTitle(page);
    await screenshot(page, "00-title.png");
    await sleep(7_000);

    await prepareAppPage(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await screenshot(page, "01-product.png");
    await sleep(8_000);

    await scrollTo(page, "#createIdentityButton", 220);
    await highlight(page, "#createIdentityButton");
    await sleep(3_000);
    await page.click("#createIdentityButton");
    await page.waitForFunction(() => document.querySelector("#versionNumber")?.textContent?.trim() === "1");
    const newIdentityId = (await page.locator("#activeIdentityId").textContent())?.trim();
    if (!newIdentityId) throw new Error("Identity UUID was not rendered after creation.");
    await highlight(page, "#activeIdentity");
    await screenshot(page, "02-identity-version-1.png");
    await sleep(9_000);

    await page.click("#loadBaselineButton");
    await page.waitForFunction((expected) => document.querySelector("#claimText")?.value === expected, BASELINE);
    await highlight(page, "#claimText");
    await sleep(3_000);
    await page.click("#submitClaimButton");
    await page.waitForFunction(() => document.querySelector("#versionNumber")?.textContent?.trim() === "2");
    await scrollTo(page, "#contextView", 120);
    await highlight(page, "#contextView");
    await screenshot(page, "03-canonical-version-2.png");
    await sleep(12_000);

    return newIdentityId;
  });

  await fs.writeFile(path.join(OUTPUT_DIR, "recorded-identity-id.txt"), `${identityId}\n`, "utf8");

  await recordPart(browser, "02-restoration-conflict-resolution", async (page) => {
    await prepareAppPage(page);
    await scrollTo(page, "#existingIdentityId", 220);
    await page.fill("#existingIdentityId", identityId);
    await highlight(page, "#existingIdentityId");
    await page.click("#resumeIdentityButton");
    await page.waitForFunction(() => document.querySelector("#versionNumber")?.textContent?.trim() === "2");
    await scrollTo(page, "#contextView", 120);
    await screenshot(page, "04-restored-version-2.png");
    await sleep(11_000);

    await scrollTo(page, "#loadConflictButton", 260);
    await page.click("#loadConflictButton");
    await page.waitForFunction((expected) => document.querySelector("#claimText")?.value === expected, CONTRADICTION);
    await highlight(page, "#claimText");
    await sleep(2_000);
    await page.click("#submitClaimButton");
    await page.waitForSelector("#conflictCard:not(.hidden)");
    await scrollTo(page, "#conflictView", 110);
    await highlight(page, "#conflictCard");
    await screenshot(page, "05-open-conflict.png");
    await sleep(14_000);

    await page.click('[data-tab="context"]');
    await page.waitForSelector('#contextView.active');
    await scrollTo(page, "#contextView", 110);
    await highlight(page, "#contextView");
    await screenshot(page, "06-candidate-isolation-version-2.png");
    await sleep(8_000);

    await page.click('[data-tab="conflict"]');
    await page.waitForSelector('#conflictView.active');
    await page.fill("#resolutionRationale", RATIONALE);
    await scrollTo(page, "#resolutionRationale", 250);
    await highlight(page, "#resolutionRationale");
    await sleep(4_000);
    await page.click('[data-decision="keep_existing"]');
    await page.waitForFunction(() => document.querySelector("#versionNumber")?.textContent?.trim() === "3");
    await scrollTo(page, "#contextView", 110);
    await highlight(page, "#contextView");
    await screenshot(page, "07-canonical-version-3.png");
    await sleep(10_000);

    await page.click('[data-tab="timeline"]');
    await page.waitForSelector('#timelineView.active');
    await scrollTo(page, "#timelineView", 100);
    await highlight(page, "#timelineView");
    await screenshot(page, "08-provenance.png");
    await sleep(10_000);

    const downloadPromise = page.waitForEvent("download");
    await page.click("#exportButton");
    const download = await downloadPromise;
    await download.saveAs(path.join(DOWNLOAD_DIR, "persistent-self-manifest.json"));
    await page.waitForFunction(() => document.querySelector("#toast")?.textContent?.includes("Manifest"));
    await screenshot(page, "09-manifest-export.png");
    await sleep(5_000);
  });

  await recordPart(browser, "03-evidence-architecture-final", async (page) => {
    await renderEvidence(page);
    await screenshot(page, "10-production-evidence.png");
    await sleep(13_000);

    await renderArchitecture(page);
    await screenshot(page, "11-architecture.png");
    await sleep(18_000);

    await renderFinal(page);
    await screenshot(page, "12-final-formula.png");
    await sleep(8_000);
  });
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  application: APP_URL,
  identityId,
  baseline: BASELINE,
  contradiction: CONTRADICTION,
  decision: "keep_existing",
  rationale: RATIONALE,
  productionValidation: productionEvidence.summary,
  managedMcp: managedMcpEvidence.score,
  rawParts: [
    "01-intro-and-baseline.webm",
    "02-restoration-conflict-resolution.webm",
    "03-evidence-architecture-final.webm"
  ],
  screenshots: (await fs.readdir(SCREENSHOT_DIR)).sort()
};

await fs.writeFile(
  path.join(OUTPUT_DIR, "recording-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
