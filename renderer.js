// Helper: update element and apply color class based on value
function updateValue(id, data, isPercent = true) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = data;

  if (isPercent) {
    const val = parseFloat(data);
    el.classList.remove("high", "medium", "low");
    if (val >= 80) {
      el.classList.add("high");
    } else if (val >= 50) {
      el.classList.add("medium");
    } else {
      el.classList.add("low");
    }
  }
}

// Listen for IPC events from main process
window.electronAPI.onCpu((data) => {
  updateValue("cpu", data, true);
});

window.electronAPI.onMem((data) => {
  updateValue("mem", data, true);
});

window.electronAPI.onTotalMem((data) => {
  updateValue("total-mem", data, false);
});
