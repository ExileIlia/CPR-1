// ============================
// SCREEN RECORDER — RENDER.JS
// ============================

// ---- DOM Elements ----
const videoElement   = document.getElementById("videoElement");
const startBtn       = document.getElementById("startBtn");
const stopBtn        = document.getElementById("stopBtn");
const openBtn        = document.getElementById("openBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");
const statusText     = document.getElementById("statusText");
const statusBar      = document.getElementById("statusBar");
const timerDisplay   = document.getElementById("timerDisplay");
const timerValue     = document.getElementById("timerValue");
const noSourceOverlay = document.getElementById("noSourceOverlay");
const sourcesGrid    = document.getElementById("sourcesGrid");
const recordingsSection = document.getElementById("recordingsSection");
const recordingsList = document.getElementById("recordingsList");

// ---- State ----
let mediaRecorder   = null;
let recordedChunks  = [];
let currentStream   = null;
let timerInterval   = null;
let timerSeconds    = 0;
let recordings      = []; // { blob, url, name, size, duration }
let activeSourceId  = null;

// ============================
// SOURCE SELECTION
// ============================

videoSelectBtn.addEventListener("click", loadSources);

async function loadSources() {
  try {
    setStatus("⏳ Завантаження джерел...", "");
    const sources = await window.electronAPI.getSources();
    renderSourcesGrid(sources);
  } catch (err) {
    setStatus("❌ Помилка отримання джерел", "is-danger");
    console.error("[Renderer] getSources error:", err);
  }
}

function renderSourcesGrid(sources) {
  sourcesGrid.innerHTML = "";

  sources.forEach((source) => {
    const card = document.createElement("div");
    card.className = `source-card${source.id === activeSourceId ? " active" : ""}`;
    card.dataset.id = source.id;

    card.innerHTML = `
      <img src="${source.thumbnail}" alt="${source.name}" />
      <p title="${source.name}">${source.name}</p>
    `;

    card.addEventListener("click", () => selectSource(source));
    sourcesGrid.appendChild(card);
  });

  setStatus("🖥️ Оберіть джерело зі списку нижче", "");
}

// ============================
// SELECT SOURCE & START STREAM
// ============================

async function selectSource(source) {
  try {
    // Stop previous stream
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }

    activeSourceId = source.id;
    videoSelectBtn.textContent = `🖥 ${source.name}`;

    // Update active card styling
    document.querySelectorAll(".source-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.id === source.id);
    });

    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: source.id,
        },
      },
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = currentStream;
    videoElement.play();

    // Hide overlay
    noSourceOverlay.classList.add("hidden");

    // Setup MediaRecorder
    const mimeType = getSupportedMimeType();
    const options = { mimeType };
    mediaRecorder = new MediaRecorder(currentStream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

    // Enable controls
    startBtn.disabled = false;
    stopBtn.disabled = true;

    setStatus(`✅ Джерело: ${source.name}`, "");
  } catch (err) {
    setStatus("❌ Не вдалося отримати потік", "is-danger");
    console.error("[Renderer] selectSource error:", err);
  }
}

