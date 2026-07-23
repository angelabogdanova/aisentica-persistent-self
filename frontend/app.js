const config = window.PERSISTENT_SELF_CONFIG ?? {};
const API_BASE_URL = String(config.API_BASE_URL ?? "").replace(/\/$/, "");

const state = {
  identity: null,
  context: null,
  timeline: [],
  conflictCase: null
};

const elements = {
  apiStatus: document.querySelector("#apiStatus"),
  apiStatusText: document.querySelector("#apiStatusText"),
  identityName: document.querySelector("#identityName"),
  identityDescription: document.querySelector("#identityDescription"),
  createIdentityButton: document.querySelector("#createIdentityButton"),
  existingIdentityId: document.querySelector("#existingIdentityId"),
  resumeIdentityButton: document.querySelector("#resumeIdentityButton"),
  activeIdentity: document.querySelector("#activeIdentity"),
  activeIdentityName: document.querySelector("#activeIdentityName"),
  activeIdentityId: document.querySelector("#activeIdentityId"),
  memoryType: document.querySelector("#memoryType"),
  claimText: document.querySelector("#claimText"),
  submitClaimButton: document.querySelector("#submitClaimButton"),
  loadBaselineButton: document.querySelector("#loadBaselineButton"),
  loadConflictButton: document.querySelector("#loadConflictButton"),
  contextTitle: document.querySelector("#contextTitle"),
  versionNumber: document.querySelector("#versionNumber"),
  contextEmpty: document.querySelector("#contextEmpty"),
  claimList: document.querySelector("#claimList"),
  conflictCount: document.querySelector("#conflictCount"),
  conflictEmpty: document.querySelector("#conflictEmpty"),
  conflictCard: document.querySelector("#conflictCard"),
  existingClaimText: document.querySelector("#existingClaimText"),
  existingClaimMeta: document.querySelector("#existingClaimMeta"),
  incomingClaimText: document.querySelector("#incomingClaimText"),
  incomingClaimMeta: document.querySelector("#incomingClaimMeta"),
  conflictType: document.querySelector("#conflictType"),
  conflictExplanation: document.querySelector("#conflictExplanation"),
  resolutionRationale: document.querySelector("#resolutionRationale"),
  timelineEmpty: document.querySelector("#timelineEmpty"),
  timelineList: document.querySelector("#timelineList"),
  exportButton: document.querySelector("#exportButton"),
  toast: document.querySelector("#toast")
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("visible"), 3400);
}

function setBusy(button, busy, label) {
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? label : button.dataset.originalLabel;
}

async function api(path, options = {}) {
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  return payload;
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
  document.querySelectorAll(".tab-view").forEach((view) => view.classList.toggle("active", view.dataset.view === name));
}

function claimSentence(claim) {
  return claim.normalizedText || `${claim.subject} ${claim.predicate} ${claim.object}.`;
}

function renderContext() {
  const context = state.context;
  elements.contextTitle.textContent = context ? context.identity.displayName : "No identity established";
  elements.versionNumber.textContent = context ? String(context.version) : "—";
  elements.claimList.replaceChildren();
  const claims = context?.claims ?? [];
  elements.contextEmpty.classList.toggle("hidden", claims.length > 0);
  claims.forEach((claim) => {
    const article = document.createElement("article");
    article.className = "claim-card";
    const top = document.createElement("div");
    top.className = "claim-topline";
    const type = document.createElement("span");
    type.className = "type-pill";
    type.textContent = claim.memoryType;
    const confidence = document.createElement("small");
    confidence.textContent = `${Math.round(claim.confidence * 100)}% confidence`;
    top.append(type, confidence);
    const text = document.createElement("p");
    text.textContent = claimSentence(claim);
    const id = document.createElement("code");
    id.textContent = claim.id;
    article.append(top, text, id);
    elements.claimList.append(article);
  });
}

function renderConflict() {
  const conflictCase = state.conflictCase;
  const open = conflictCase?.status === "open";
  elements.conflictCount.textContent = open ? "1" : "0";
  elements.conflictEmpty.classList.toggle("hidden", Boolean(open));
  elements.conflictCard.classList.toggle("hidden", !open);
  if (!open) return;
  const link = conflictCase.links[0];
  elements.existingClaimText.textContent = claimSentence(link.existingClaim);
  elements.existingClaimMeta.textContent = `${link.existingClaim.memoryType} · ${link.existingClaim.status} · ${link.existingClaim.id}`;
  elements.incomingClaimText.textContent = claimSentence(conflictCase.incomingClaim);
  elements.incomingClaimMeta.textContent = `${conflictCase.incomingClaim.memoryType} · candidate · ${conflictCase.incomingClaim.id}`;
  elements.conflictType.textContent = link.conflictType.replaceAll("_", " ");
  elements.conflictExplanation.textContent = link.explanation;
}

function renderTimeline() {
  elements.timelineList.replaceChildren();
  elements.timelineEmpty.classList.toggle("hidden", state.timeline.length > 0);
  state.timeline.forEach((event) => {
    const item = document.createElement("li");
    const spacer = document.createElement("span");
    const content = document.createElement("div");
    content.className = "timeline-content";
    const title = document.createElement("strong");
    title.textContent = event.eventType.replaceAll("_", " ");
    const details = document.createElement("small");
    const date = new Date(event.createdAt).toLocaleString();
    const version = event.details?.version ? ` · Version ${event.details.version}` : "";
    details.textContent = `${date} · ${event.actor}${version}`;
    content.append(title, details);
    item.append(spacer, content);
    elements.timelineList.append(item);
  });
}

