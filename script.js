// ---------- GREETING AND DATE ----------
const hour = new Date().getHours();
const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
document.getElementById("greeting").textContent = hello + "!";
document.getElementById("today").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "long", day: "numeric", month: "long"
});
 
// ---------- TODO LIST ----------
let todos = [];
try { todos = JSON.parse(localStorage.getItem("todos")) || []; } catch (e) {}
 
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");
const barEl = document.getElementById("bar");
 
function save() {
  try { localStorage.setItem("todos", JSON.stringify(todos)); } catch (e) {}
}
 
function render() {
  listEl.innerHTML = "";
  if (todos.length === 0) {
    listEl.innerHTML = '<li class="empty">No tasks yet. Add your first one above.</li>';
  }
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    if (t.done) li.className = "done";
 
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;
    cb.setAttribute("aria-label", "Mark done: " + t.text);
    cb.onchange = () => { todos[i].done = cb.checked; save(); render(); };
 
    const span = document.createElement("span");
    span.textContent = t.text; // textContent keeps user input safe
 
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "×";
    del.setAttribute("aria-label", "Delete task: " + t.text);
    del.onclick = () => { todos.splice(i, 1); save(); render(); };
 
    li.append(cb, span, del);
    listEl.appendChild(li);
  });
 
  const done = todos.filter(t => t.done).length;
  countEl.textContent = done + " / " + todos.length + " done";
  barEl.style.width = todos.length ? (done / todos.length * 100) + "%" : "0%";
}
 
document.getElementById("todo-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("todo-input");
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = "";
  save(); render();
});
 
document.getElementById("clear").onclick = () => {
  todos = todos.filter(t => !t.done);
  save(); render();
};
 
render();
 
// ---------- WEATHER (Open-Meteo, no API key needed) ----------
const out = document.getElementById("weather-out");
const card = document.getElementById("weather");
 
// weather code -> [description, emoji, card theme]
function describe(code) {
  if (code === 0) return ["Clear sky", "☀️", "sunny"];
  if (code === 1) return ["Mostly clear", "🌤️", "sunny"];
  if (code === 2) return ["Partly cloudy", "⛅", "cloudy"];
  if (code === 3) return ["Overcast", "☁️", "cloudy"];
  if (code === 45 || code === 48) return ["Fog", "🌫️", "cloudy"];
  if (code >= 51 && code <= 57) return ["Drizzle", "🌦️", "rainy"];
  if (code >= 61 && code <= 67) return ["Rain", "🌧️", "rainy"];
  if (code >= 71 && code <= 77) return ["Snow", "❄️", "snowy"];
  if (code >= 80 && code <= 82) return ["Rain showers", "🌧️", "rainy"];
  if (code >= 95) return ["Thunderstorm", "⛈️", "stormy"];
  return ["Weather", "🌡️", ""];
}
 
async function getWeather(city) {
  out.className = "msg";
  out.textContent = "Loading weather...";
  try {
    const geo = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(city)
    ).then(r => r.json());
 
    if (!geo.results || geo.results.length === 0) {
      out.textContent = "City not found. Check the spelling and try again.";
      return;
    }
    const p = geo.results[0];
 
    const w = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" + p.latitude +
      "&longitude=" + p.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code"
    ).then(r => r.json());
 
    const c = w.current;
    const [text, icon, theme] = describe(c.weather_code);
 
    card.className = "weather " + theme;
    out.className = "";
    out.innerHTML =
      '<div class="now">' +
        '<div class="icon">' + icon + '</div>' +
        '<div>' +
          '<div class="temp">' + Math.round(c.temperature_2m) + '°C</div>' +
          '<div class="city"></div>' +
          '<div class="desc">' + text + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="stats">' +
        '<div>Feels like<b>' + Math.round(c.apparent_temperature) + '°C</b></div>' +
        '<div>Humidity<b>' + c.relative_humidity_2m + '%</b></div>' +
        '<div>Wind<b>' + c.wind_speed_10m + ' km/h</b></div>' +
      '</div>';
    out.querySelector(".city").textContent = p.name + (p.country ? ", " + p.country : "");
    try { localStorage.setItem("city", city); } catch (e) {}
  } catch (err) {
    out.textContent = "Could not load weather. Check your internet connection.";
  }
}
 
document.getElementById("city-form").addEventListener("submit", e => {
  e.preventDefault();
  getWeather(document.getElementById("city-input").value.trim());
});
 
// Reload the last searched city
try {
  const last = localStorage.getItem("city");
  if (last) {
    document.getElementById("city-input").value = last;
    getWeather(last);
  }
} catch (e) {}
 