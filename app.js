// ============================
// TODO PWA — APP.JS
// ============================

// ---- State ----
let todos = loadTodos();
let currentFilter = "all";
let deferredInstallPrompt = null;

// ---- DOM ----
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const itemsLeft = document.getElementById("items-left");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter-btn");
const installBanner = document.getElementById("install-banner");
const installBtn = document.getElementById("install-btn");
const installClose = document.getElementById("install-close");
const offlineNotice = document.getElementById("offline-notice");

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  renderTodos();
  setupEventListeners();
  updateOnlineStatus();
});

// ============================
// SERVICE WORKER REGISTRATION
// ============================
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "[App] Service Worker registered:",
            registration.scope
          );

          // Check for SW updates
          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            newWorker.onstatechange = () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[App] New SW available — reload to update");
              }
            };
          };
        })
        .catch((err) => {
          console.error("[App] SW registration failed:", err);
        });
    });
  } else {
    console.warn("[App] Service Workers not supported in this browser");
  }
}

// ============================
// PWA INSTALL PROMPT
// ============================
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBanner.classList.remove("hidden");
  console.log("[App] Install prompt captured");
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  console.log("[App] Install outcome:", outcome);
  deferredInstallPrompt = null;
  installBanner.classList.add("hidden");
});

installClose.addEventListener("click", () => {
  installBanner.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  console.log("[App] PWA was installed!");
  installBanner.classList.add("hidden");
  deferredInstallPrompt = null;
});

// ============================
// ONLINE / OFFLINE DETECTION
// ============================
function updateOnlineStatus() {
  if (!navigator.onLine) {
    offlineNotice.classList.remove("hidden");
  } else {
    offlineNotice.classList.add("hidden");
  }
}

window.addEventListener("online", () => {
  offlineNotice.classList.add("hidden");
  console.log("[App] Back online");
});

window.addEventListener("offline", () => {
  offlineNotice.classList.remove("hidden");
  console.log("[App] Gone offline");
});

// ============================
// EVENT LISTENERS
// ============================
function setupEventListeners() {
  addBtn.addEventListener("click", handleAddTodo);
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddTodo();
  });

  clearDoneBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.done);
    saveTodos();
    renderTodos();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTodos();
    });
  });
}

// ============================
// CRUD
// ============================
function handleAddTodo() {
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    todoInput.classList.add("shake");
    setTimeout(() => todoInput.classList.remove("shake"), 300);
    return;
  }

  const todo = {
    id: Date.now(),
    text,
    done: false,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(todo);
  saveTodos();
  renderTodos();
  todoInput.value = "";
  todoInput.focus();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.classList.add("removing");
    setTimeout(() => {
      todos = todos.filter((t) => t.id !== id);
      saveTodos();
      renderTodos();
    }, 200);
  }
}

// ============================
// RENDER
// ============================
function getFilteredTodos() {
  switch (currentFilter) {
    case "active":
      return todos.filter((t) => !t.done);
    case "done":
      return todos.filter((t) => t.done);
    default:
      return todos;
  }
}

function renderTodos() {
  const filtered = getFilteredTodos();
  todoList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.innerHTML = `
      <span class="todo-empty__icon">${
        currentFilter === "done" ? "🎉" : "📋"
      }</span>
      ${
        currentFilter === "done"
          ? "Немає виконаних завдань"
          : currentFilter === "active"
          ? "Всі завдання виконано!"
          : "Список порожній. Додайте перше завдання!"
      }
    `;
    todoList.appendChild(empty);
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item${todo.done ? " done" : ""}`;
      li.dataset.id = todo.id;
      li.innerHTML = `
        <button class="todo-checkbox" aria-label="${
          todo.done ? "Позначити невиконаним" : "Позначити виконаним"
        }"></button>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <button class="todo-delete" aria-label="Видалити завдання">✕</button>
      `;

      li.querySelector(".todo-checkbox").addEventListener("click", () =>
        toggleTodo(todo.id)
      );
      li.querySelector(".todo-delete").addEventListener("click", () =>
        deleteTodo(todo.id)
      );

      todoList.appendChild(li);
    });
  }

  updateFooter();
}

function updateFooter() {
  const active = todos.filter((t) => !t.done).length;
  itemsLeft.textContent = `${active} ${pluralize(active, "завдання", "завдань", "завдань")}`;
  clearDoneBtn.style.display = todos.some((t) => t.done) ? "inline-block" : "none";
}

// ============================
// LOCALSTORAGE
// ============================
function saveTodos() {
  try {
    localStorage.setItem("pwa-todos", JSON.stringify(todos));
  } catch (e) {
    console.error("[App] Failed to save todos:", e);
  }
}

function loadTodos() {
  try {
    const stored = localStorage.getItem("pwa-todos");
    return stored ? JSON.parse(stored) : getDefaultTodos();
  } catch (e) {
    return getDefaultTodos();
  }
}

function getDefaultTodos() {
  return [
    { id: 1, text: "Встановити Node.js та Git", done: true, createdAt: new Date().toISOString() },
    { id: 2, text: "Створити Electron додаток", done: true, createdAt: new Date().toISOString() },
    { id: 3, text: "Розробити PWA додаток", done: false, createdAt: new Date().toISOString() },
    { id: 4, text: "Зареєструвати Service Worker", done: false, createdAt: new Date().toISOString() },
    { id: 5, text: "Залити проект на GitHub", done: false, createdAt: new Date().toISOString() },
  ];
}

// ============================
// UTILS
// ============================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}