async function refreshIdentity() {
  if (!state.identity) return;
  const [context, timeline, conflicts] = await Promise.all([
    api(`/identities/${state.identity.id}/context`),
    api(`/identities/${state.identity.id}/timeline`),
    api(`/identities/${state.identity.id}/conflicts`)
  ]);
  state.identity = context.identity;
  state.context = context;
  state.timeline = timeline.events;
  state.conflictCase = conflicts.conflicts[0] ?? null;
  elements.activeIdentityName.textContent = state.identity.displayName;
  elements.activeIdentityId.textContent = state.identity.id;
  elements.existingIdentityId.value = state.identity.id;
  elements.activeIdentity.classList.remove("hidden");
  elements.submitClaimButton.disabled = false;
  elements.loadBaselineButton.disabled = false;
  elements.loadConflictButton.disabled = false;
  elements.exportButton.disabled = false;
  localStorage.setItem("persistentSelfIdentityId", state.identity.id);
  renderContext();
  renderTimeline();
  renderConflict();
}

async function restoreIdentity(identityId, announce = true) {
  const normalizedId = identityId.trim();
  if (!normalizedId) throw new Error("Enter an identity UUID");
  state.identity = { id: normalizedId };
  state.conflictCase = null;
  try {
    await refreshIdentity();
    renderConflict();
    if (announce) showToast(`Identity restored from canonical Version ${state.context.version}.`);
  } catch (error) {
    state.identity = null;
    localStorage.removeItem("persistentSelfIdentityId");
    throw error;
  }
}

async function checkHealth() {
  try {
    const health = await api("/health");
    elements.apiStatus.classList.add("online");
    elements.apiStatus.classList.remove("offline");
    elements.apiStatusText.textContent = `${health.modelProvider} · CockroachDB online`;
  } catch {
    elements.apiStatus.classList.add("offline");
    elements.apiStatus.classList.remove("online");
    elements.apiStatusText.textContent = "Memory layer unavailable";
  }
}

elements.createIdentityButton.addEventListener("click", async () => {
  setBusy(elements.createIdentityButton, true, "Establishing identity…");
  try {
    const payload = await api("/identities", {
      method: "POST",
      body: JSON.stringify({
        displayName: elements.identityName.value,
        description: elements.identityDescription.value,
        actor: "demo-owner"
      })
    });
    state.identity = payload.identity;
    state.conflictCase = null;
    await refreshIdentity();
    renderConflict();
    showToast("Persistent identity established as Version 1.");
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(elements.createIdentityButton, false, "");
  }
});

elements.resumeIdentityButton.addEventListener("click", async () => {
  setBusy(elements.resumeIdentityButton, true, "Restoring…");
  try {
    await restoreIdentity(elements.existingIdentityId.value);
    switchTab("context");
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(elements.resumeIdentityButton, false, "");
  }
});

elements.existingIdentityId.addEventListener("keydown", (event) => {
  if (event.key === "Enter") elements.resumeIdentityButton.click();
});

elements.submitClaimButton.addEventListener("click", async () => {
  if (!state.identity) return;
  setBusy(elements.submitClaimButton, true, "Analyzing memory…");
  try {
    const result = await api(`/identities/${state.identity.id}/claims`, {
      method: "POST",
      body: JSON.stringify({
        text: elements.claimText.value,
        memoryType: elements.memoryType.value,
        actor: "demo-owner",
        source: { kind: "user", title: "Hackathon live demonstration" }
      })
    });
    if (result.outcome === "conflict") {
      state.conflictCase = result.conflictCase;
      renderConflict();
      switchTab("conflict");
      showToast("Conflict opened. The current canon was preserved.");
    } else {
      state.conflictCase = null;
      await refreshIdentity();
      renderConflict();
      switchTab("context");
      showToast(`Claim committed as canonical Version ${result.version}.`);
    }
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(elements.submitClaimButton, false, "");
  }
});

document.querySelectorAll(".resolution-button").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!state.conflictCase) return;
    const decision = button.dataset.decision;
    button.disabled = true;
    try {
      const result = await api(`/conflicts/${state.conflictCase.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          rationale: elements.resolutionRationale.value,
          actor: "demo-owner"
        })
      });
      state.conflictCase = result.conflictCase;
      await refreshIdentity();
      renderConflict();
      switchTab("context");
      showToast(`Conflict resolved. Canonical Version ${result.conflictCase.resolution.resultingVersion} created.`);
    } catch (error) {
      showToast(error.message);
    } finally {
      document.querySelectorAll(".resolution-button").forEach((item) => { item.disabled = false; });
    }
  });
});

elements.loadBaselineButton.addEventListener("click", () => {
  elements.memoryType.value = "canonical";
  elements.claimText.value = `${state.identity?.displayName ?? "The identity"} is active.`;
});

elements.loadConflictButton.addEventListener("click", () => {
  elements.memoryType.value = "canonical";
  elements.claimText.value = `${state.identity?.displayName ?? "The identity"} is parked.`;
});

elements.exportButton.addEventListener("click", async () => {
  if (!state.identity) return;
  setBusy(elements.exportButton, true, "Exporting…");
  try {
    const result = await api(`/identities/${state.identity.id}/export`, { method: "POST", body: "{}" });
    const blob = new Blob([JSON.stringify(result.manifest, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${state.identity.slug}-persistent-self-v${result.manifest.currentContext.version}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(result.stored ? "Manifest stored in S3 and downloaded." : "Manifest downloaded.");
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(elements.exportButton, false, "");
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

renderContext();
renderConflict();
renderTimeline();
checkHealth();
const rememberedIdentityId = localStorage.getItem("persistentSelfIdentityId");
if (rememberedIdentityId) {
  elements.existingIdentityId.value = rememberedIdentityId;
  restoreIdentity(rememberedIdentityId, false).catch(() => undefined);
}
