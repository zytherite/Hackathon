const photoInput = document.querySelector("#photo-input");
const dropzone = document.querySelector("#dropzone");
const preview = document.querySelector("#photo-preview");
const photoLabel = document.querySelector("#photo-label");
const removePhoto = document.querySelector("#remove-photo");
const issueType = document.querySelector("#issue-type");
const locationInput = document.querySelector("#location-input");
const notesInput = document.querySelector("#notes-input");
const reportContent = document.querySelector("#report-content");
const copyButton = document.querySelector("#copy-report");
const downloadButton = document.querySelector("#download-report");
const uploadError = document.querySelector("#upload-error");
const toast = document.querySelector("#toast");
const issueNames = {
  pothole: "Pothole",
  "road-crack": "Road crack",
  streetlight: "Broken streetlight",
  "overflowing-garbage": "Overflowing garbage",
  other: "Other street issue",
};
const severityNames = ["", "Minor", "Low", "Moderate", "High", "Urgent"];
const severityByType = {
  pothole: 3,
  "road-crack": 2,
  streetlight: 3,
  "overflowing-garbage": 3,
  other: 2,
};

let photoUrl = "";
let selectedSeverity = 3;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

function setSeverity(value) {
  selectedSeverity = value;
  document.querySelectorAll(".severity-option").forEach((button) => {
    const selected = Number(button.dataset.severity) === value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#severity-value").textContent = `${value} / 5 · ${severityNames[value]}`;
  updateReport();
}

function suggestFromFilename(fileName) {
  const name = fileName.toLowerCase();
  const matches = [
    [/pothole|hole|crater/, "pothole"],
    [/crack|split|fissure/, "road-crack"],
    [/light|lamp|streetlight|street-light/, "streetlight"],
    [/garbage|trash|rubbish|waste|overflow|bin/, "overflowing-garbage"],
  ];
  return matches.find(([pattern]) => pattern.test(name))?.[1] ?? null;
}

function acceptPhoto(file) {
  uploadError.classList.remove("visible");
  uploadError.textContent = "";
  if (!file || !file.type.startsWith("image/")) {
    uploadError.textContent = "Choose an image file to continue.";
    uploadError.classList.add("visible");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadError.textContent = "That image is over 10 MB. Choose a smaller photo.";
    uploadError.classList.add("visible");
    return;
  }
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = URL.createObjectURL(file);
  preview.src = photoUrl;
  photoLabel.textContent = file.name;
  dropzone.classList.add("has-photo");
  const suggestion = suggestFromFilename(file.name);
  if (suggestion) {
    issueType.value = suggestion;
    setSeverity(severityByType[suggestion]);
    document.querySelector("#analysis-note").innerHTML = `<span class="spark-icon" aria-hidden="true">✳</span><span>Filename suggests <strong>${issueNames[suggestion]}</strong>. Confirm the category and severity; this demo does not analyze image pixels.</span>`;
  } else {
    document.querySelector("#analysis-note").innerHTML = '<span class="spark-icon" aria-hidden="true">✳</span><span>Choose the issue type and severity. This demo does not analyze image pixels.</span>';
  }
  document.querySelectorAll(".step").forEach((step, index) => step.classList.toggle("active", index === 0 || index === 1));
  updateReport();
}

function getReportText() {
  const location = locationInput.value.trim() || "Location not provided";
  const notes = notesInput.value.trim() || "No additional details provided.";
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date());
  const reference = `SW-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return {
    reference,
    date,
    location,
    notes,
    issue: issueNames[issueType.value],
    severity: severityNames[selectedSeverity],
    severityNumber: selectedSeverity,
    text: [
      "STREET ISSUE REPORT",
      `Reference: ${reference}`,
      `Date: ${date}`,
      `Issue type: ${issueNames[issueType.value]}`,
      `Severity: ${severityNames[selectedSeverity]} (${selectedSeverity}/5)`,
      `Location: ${location}`,
      `Additional details: ${notes}`,
      "",
      "Please inspect this issue and arrange the appropriate repair or follow-up. A photo is attached separately.",
    ].join("\n"),
  };
}

function updateReport() {
  const hasPhoto = Boolean(photoUrl);
  copyButton.disabled = !hasPhoto;
  downloadButton.disabled = !hasPhoto;
  if (!hasPhoto) {
    reportContent.innerHTML = '<p class="report-placeholder">Your report will take shape as you add details.</p>';
    return;
  }
  const report = getReportText();
  const severityClass = report.severityNumber >= 4 ? "high" : report.severityNumber <= 2 ? "low" : "";
  reportContent.innerHTML = `
    <div class="report-body">
      <p class="report-summary">Please inspect a reported street issue and arrange appropriate follow-up.</p>
      <dl class="report-meta">
        <div><dt>Issue</dt><dd>${report.issue}</dd></div>
        <div><dt>Severity</dt><dd><span class="severity-chip ${severityClass}">${report.severity} · ${report.severityNumber}/5</span></dd></div>
        <div><dt>Location</dt><dd title="${escapeHtml(report.location)}">${escapeHtml(report.location)}</dd></div>
        <div><dt>Reference</dt><dd>${report.reference}</dd></div>
      </dl>
      <p class="report-summary"><strong>Details:</strong> ${escapeHtml(report.notes)}</p>
      <p class="report-summary" style="margin-top:10px;color:#89948c">Prepared ${report.date}</p>
    </div>`;
  document.querySelectorAll(".step").forEach((step, index) => step.classList.toggle("active", index < 3));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

photoInput.addEventListener("change", (event) => acceptPhoto(event.target.files[0]));
removePhoto.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = "";
  preview.removeAttribute("src");
  photoInput.value = "";
  dropzone.classList.remove("has-photo");
  document.querySelector("#analysis-note").innerHTML = '<span class="spark-icon" aria-hidden="true">✳</span><span>Photo suggestions are a demo. Please confirm the issue type and severity.</span>';
  document.querySelectorAll(".step").forEach((step, index) => step.classList.toggle("active", index === 0));
  updateReport();
});

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    photoInput.click();
  }
});
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag-over");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag-over");
  acceptPhoto(event.dataTransfer.files[0]);
});

document.querySelectorAll(".severity-option").forEach((button) => {
  button.addEventListener("click", () => setSeverity(Number(button.dataset.severity)));
});
issueType.addEventListener("change", () => {
  setSeverity(severityByType[issueType.value]);
  updateReport();
});
locationInput.addEventListener("input", updateReport);
notesInput.addEventListener("input", updateReport);

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(getReportText().text);
    showToast("Report copied to clipboard.");
  } catch {
    showToast("Clipboard access is unavailable in this browser.");
  }
});
downloadButton.addEventListener("click", () => {
  const report = getReportText();
  const blob = new Blob([report.text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${report.reference.toLowerCase()}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Report downloaded.");
});

document.querySelector(".help-button").addEventListener("click", () => {
  showToast("Streetwise prepares a draft; it does not send reports or identify image contents.");
});

updateReport();