function getSupportedMimeType() {
  const types = [
    "video/webm; codecs=vp9",
    "video/webm; codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

// ============================
// RECORDING CONTROLS
// ============================

startBtn.addEventListener("click", () => {
  if (!mediaRecorder) return;

  recordedChunks = [];
  mediaRecorder.start(100); // collect data every 100ms

  // UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  startBtn.classList.add("is-danger");
  startBtn.querySelector("span:last-child").textContent = "Запис...";
  document.querySelector(".video-wrapper").classList.add("recording");

  startTimer();
  setStatus("🔴 Запис...", "is-danger-light");
});

stopBtn.addEventListener("click", () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  mediaRecorder.stop();

  // UI
  startBtn.disabled = false;
  stopBtn.disabled = true;
  startBtn.classList.remove("is-danger");
  startBtn.querySelector("span:last-child").textContent = "Старт";
  document.querySelector(".video-wrapper").classList.remove("recording");

  stopTimer();
  setStatus("⏹ Запис зупинено. Зберігаємо...", "");
});

// ============================
// MEDIA RECORDER EVENTS
// ============================

function handleDataAvailable(e) {
  if (e.data && e.data.size > 0) {
    recordedChunks.push(e.data);
  }
}

async function handleStop() {
  if (recordedChunks.length === 0) {
    setStatus("⚠️ Немає даних для збереження", "");
    return;
  }

  const mimeType = mediaRecorder.mimeType || "video/webm";
  const blob = new Blob(recordedChunks, { type: mimeType });
  const duration = timerSeconds;

  // Ask user where to save
  const filePath = await window.electronAPI.showSaveDialog();
  if (!filePath) {
    setStatus("💾 Збереження скасовано", "");
    // Still add to in-memory list
    addRecordingToList(blob, "Незбережений запис", duration);
    return;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await window.electronAPI.writeFile(filePath, Array.from(uint8Array));

    const fileName = filePath.split(/[\\/]/).pop();
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);

    addRecordingToList(blob, fileName, duration, sizeMB);
    setStatus(`✅ Збережено: ${fileName}`, "");
    console.log("[Renderer] Video saved:", filePath);
  } catch (err) {
    setStatus("❌ Помилка збереження", "is-danger");
    console.error("[Renderer] writeFile error:", err);
  }
}

// ============================
// OPEN VIDEO FILE
// ============================

openBtn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.showOpenDialog();
  if (!filePath) return;

  const fileName = filePath.split(/[\\/]/).pop();

  // Load into video element
  videoElement.src = `file://${filePath}`;
  videoElement.srcObject = null;
  videoElement.controls = true;
  videoElement.play().catch(() => {});

  noSourceOverlay.classList.add("hidden");
  setStatus(`📂 Відкрито: ${fileName}`, "");

  // Add to list
  addExternalFileToList(filePath, fileName);
});

// ============================
// RECORDINGS LIST
// ============================

function addRecordingToList(blob, name, duration, sizeMB) {
  const url = URL.createObjectURL(blob);
  const rec = { url, name, duration, sizeMB: sizeMB || "?" };
  recordings.push(rec);
  renderRecordingItem(rec);
  recordingsSection.classList.remove("is-hidden");
}

function addExternalFileToList(filePath, name) {
  const url = `file://${filePath}`;
  const rec = { url, name, duration: 0, sizeMB: "?" };
  recordings.push(rec);
  renderRecordingItem(rec);
  recordingsSection.classList.remove("is-hidden");
}

function renderRecordingItem(rec) {
  const item = document.createElement("div");
  item.className = "recording-item";

  const durationStr = formatTime(rec.duration);

  item.innerHTML = `
    <video src="${rec.url}" controls preload="metadata"></video>
    <div class="recording-meta">
      <strong>${rec.name}</strong>
      <p>⏱ Тривалість: ${durationStr}</p>
      <p>📦 Розмір: ${rec.sizeMB} MB</p>
    </div>
    <div class="recording-actions">
      <a href="${rec.url}" download="${rec.name}" class="button is-small is-success">
        ⬇ Скачати
      </a>
      <button class="button is-small is-light play-btn">▶ Грати</button>
    </div>
  `;

  // Play in main video element
  item.querySelector(".play-btn").addEventListener("click", () => {
    videoElement.srcObject = null;
    videoElement.src = rec.url;
    videoElement.controls = true;
    videoElement.play().catch(() => {});
    noSourceOverlay.classList.add("hidden");
    setStatus(`▶ Програється: ${rec.name}`, "");
  });

  recordingsList.prepend(item);
}

// ============================
// TIMER
// ============================

function startTimer() {
  timerSeconds = 0;
  timerDisplay.classList.remove("is-hidden");
  timerValue.textContent = "00:00";

  timerInterval = setInterval(() => {
    timerSeconds++;
    timerValue.textContent = formatTime(timerSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerDisplay.classList.add("is-hidden");
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ============================
// STATUS
// ============================

function setStatus(text, cls) {
  statusText.textContent = text;
  statusBar.className = "notification is-dark has-text-centered mb-4";
  if (cls) statusBar.classList.add(cls);
}

// ============================
// INIT
// ============================

// Auto-load sources on start
window.addEventListener("DOMContentLoaded", () => {
  loadSources();
});
