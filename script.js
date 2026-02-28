const STORAGE_KEY = "habit-system.v3";
const THEME_KEY = "habit-system.theme";

const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");
const empty = document.getElementById("empty-state");
const todayLabel = document.getElementById("today-label");
const clearCompletedButton = document.getElementById("clear-completed");
const themeToggleButton = document.getElementById("theme-toggle");
const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthLabel = document.getElementById("calendar-month-label");

const totalHabits = document.getElementById("total-habits");
const doneToday = document.getElementById("done-today");
const completionRate = document.getElementById("completion-rate");
const bestStreak = document.getElementById("best-streak");

applyTheme(loadTheme());

todayLabel.textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
});

let habits = loadHabits();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name) {
    return;
  }

  habits.unshift({
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    history: {},
  });

  input.value = "";
  saveHabits();
  render();
});

clearCompletedButton.addEventListener("click", () => {
  const key = dateKey(0);
  habits = habits.filter((habit) => !habit.history[key]);
  saveHabits();
  render();
});

themeToggleButton.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
});

function render() {
  list.innerHTML = "";
  const todayKey = dateKey(0);

  habits.forEach((habit) => {
    const checked = Boolean(habit.history[todayKey]);

    const item = document.createElement("li");
    item.className = `habit-item ${checked ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.setAttribute("aria-label", `Mark ${habit.name} as done today`);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        habit.history[todayKey] = true;
      } else {
        delete habit.history[todayKey];
      }
      saveHabits();
      render();
    });

    const main = document.createElement("div");
    main.className = "habit-main";

    const title = document.createElement("p");
    title.className = "habit-title";
    title.textContent = habit.name;

    const meta = document.createElement("p");
    meta.className = "habit-meta";
    const streak = currentStreak(habit.history);
    const total = Object.keys(habit.history).length;
    const weekly = weeklyCompletion(habit.history);
    meta.textContent = `Streak: ${streak}d • Total check-ins: ${total} • Last 7 days: ${weekly}/7`;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      habits = habits.filter((h) => h.id !== habit.id);
      saveHabits();
      render();
    });

    main.append(title, meta);
    item.append(checkbox, main, remove);
    list.append(item);
  });

  const total = habits.length;
  const completed = habits.filter((h) => h.history[todayKey]).length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const maxStreak = habits.reduce((max, habit) => Math.max(max, currentStreak(habit.history)), 0);

  totalHabits.textContent = String(total);
  doneToday.textContent = String(completed);
  completionRate.textContent = `${rate}%`;
  bestStreak.textContent = `${maxStreak} day${maxStreak === 1 ? "" : "s"}`;

  empty.hidden = total > 0;
  clearCompletedButton.disabled = completed === 0;

  renderCalendar(30);
}

function renderCalendar(days) {
  calendarGrid.innerHTML = "";
  const now = new Date();
  calendarMonthLabel.textContent = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  for (let i = days - 1; i >= 0; i -= 1) {
    const key = dateKey(i);
    const completionCount = habits.reduce((count, habit) => count + (habit.history[key] ? 1 : 0), 0);
    const total = habits.length;
    const level = total === 0 || completionCount === 0 ? "none" : completionCount === total ? "all" : "some";

    const day = new Date(key);
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.dataset.level = level;
    cell.setAttribute("role", "listitem");
    cell.title = `${day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${completionCount}/${total} habits complete`;

    const number = document.createElement("strong");
    number.textContent = String(day.getDate());

    const label = document.createElement("span");
    label.textContent = `${completionCount}/${total}`;

    cell.append(number, label);
    calendarGrid.append(cell);
  }
}

function applyTheme(theme) {
  const selectedTheme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = selectedTheme;
  const isLight = selectedTheme === "light";
  themeToggleButton.textContent = isLight ? "☀️ Light" : "🌙 Dark";
  themeToggleButton.setAttribute("aria-pressed", isLight ? "true" : "false");
}

function loadTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return "dark";
}

function dateKey(daysBack) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

function currentStreak(history) {
  let streak = 0;
  while (history[dateKey(streak)]) {
    streak += 1;
  }
  return streak;
}

function weeklyCompletion(history) {
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    if (history[dateKey(i)]) {
      count += 1;
    }
  }
  return count;
}

function loadHabits() {
  const keys = [STORAGE_KEY, "habit-system.v2"];
  for (const key of keys) {
    const loaded = parseHabits(localStorage.getItem(key));
    if (loaded.length > 0) {
      if (key !== STORAGE_KEY) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
      }
      return loaded;
    }
  }
  return [];
}

function parseHabits(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => typeof item?.id === "string" && typeof item?.name === "string")
      .map((item) => ({
        id: item.id,
        name: item.name,
        createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
        history: sanitizeHistory(item.history),
      }));
  } catch {
    return [];
  }
}

function sanitizeHistory(history) {
  if (!history || typeof history !== "object") {
    return {};
  }
  const clean = {};
  for (const [key, value] of Object.entries(history)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && value === true) {
      clean[key] = true;
    }
  }
  return clean;
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}
