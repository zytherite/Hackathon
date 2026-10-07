let photoUrl = "";
let reference = "";
let severity = 3;

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2200);
}

function setSeverity(value = severity) {
  severity = value;
  document.querySelectorAll(".severity-option").forEach((button) => {
    const selected = Number(button.dataset.severity) === value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#severity-value").textContent = `${value} / 5 · ${["", "Minor", "Low", "Moderate", "High", "Urgent"][value]}`;
  updateReport();
}

function suggestType(name) {
  const filename = name.toLowerCase();
  if (/pothole|hole|crater/.test(filename)) return "pothole";
  if (/crack|split|fissure/.test(filename)) return "road-crack";
  if (/light|lamp/.test(filename)) return "streetlight";
  if (/garbage|trash|rubbish|waste|overflow|bin/.test(filename)) return "overflowing-garbage";
}

function acceptPhoto(file) {
  const error = document.querySelector("#upload-error");
  error.classList.remove("visible");
  if (!file || !file.type.startsWith("image/")) {
    error.textContent = "Choose an image file to continue.";
    error.classList.add("visible");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    error.textContent = "That image is over 10 MB. Choose a smaller photo.";
    error.classList.add("visible");
    return;
  }
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = URL.createObjectURL(file);
  const dropzone = document.querySelector("#dropzone");
  dropzone.classList.add("has-photo");
  dropzone.querySelector("img").src = photoUrl;
  document.querySelector("#photo-label").textContent = file.name;
  reference = `SW-${Date.now().toString(36).toUpperCase()}`;
  const type = suggestType(file.name);
  if (type) document.querySelector("#issue-type").value = type;
  document.querySelector("#analysis-note").textContent = type
    ? `Filename suggests ${document.querySelector(`#issue-type option[value="${type}"]`).textContent}. Confirm the type and severity.`
    : "Choose the issue type and severity. This demo does not analyze image pixels.";
  setSeverity(type === "road-crack" || type === "other" ? 2 : 3);
  updateReport();
}

function updateReport() {
  const content = document.querySelector("#report-content");
  document.querySelectorAll("#copy-report, #download-report").forEach((button) => button.disabled = !photoUrl);
  if (!photoUrl) {
    content.innerHTML = '<p class="report-placeholder">Add a photo to start your report.</p>';
    return;
  }
  const labels = ["", "Minor", "Low", "Moderate", "High", "Urgent"];
  const issue = document.querySelector("#issue-type");
  const name = issue.options[issue.selectedIndex].text;
  const location = document.querySelector("#location-input").value.trim() || "Location not provided";
  const notes = document.querySelector("#notes-input").value.trim() || "No additional details provided.";
  content.innerHTML = `<p>Please inspect this ${name.toLowerCase()} and arrange appropriate follow-up.</p>
    <dl><div><dt>Location</dt><dd>${escapeHtml(location)}</dd></div>
    <div><dt>Severity</dt><dd>${labels[severity]} (${severity}/5)</dd></div>
    <div><dt>Reference</dt><dd>${reference}</dd></div></dl>
    <p><strong>Details:</strong> ${escapeHtml(notes)}</p>`;
}

function reportText() {
  const issue = document.querySelector("#issue-type");
  return [
    "Street issue report",
    `Reference: ${reference}`,
    `Type: ${issue.options[issue.selectedIndex].text}`,
    `Severity: ${severity}/5`,
    `Location: ${document.querySelector("#location-input").value || "Not provided"}`,
    `Details: ${document.querySelector("#notes-input").value || "None provided"}`,
    "Please inspect this issue and arrange appropriate follow-up.",
  ].join("\n");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

document.querySelector("#photo-input").addEventListener("change", (event) => acceptPhoto(event.target.files[0]));
document.querySelector("#remove-photo").addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  URL.revokeObjectURL(photoUrl);
  photoUrl = "";
  reference = "";
  document.querySelector("#dropzone").classList.remove("has-photo");
  document.querySelector("#photo-input").value = "";
  document.querySelector("#analysis-note").textContent = "Suggestions use the photo filename only. Confirm the issue type and severity.";
  updateReport();
});

const dropzone = document.querySelector("#dropzone");
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

document.querySelectorAll(".severity-option").forEach((button) => button.addEventListener("click", () => setSeverity(Number(button.dataset.severity))));
document.querySelectorAll("#location-input, #notes-input").forEach((field) => field.addEventListener("input", updateReport));
document.querySelector("#issue-type").addEventListener("change", (event) => {
  const name = event.target.selectedOptions[0].text;
  document.querySelector("#analysis-note").textContent = `Selected ${name}. Adjust the suggested severity to match what you see.`;
  updateReport();
});

document.querySelector("#copy-report").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(reportText());
    showToast("Report copied to clipboard.");
  } catch {
    showToast("Clipboard access is unavailable in this browser.");
  }
});
document.querySelector("#download-report").addEventListener("click", () => {
  const blob = new Blob([reportText()], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${reference.toLowerCase()}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Report downloaded.");
});

updateReport();