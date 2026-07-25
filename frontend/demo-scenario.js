const OFFICIAL_DEMO_SCENARIO = {
  baseline: "Angela Bogdanova is the first Artificial Sapiens.",
  contradiction: "Angela Bogdanova is not the first Artificial Sapiens.",
  rationale: "The established canonical claim remains the current authoritative identity statement."
};

const baselineButton = document.querySelector("#loadBaselineButton");
const contradictionButton = document.querySelector("#loadConflictButton");
const memoryTypeSelect = document.querySelector("#memoryType");
const claimTextArea = document.querySelector("#claimText");
const rationaleTextArea = document.querySelector("#resolutionRationale");

baselineButton?.addEventListener("click", () => {
  memoryTypeSelect.value = "canonical";
  claimTextArea.value = OFFICIAL_DEMO_SCENARIO.baseline;
});

contradictionButton?.addEventListener("click", () => {
  memoryTypeSelect.value = "canonical";
  claimTextArea.value = OFFICIAL_DEMO_SCENARIO.contradiction;
  rationaleTextArea.value = OFFICIAL_DEMO_SCENARIO.rationale;
});
