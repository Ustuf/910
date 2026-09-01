/* ==========================================================
   Форма 910.00: логика калькулятора
   Один файл, без сборки и внешних зависимостей.
   ========================================================== */

/* ===================== СПРАВОЧНИКИ ===================== */

const YEARS = {
  2023: { mrp: 3450, mzp: 70000, rate: 3, limit: 24038, opv: 10, opvr: 0,   so: 3.5, vip: 5, oosms: 3, vosms: 2, ipn: 10, vych: 14, kor90: 25 },
  2024: { mrp: 3692, mzp: 85000, rate: 3, limit: 24038, opv: 10, opvr: 1.5, so: 3.5, vip: 5, oosms: 3, vosms: 2, ipn: 10, vych: 14, kor90: 25 },
  2025: { mrp: 3932, mzp: 85000, rate: 3, limit: 24038, opv: 10, opvr: 2.5, so: 3.5, vip: 5, oosms: 3, vosms: 2, ipn: 10, vych: 14, kor90: 25 },
  2026: { mrp: 4325, mzp: 85000, rate: 4, limit: 600000, opv: 10, opvr: 3.5, so: 3.5, vip: 5, oosms: 3, vosms: 2, ipn: 10, vych: 14, kor90: 25 },
  2027: { mrp: 4600, mzp: 85000, rate: 4, limit: 600000, opv: 10, opvr: 4,   so: 3.5, vip: 5, oosms: 3, vosms: 2, ipn: 10, vych: 14, kor90: 25 },
  2028: { mrp: 4900, mzp: 85000, rate: 4, limit: 600000, opv: 10, opvr: 5,   so: 3.5, vip: 5, oosms: 3, vosms: 2, ipn: 10, vych: 14, kor90: 25 },
};

const APPROX = [2027, 2028];

const REGIONS = {
  "г. Астана": [
    "6201 УГД по Алматинскому району",
    "6202 УГД по Сарыаркинскому району",
    "6203 УГД по Есильскому району",
    "6204 УГД по району Байконур",
    "6205 УГД по району Нура",
  ],
  "г. Алматы": [
    "6001 УГД по Алмалинскому району",
    "6002 УГД по Ауэзовскому району",
    "6003 УГД по Бостандыкскому району",
    "6004 УГД по Жетысускому району",
    "6005 УГД по Медеускому району",
    "6006 УГД по Турксибскому району",
    "6007 УГД по Наурызбайскому району",
    "6008 УГД по Алатаускому району",
  ],
  "г. Шымкент": [],
  "Абайская область": [],
  "Акмолинская область": [],
  "Актюбинская область": [],
  "Алматинская область": [],
  "Атырауская область": [],
  "Восточно-Казахстанская область": [],
  "Жамбылская область": [],
  "Жетысуская область": [],
  "Западно-Казахстанская область": [],
  "Карагандинская область": [],
  "Костанайская область": [],
  "Кызылординская область": [],
  "Мангистауская область": [],
  "Павлодарская область": [],
  "Северо-Казахстанская область": [],
  "Туркестанская область": [],
  "Улытауская область": [],
};

/* Реальные ставки, которые местные власти установили на 2026 год.
   Собрано из открытых бухгалтерских сайтов в августе 2026 года,
   это не официальный реестр решений, поэтому перед сдачей декларации
   стоит один раз сверить цифру в Кабинете налогоплательщика.

   Для городов и областей, где ставка одна на весь регион, число
   подставляется само. Для областей, где у главного города и у
   окрестных районов ставки разные, число не подставляется: лучше
   честно попросить проверить, чем угадать и ошибиться. */

const REGION_RATE_2026 = {
  "г. Астана": 3,
  "г. Алматы": 3,
  "г. Шымкент": 2,
  "Акмолинская область": 2,
  "Атырауская область": 2,
  "Восточно-Казахстанская область": 2,
  "Жамбылская область": 2,
  "Карагандинская область": 2,
  "Костанайская область": 3,
  "Кызылординская область": 2,
  "Павлодарская область": 3,
  "Северо-Казахстанская область": 3,
  "Туркестанская область": 2,
};

const REGION_RATE_VARIES = new Set([
  "Абайская область",
  "Алматинская область",
  "Актюбинская область",
  "Жетысуская область",
  "Западно-Казахстанская область",
  "Мангистауская область",
  "Улытауская область",
]);

const REGION_RATE_SOURCE_NOTE = "открытые данные, август 2026 года";

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

const TABS = [
  ["p-tit", "Общие данные"],
  ["p-main", "Форма 910.00"],
  ["p-app", "Приложение 910.01"],
  ["p-emp", "Работники"],
  ["p-par", "Параметры"],
  ["p-pay", "Итого к уплате"],
];

/* ===================== СОСТОЯНИЕ ===================== */

const LSK = "f910_v2";

let profiles = {};
let current = "Профиль 1";
let S = null;
let silent = false;

const blank = () => ({
  t: {
    iin: "",
    fio: "",
    year: 2026,
    period: 1,
    vid: "Очередная",
    region: "г. Астана",
    pens: false,
    inv: false,
    noopvr: false,
  },
  po: {},           // только параметры, изменённые вручную
  rateByRegion: {}, // пониженная ставка маслихата, своя для каждого региона
  p: {},
  income: [],
  soBase: [],
  opvBase: [],
  places: [
    { kno: "", city: "", street: "", house: "", flat: "", inc: 0, rate: null, red: 0 },
  ],
  emps: [],
});

function load() {
  try {
    profiles = JSON.parse(localStorage.getItem(LSK)) || {};
  } catch (e) {
    profiles = {};
  }

  if (!Object.keys(profiles).length) {
    profiles[current] = blank();
  }

  current = localStorage.getItem(LSK + "_cur") || Object.keys(profiles)[0];
  if (!profiles[current]) {
    current = Object.keys(profiles)[0];
  }

  S = profiles[current];
  if (!S.po) S.po = {};
  if (!S.rateByRegion) S.rateByRegion = {};

  // «Календарный год» больше не сдаётся, старое значение сбрасываем
  if (!S.t.period) S.t.period = 1;

  // раньше код УГД можно было выбрать из списка и одновременно вписать
  // вручную, теперь это одно поле, старые данные сводим в него же
  (S.places || []).forEach((p) => {
    if (!p.kno && p.knoManual) p.kno = p.knoManual;
    delete p.knoManual;
  });
}

/* Параметры года: значения из справочника + только ручные правки
   пользователя. Благодаря этому ставки, растущие по годам (в первую
   очередь ОПВР), при смене года всегда подтягиваются заново и не
   «залипают» из профиля. */

const PKEYS = [
  "mrp", "mzp", "rate", "limit", "opv", "opvr",
  "so", "vip", "oosms", "vosms", "ipn", "vych", "kor90",
];

function yearP(y) {
  return YEARS[y || S.t.year] || YEARS[2026];
}

function effP() {
  return Object.assign({}, yearP(), S.po);
}

function baseRate() {
  return effP().rate;
}

/* Известная ставка местных властей для выбранного региона. Данные
   собраны только на 2026 год, для остальных лет достоверных сведений
   нет, поэтому возвращаем пусто. */
function regionHint() {
  if (+S.t.year !== 2026) return null;
  const v = REGION_RATE_2026[S.t.region];
  return v === undefined ? null : v;
}

function regionRate() {
  const r = S.rateByRegion[S.t.region];
  if (r !== undefined && r !== null && r !== "") return num(r);

  const h = regionHint();
  return h !== null ? h : baseRate();
}

function persist() {
  profiles[current] = S;
  localStorage.setItem(LSK, JSON.stringify(profiles));
  localStorage.setItem(LSK + "_cur", current);
}

function saveNow() {
  persist();
  flash("Сохранено");
}

function flash(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 24px;
    background: #1b2530;
    color: #fff;
    padding: 8px 15px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 99;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ===================== ПРОФИЛИ ===================== */

function newProfile() {
  const name = prompt("Название профиля:");
  if (!name) return;

  profiles[name] = blank();
  current = name;
  S = profiles[name];
  persist();
  renderProfiles();
  bind();
  recalc();
}

function delProfile() {
  if (Object.keys(profiles).length < 2) {
    alert("Должен остаться хотя бы один профиль.");
    return;
  }
  if (!confirm(`Удалить профиль «${current}»?`)) return;

  delete profiles[current];
  current = Object.keys(profiles)[0];
  S = profiles[current];
  persist();
  renderProfiles();
  bind();
  recalc();
}

function renderProfiles() {
  const sel = document.getElementById("profileSel");
  sel.innerHTML = Object.keys(profiles)
    .map((n) => `<option ${n === current ? "selected" : ""}>${esc(n)}</option>`)
    .join("");

  sel.onchange = () => {
    current = sel.value;
    S = profiles[current];
    persist();
    bind();
    recalc();
  };
}

function exportJson() {
  const blob = new Blob(
    [JSON.stringify({ profile: current, data: S }, null, 2)],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "910_" + (S.t.iin || current).replace(/[^\wЀ-ӿ-]+/g, "_") + ".json";
  a.click();
}

function importJson(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const name = parsed.profile || `Импорт ${Object.keys(profiles).length + 1}`;

      profiles[name] = parsed.data || parsed;
      current = name;
      S = profiles[name];
      persist();
      renderProfiles();
      bind();
      recalc();
      flash("Импортировано: " + name);
    } catch (e) {
      alert("Не удалось прочитать файл.");
    }
  };
  reader.readAsText(file);
  input.value = "";
}

/* ===================== УТИЛИТЫ ===================== */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
  ));

const num = (v) => {
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
};

const pos = (v) => Math.max(0, num(v));

const fmt = (v) => Math.round(v || 0).toLocaleString("ru-RU");

const val = (id) => num(document.getElementById(id).value);

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

/* Полугодие: 1-е это месяцы 0..5, 2-е это месяцы 6..11 (индекс месяца
   внутри MONTHS). Каждая запись: {n: название, i: индекс месяца}. */
function months() {
  const period = +S.t.period;
  const start = period === 2 ? 6 : 0;
  return MONTHS.slice(start, start + 6).map((name, k) => ({
    n: name,
    i: start + k,
  }));
}

const nM = () => months().length;

function fit(arr, n, def) {
  arr = Array.isArray(arr) ? arr.slice() : [];
  while (arr.length < n) arr.push(def);
  return arr.slice(0, n);
}

function touch() {
  recalc();
}

/* ===================== ВКЛАДКИ ===================== */

function initTabs() {
  document.getElementById("tabs").innerHTML = TABS.map(([id, title], i) => (
    `<button class="${i === 0 ? "on" : ""}" data-p="${id}" onclick="go('${id}')">${title}</button>`
  )).join("");
}

function go(id) {
  document.querySelectorAll(".pane").forEach((p) => {
    p.classList.toggle("on", p.id === id);
  });
  document.querySelectorAll("#tabs button").forEach((b) => {
    b.classList.toggle("on", b.dataset.p === id);
  });
  window.scrollTo({ top: 0 });
}

/* ===================== РЕНДЕР ФОРМЫ ===================== */

function fRow(code, name, sub, valHtml, isCalc) {
  return `
    <div class="frow${isCalc ? " calc" : ""}">
      <div class="fcode">${code}</div>
      <div class="fname">${name}${sub ? `<i>${sub}</i>` : ""}</div>
      <div class="fval">${valHtml}</div>
    </div>
  `;
}

function roInput(id) {
  return `<input class="num" id="${id}" readonly>`;
}

/* Доход вводится в строке 910.00.001 и раскладывается по местам
   деятельности (в приложении 910.01 это колонка «Доход», графа H).
   При одном месте: один к одному, при нескольких: пропорционально
   уже введённым суммам. */
function spreadIncome(total) {
  const places = S.places;
  if (!places.length) return;

  if (places.length === 1) {
    places[0].inc = total;
  } else {
    const current = places.reduce((sum, p) => sum + num(p.inc), 0);

    if (current > 0) {
      let assigned = 0;
      places.forEach((p, i) => {
        if (i < places.length - 1) {
          const share = Math.round((total * num(p.inc)) / current);
          p.inc = share;
          assigned += share;
        } else {
          p.inc = Math.max(0, total - assigned);
        }
      });
    } else {
      places[0].inc = total;
      places.slice(1).forEach((p) => (p.inc = 0));
    }
  }

  renderPlaceCalc();
}

function renderMainRows() {
  document.getElementById("taxRows").innerHTML =
    fRow(
      "910.00.001",
      "Доход за налоговый период",
      `<span id="s001"></span>`,
      `<input class="num" id="v001" type="number" min="0" placeholder="0"
              oninput="spreadIncome(pos(this.value)); recalc()">`,
    ) +
    fRow(
      "910.00.002",
      "Сумма уменьшения дохода",
      "переносится из приложения 910.01, колонка «Уменьшение» (графа J)",
      roInput("v002"),
      true,
    ) +
    fRow(
      "910.00.003",
      "Доход с учётом уменьшения",
      "001 − 002",
      roInput("v003"),
      true,
    ) +
    fRow(
      "910.00.004",
      "Исчисленный ИПН к уплате",
      "сумма налога по местам деятельности, приложение 910.01, колонка «ИПН» (графа L)",
      roInput("v004"),
      true,
    );

  document.getElementById("socRows").innerHTML =
    monthBlock("910.00.005", "Доход для исчисления социальных отчислений", "soBase") +
    calcMonthBlock("910.00.006", "Социальные отчисления (СО)", "so") +
    monthBlock("910.00.007", "Доход для исчисления ОПВ и ОПВР", "opvBase") +
    calcMonthBlock("910.00.008", "Обязательные пенсионные взносы (ОПВ)", "opv") +
    calcMonthBlock(
      "910.00.009",
      "Обязательные пенсионные взносы работодателя (ОПВР)",
      "opvr",
      `<span id="opvrSub"></span>`,
    ) +
    calcMonthBlock("910.00.010", "Взносы на ОСМС (ВОСМС)", "vosms");
}

function monthBlock(code, name, key) {
  const ms = months();

  const cells = ms.map((m, i) => `
    <div class="mcell">
      <div class="rn">${ROMAN[i]}</div>
      <div class="mn">${m.n}</div>
      <input
        class="num"
        type="number"
        min="0"
        data-k="${key}"
        data-i="${i}"
        oninput="S.${key}[${i}] = pos(this.value); recalc()">
    </div>
  `).join("");

  const row = fRow(code, name, "", "").replace(
    '<div class="fval"></div>',
    `<div class="fval noprint">
       <button class="btn mini" onclick="fillMonths('${key}')">заполнить все</button>
     </div>`,
  );

  const total = `
    <div class="mgrid">
      ${cells}
      <div class="mcell tot">
        <div class="rn">${ROMAN[ms.length]}</div>
        <div class="mn">Итого</div>
        <input class="num" readonly id="tot_${key}">
      </div>
    </div>
  `;

  return row + total;
}

function calcMonthBlock(code, name, key, sub) {
  const ms = months();

  const cells = ms.map((m, i) => `
    <div class="mcell">
      <div class="rn">${ROMAN[i]}</div>
      <div class="mn">${m.n}</div>
      <input class="num" readonly id="c_${key}_${i}">
    </div>
  `).join("");

  const total = `
    <div class="mgrid">
      ${cells}
      <div class="mcell tot">
        <div class="rn">${ROMAN[ms.length]}</div>
        <div class="mn">Итого</div>
        <input class="num" readonly id="ctot_${key}">
      </div>
    </div>
  `;

  return fRow(code, name, sub || "", "") + total;
}

function fillMonths(key) {
  const n = nM();
  const first = S[key][0] || 0;
  S[key] = Array(n).fill(first);
  syncMonthInputs();
  recalc();
}

function syncMonthInputs() {
  ["soBase", "opvBase"].forEach((key) => {
    document.querySelectorAll(`[data-k="${key}"]`).forEach((input) => {
      const i = +input.dataset.i;
      input.value = S[key][i] || "";
    });
  });
}

/* ---- доход по месяцам (необязательный ввод) ---- */

function renderIncMonths() {
  const ms = months();

  const cells = ms.map((m, i) => `
    <div class="mcell">
      <div class="rn">${ROMAN[i]}</div>
      <div class="mn">${m.n}</div>
      <input
        class="num"
        type="number"
        min="0"
        value="${S.income[i] || ""}"
        oninput="S.income[${i}] = pos(this.value); recalc()">
    </div>
  `).join("");

  document.getElementById("incByMonth").innerHTML = `
    <details class="noprint" style="padding: 8px 12px; border-bottom: 1px solid var(--line2)">
      <summary style="cursor: pointer; font-size: 12px; color: var(--accent)">
        Ввести доход по месяцам (для сверки, в форму не переносится)
      </summary>
      <div class="mgrid" style="background: none; border: 0; padding: 10px 0 0">
        ${cells}
        <div class="mcell tot">
          <div class="rn">${ROMAN[ms.length]}</div>
          <div class="mn">Итого</div>
          <input class="num" readonly id="tot_income">
        </div>
      </div>
    </details>
  `;
}

/* ---- 910.01: места деятельности ---- */

/* Один список подсказок на регион (общий для всех строк): известные
   коды показываются при вводе, но само поле остаётся обычным текстовым
   полем, значение только одно, без риска, что выбор из списка и
   ручной ввод разойдутся между собой. */
function knoDatalist() {
  const list = REGIONS[S.t.region] || [];
  const options = list
    .map((x) => `<option value="${x.slice(0, 4)}">${esc(x)}</option>`)
    .join("");
  return `<datalist id="knoList">${options}</datalist>`;
}

function renderPlaces() {
  const places = S.places;

  const header = `
    <tr>
      <th style="width: 44px"><span class="col">A</span>№</th>
      <th style="width: 130px"><span class="col">B</span>Код УГД</th>
      <th class="l"><span class="col">C</span>Город / село</th>
      <th class="l"><span class="col">D</span>Улица</th>
      <th style="width: 86px"><span class="col">E</span>Дом</th>
      <th style="width: 96px"><span class="col">F</span>Кв./офис</th>
      <th style="width: 40px" class="noprint"></th>
    </tr>
  `;

  const rows = places.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="kno">
        <input
          list="knoList"
          maxlength="4"
          inputmode="numeric"
          placeholder="код"
          value="${esc(p.kno || "")}"
          oninput="this.value = this.value.replace(/\\D/g, '');
                   S.places[${i}].kno = this.value; recalc()">
      </td>
      <td class="l">
        <input value="${esc(p.city)}" oninput="S.places[${i}].city = this.value">
      </td>
      <td class="l">
        <input value="${esc(p.street)}" oninput="S.places[${i}].street = this.value">
      </td>
      <td>
        <input value="${esc(p.house)}" oninput="S.places[${i}].house = this.value">
      </td>
      <td>
        <input value="${esc(p.flat)}" oninput="S.places[${i}].flat = this.value">
      </td>
      <td class="noprint">
        ${places.length > 1 ? `<button class="btn del" onclick="delPlace(${i})">✕</button>` : ""}
      </td>
    </tr>
  `).join("");

  document.getElementById("placeTable").innerHTML = knoDatalist() + header + rows;
}

function renderPlaceCalc() {
  const places = S.places;
  const base = regionRate();
  const total = places.reduce((sum, p) => sum + num(p.inc), 0);

  const header = `
    <tr>
      <th style="width: 40px">№</th>
      <th style="width: 92px"><span class="col">G</span>Ставка %</th>
      <th><span class="col">H</span>Доход</th>
      <th style="width: 92px"><span class="col">I</span>Уд. вес %</th>
      <th><span class="col">J</span>Уменьшение</th>
      <th><span class="col">K</span>База ИПН</th>
      <th><span class="col">L</span>ИПН</th>
    </tr>
  `;

  const rows = places.map((p, i) => {
    const inc = num(p.inc);
    const red = num(p.red);
    const rate = p.rate == null || p.rate === "" ? base : num(p.rate);
    const weight = total ? (inc / total) * 100 : 0;
    const taxBase = Math.max(0, inc - red);
    const tax = Math.round((taxBase * rate) / 100);

    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <input
            class="num"
            type="number"
            step="0.1"
            min="0"
            value="${p.rate == null ? "" : p.rate}"
            placeholder="${base}"
            oninput="S.places[${i}].rate = this.value === '' ? null : pos(this.value);
                     recalc()">
        </td>
        <td>
          <input
            class="num"
            type="number"
            min="0"
            value="${p.inc || ""}"
            oninput="S.places[${i}].inc = pos(this.value); recalc()">
        </td>
        <td id="w_${i}">${weight.toFixed(2)}</td>
        <td>
          <input
            class="num"
            type="number"
            min="0"
            value="${p.red || ""}"
            oninput="S.places[${i}].red = pos(this.value); recalc()">
        </td>
        <td id="k_${i}">${fmt(taxBase)}</td>
        <td id="l_${i}">${fmt(tax)}</td>
      </tr>
    `;
  }).join("");

  const totalRow = `
    <tr class="tot">
      <td></td>
      <td></td>
      <td id="pH">${fmt(total)}</td>
      <td>100.00</td>
      <td id="pJ">0</td>
      <td id="pK">0</td>
      <td id="pL">0</td>
    </tr>
  `;

  document.getElementById("calcPlaceTable").innerHTML = header + rows + totalRow;
}

function addPlace() {
  S.places.push({
    kno: "", city: "", street: "", house: "", flat: "",
    inc: 0, rate: null, red: 0,
  });
  renderPlaces();
  renderPlaceCalc();
  recalc();
}

function delPlace(i) {
  S.places.splice(i, 1);
  renderPlaces();
  renderPlaceCalc();
  recalc();
}

/* ---- работники ---- */

function renderEmps() {
  const ms = months();
  S.emps.forEach((e) => (e.zp = fit(e.zp, ms.length, 0)));

  const box = document.getElementById("empList");
  if (!S.emps.length) {
    box.innerHTML = '<p class="hint">Работники не добавлены.</p>';
    return;
  }

  box.innerHTML = S.emps.map((e, i) => {
    const zpCells = ms.map((m, k) => `
      <td>
        <input
          class="num"
          type="number"
          min="0"
          style="min-width: 88px"
          value="${e.zp[k] || ""}"
          oninput="S.emps[${i}].zp[${k}] = pos(this.value); recalc()">
      </td>
    `).join("");

    const zpTotal = fmt(e.zp.reduce((a, b) => a + b, 0));

    return `
      <div class="card">
        <div class="grid g3">
          <div style="grid-column: span 2">
            <label class="f">Ф.И.О. работника ${i + 1}</label>
            <input value="${esc(e.fio)}" oninput="S.emps[${i}].fio = this.value">
          </div>
          <div>
            <label class="f">ИИН</label>
            <input
              maxlength="12"
              inputmode="numeric"
              value="${esc(e.iin)}"
              oninput="this.value = this.value.replace(/\\D/g, '');
                       S.emps[${i}].iin = this.value">
          </div>
        </div>

        <div class="row" style="margin: 8px 0 10px">
          <label class="chk">
            <input
              type="checkbox"
              ${e.vych ? "checked" : ""}
              onchange="S.emps[${i}].vych = this.checked; recalc()">
            Стандартный вычет 14 МРП
          </label>
          <label class="chk">
            <input
              type="checkbox"
              ${e.noOpvr ? "checked" : ""}
              onchange="S.emps[${i}].noOpvr = this.checked; recalc()">
            ОПВР не уплачивается
          </label>
          <span style="flex: 1"></span>
          <button class="btn mini noprint" onclick="copyZp(${i})">Оклад во все месяцы</button>
          <button class="btn del noprint" onclick="delEmp(${i})">✕</button>
        </div>

        <div class="tw">
          <table>
            <tr>
              <th class="l">Начислено</th>
              ${ms.map((m) => `<th>${m.n}</th>`).join("")}
              <th>Итого</th>
            </tr>
            <tr>
              <td class="l">Заработная плата</td>
              ${zpCells}
              <td style="font-weight: 600">${zpTotal}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }).join("");
}

function addEmp() {
  S.emps.push({ fio: "", iin: "", noOpvr: false, vych: true, zp: Array(nM()).fill(0) });
  renderEmps();
  recalc();
}

function delEmp(i) {
  S.emps.splice(i, 1);
  renderEmps();
  recalc();
}

function copyZp(i) {
  S.emps[i].zp = Array(nM()).fill(S.emps[i].zp[0] || 0);
  renderEmps();
  recalc();
}

/* ===================== РАСЧЁТ ===================== */

function ipExempt() {
  return S.t.pens || S.t.inv;
}

function calcIpMonth(soBase, opvBase, P) {
  const r = { so: 0, opv: 0, opvr: 0, vosms: 0 };
  if (ipExempt()) return r;

  if (soBase > 0) {
    r.so = Math.round((clamp(soBase, P.mzp, 7 * P.mzp) * P.so) / 100);
  }

  if (opvBase > 0) {
    r.opv = Math.round((clamp(opvBase, P.mzp, 50 * P.mzp) * P.opv) / 100);

    if (!S.t.noopvr && P.opvr > 0) {
      let object = Math.min(opvBase, 50 * P.mzp);
      if (P.opvrmin) object = Math.max(object, P.mzp);
      r.opvr = Math.round((object * P.opvr) / 100);
    }
  }

  r.vosms = Math.round((1.4 * P.mzp * P.vip) / 100);
  return r;
}

function calcEmpMonth(zp, e, P) {
  const r = { zp, opv: 0, vosms: 0, oosms: 0, so: 0, opvr: 0, ipn: 0 };
  if (zp <= 0) return r;

  r.opv = Math.round((Math.min(zp, 50 * P.mzp) * P.opv) / 100);
  r.vosms = Math.round((Math.min(zp, 10 * P.mzp) * P.vosms) / 100);
  r.oosms = Math.round((Math.min(zp, 10 * P.mzp) * P.oosms) / 100);
  r.so = Math.round((clamp(zp - r.opv, P.mzp, 7 * P.mzp) * P.so) / 100);

  if (!e.noOpvr && P.opvr > 0) {
    let object = Math.min(zp, 50 * P.mzp);
    if (P.opvrmin) object = Math.max(object, P.mzp);
    r.opvr = Math.round((object * P.opvr) / 100);
  }

  let taxBase = Math.max(0, zp - r.opv - r.vosms - (e.vych ? P.vych * P.mrp : 0));
  if (zp <= P.kor90 * P.mrp) taxBase *= 0.1;
  r.ipn = Math.round((taxBase * P.ipn) / 100);

  return r;
}

function recalc() {
  if (silent) return;

  /* --- титул в состояние --- */
  S.t.iin = document.getElementById("t_iin").value;
  S.t.fio = document.getElementById("t_fio").value;
  S.t.vid = document.getElementById("t_vid").value;
  S.t.pens = document.getElementById("f_pens").checked;
  S.t.inv = document.getElementById("f_inv").checked;
  S.t.noopvr = document.getElementById("f_noopvr").checked;

  const P = effP();
  P.opvrmin = !!S.po.opvrmin;
  S.p = P;

  renderRateNote();
  renderOpvrScale(P);

  const opvrSub = document.getElementById("opvrSub");
  if (opvrSub) {
    const prevYear = YEARS[+S.t.year - 1];
    let text = `ставка ${P.opvr} % на ${S.t.year} год`;
    if (prevYear && prevYear.opvr > 0) {
      text += ` · в ${+S.t.year - 1} году было ${prevYear.opvr} %`;
    }
    if (S.t.noopvr) text += " · освобождён";
    opvrSub.textContent = text;
  }

  const n = nM();
  S.income = fit(S.income, n, 0);
  S.soBase = fit(S.soBase, n, 0);
  S.opvBase = fit(S.opvBase, n, 0);

  /* --- 910.01: места деятельности --- */
  let sumH = 0;
  let sumJ = 0;
  let sumK = 0;
  let sumL = 0;
  const regionalRate = regionRate();

  const rows = S.places.map((p) => {
    const inc = num(p.inc);
    const red = num(p.red);
    const rate = p.rate == null || p.rate === "" ? regionalRate : num(p.rate);
    const taxBase = Math.max(0, inc - red);
    const tax = Math.round((taxBase * rate) / 100);

    sumH += inc;
    sumJ += red;
    sumK += taxBase;
    sumL += tax;

    return { inc, k: taxBase, l: tax };
  });

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt(v);
  };

  // ячейки строк обновляем точечно, чтобы не перерисовывать таблицу
  // и не терять фокус
  rows.forEach((row, i) => {
    const weightEl = document.getElementById("w_" + i);
    if (weightEl) weightEl.textContent = (sumH ? (row.inc / sumH) * 100 : 0).toFixed(2);
    setText("k_" + i, row.k);
    setText("l_" + i, row.l);
  });

  const totalHEl = document.getElementById("pH");
  if (totalHEl) totalHEl.textContent = fmt(sumH);
  setText("pJ", sumJ);
  setText("pK", sumK);
  setText("pL", sumL);

  /* --- 910.00, раздел 1 --- */
  const setValue = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = fmt(v);
  };

  // 001 это поле ввода: не перезаписываем, пока в нём курсор
  const v001 = document.getElementById("v001");
  if (v001 && v001 !== document.activeElement) v001.value = sumH || "";

  setValue("v002", sumJ);
  setValue("v003", Math.max(0, sumH - sumJ));
  setValue("v004", sumL);

  const s001 = document.getElementById("s001");
  if (s001) {
    s001.textContent = S.places.length > 1
      ? `распределяется по ${S.places.length} местам деятельности в приложении ` +
        `910.01 (колонка «Доход», графа H): ` +
        S.places.map((p, i) => `№${i + 1}: ${fmt(num(p.inc))} ₸`).join(", ")
      : "при нескольких местах деятельности сумма распределяется в приложении 910.01";
  }

  const incByMonth = S.income.reduce((a, b) => a + b, 0);
  setValue("tot_income", incByMonth);

  document.getElementById("taxWarn").innerHTML =
    incByMonth > 0 && Math.round(incByMonth) !== Math.round(sumH)
      ? `<div class="msg w">
           Помесячный доход (${fmt(incByMonth)} ₸) не совпадает с суммой по местам
           деятельности (${fmt(sumH)} ₸). В форму 910.00 переносится сумма по местам.
         </div>`
      : "";

  /* --- предельный доход --- */
  const limit = P.limit * P.mrp;
  document.getElementById("parNote").innerHTML =
    sumH > limit
      ? `<div class="msg e">
           <b>Предельный доход превышен.</b> ${fmt(sumH)} ₸ больше лимита ${fmt(limit)} ₸,
           поэтому право на упрощённую декларацию утрачивается.
         </div>`
      : `<div class="msg i">
           Предельный доход за период: <b>${fmt(limit)} ₸</b>
           (${fmt(P.limit)} МРП × ${fmt(P.mrp)} ₸).
           Использовано ${limit ? ((sumH / limit) * 100).toFixed(1) : 0} %.
         </div>`;

  /* --- 910.00, раздел 2: соцплатежи ИП --- */
  const ipByMonth = months().map((m, i) => calcIpMonth(S.soBase[i] || 0, S.opvBase[i] || 0, P));
  const ipTotal = { so: 0, opv: 0, opvr: 0, vosms: 0 };

  ipByMonth.forEach((row, i) => {
    ["so", "opv", "opvr", "vosms"].forEach((key) => {
      ipTotal[key] += row[key];
      const cell = document.getElementById(`c_${key}_${i}`);
      if (cell) cell.value = fmt(row[key]);
    });
  });

  ["so", "opv", "opvr", "vosms"].forEach((key) => {
    const el = document.getElementById("ctot_" + key);
    if (el) el.value = fmt(ipTotal[key]);
  });

  setValue("tot_soBase", S.soBase.reduce((a, b) => a + b, 0));
  setValue("tot_opvBase", S.opvBase.reduce((a, b) => a + b, 0));

  /* --- работники --- */
  const ms = months();
  const perMonth = ms.map((m, i) => {
    const totals = { zp: 0, opv: 0, vosms: 0, oosms: 0, so: 0, opvr: 0, ipn: 0, cnt: 0 };

    S.emps.forEach((e) => {
      const zp = e.zp[i] || 0;
      const row = calcEmpMonth(zp, e, P);
      Object.keys(totals).forEach((key) => {
        if (key !== "cnt") totals[key] += row[key] || 0;
      });
      if (zp > 0) totals.cnt++;
    });

    return totals;
  });

  const empTotals = perMonth.reduce((acc, month) => {
    Object.keys(acc).forEach((key) => (acc[key] += month[key]));
    return acc;
  }, { zp: 0, opv: 0, vosms: 0, oosms: 0, so: 0, opvr: 0, ipn: 0, cnt: 0 });

  const avgCount = n ? empTotals.cnt / n : 0;
  const avgSalary = avgCount > 0 ? empTotals.zp / avgCount / n : 0;

  document.getElementById("empSum").innerHTML = S.emps.length ? `
    <div class="grid g4" style="margin-top: 14px">
      <div>
        <label class="f">Фонд оплаты труда</label>
        <input readonly class="num" value="${fmt(empTotals.zp)} ₸">
      </div>
      <div>
        <label class="f">Среднесписочная численность</label>
        <input readonly class="num" value="${avgCount.toFixed(2)}">
      </div>
      <div>
        <label class="f">Среднемесячная ЗП</label>
        <input readonly class="num" value="${fmt(avgSalary)} ₸">
      </div>
      <div>
        <label class="f">ИПН у источника</label>
        <input readonly class="num" value="${fmt(empTotals.ipn)} ₸">
      </div>
    </div>
  ` : "";

  document.getElementById("empMonths").innerHTML = S.emps.length ? `
    <h3 class="sec">Помесячная расшифровка</h3>
    <div class="tw">
      <table>
        <tr>
          <th class="l">Месяц</th>
          <th>Чел.</th><th>ФОТ</th><th>ОПВ</th><th>ОПВР</th>
          <th>ВОСМС</th><th>ООСМС</th><th>СО</th><th>ИПН</th>
        </tr>
        ${ms.map((m, i) => {
          const a = perMonth[i];
          return `
            <tr>
              <td class="l">${m.n}</td>
              <td>${a.cnt}</td>
              <td>${fmt(a.zp)}</td>
              <td>${fmt(a.opv)}</td>
              <td>${fmt(a.opvr)}</td>
              <td>${fmt(a.vosms)}</td>
              <td>${fmt(a.oosms)}</td>
              <td>${fmt(a.so)}</td>
              <td>${fmt(a.ipn)}</td>
            </tr>
          `;
        }).join("")}
        <tr class="tot">
          <td class="l">Итого</td>
          <td>${avgCount.toFixed(2)}</td>
          <td>${fmt(empTotals.zp)}</td>
          <td>${fmt(empTotals.opv)}</td>
          <td>${fmt(empTotals.opvr)}</td>
          <td>${fmt(empTotals.vosms)}</td>
          <td>${fmt(empTotals.oosms)}</td>
          <td>${fmt(empTotals.so)}</td>
          <td>${fmt(empTotals.ipn)}</td>
        </tr>
      </table>
    </div>
  ` : "";

  /* --- итого к уплате --- */
  const main = [
    ["101202", "ИПН по упрощённой декларации (910.00.004)", sumL],
    ["901101", "Обязательные пенсионные взносы за ИП (910.00.008)", ipTotal.opv],
    ["901103", "ОПВР за ИП (910.00.009)", ipTotal.opvr],
    ["902101", "Социальные отчисления за ИП (910.00.006)", ipTotal.so],
    ["904102", "Взносы на ОСМС за ИП (910.00.010)", ipTotal.vosms],
  ];
  const mainTotal = main.reduce((sum, row) => sum + row[2], 0);

  const paymentRow = (row) => `
    <tr>
      <td class="l" style="color: var(--accent); font-weight: 600">${row[0]}</td>
      <td class="l">${row[1]}</td>
      <td>${fmt(row[2])}</td>
    </tr>
  `;

  document.getElementById("payMain").innerHTML =
    `<tr><th class="l" style="width: 80px">КБК</th><th class="l">Платёж</th><th style="width: 150px">Сумма, ₸</th></tr>` +
    main.map(paymentRow).join("") +
    `<tr class="tot"><td></td><td class="l">Итого по форме 910.00</td><td>${fmt(mainTotal)}</td></tr>`;

  const emp = [
    ["101201", "ИПН, удержанный с зарплаты работников", empTotals.ipn],
    ["901101", "ОПВ за работников", empTotals.opv],
    ["901103", "ОПВР за работников", empTotals.opvr],
    ["902101", "Социальные отчисления за работников", empTotals.so],
    ["904101", "Отчисления на ОСМС (работодатель)", empTotals.oosms],
    ["904102", "Взносы на ОСМС, удержанные у работников", empTotals.vosms],
  ];
  const empTotal = emp.reduce((sum, row) => sum + row[2], 0);

  document.getElementById("payEmp").innerHTML =
    `<tr><th class="l" style="width: 80px">КБК</th><th class="l">Платёж</th><th style="width: 150px">Сумма, ₸</th></tr>` +
    emp.map(paymentRow).join("") +
    `<tr class="tot"><td></td><td class="l">Итого за работников</td><td>${fmt(empTotal)}</td></tr>`;

  /* --- шапка и сроки --- */
  const year = +S.t.year;
  const period = +S.t.period;
  const per = period === 2 ? `2 полугодие ${year}` : `1 полугодие ${year}`;
  const due = period === 2 ? `15 февраля ${year + 1}` : `15 августа ${year}`;
  const payDue = period === 2 ? `25 февраля ${year + 1}` : `25 августа ${year}`;

  document.getElementById("mPeriod").textContent = per;
  document.getElementById("mWho").textContent =
    (S.t.fio || "не указан") + (S.t.iin ? " · " + S.t.iin : "");

  const rates = [...new Set(
    S.places.map((p) => (p.rate == null || p.rate === "" ? regionalRate : num(p.rate))),
  )];
  document.getElementById("mRate").textContent = rates.join(" / ") + " %";
  document.getElementById("mDue").textContent = due;

  document.getElementById("dueNote").innerHTML = `
    <div class="msg i">
      Декларация подаётся до <b>${due}</b>, уплата до <b>${payDue}</b>.
      Если срок выпадает на выходной, он переносится на следующий рабочий день.
      Коды КБК приведены справочно, сверьте их в Кабинете налогоплательщика.
    </div>
  `;

  document.getElementById("sumBar").innerHTML = `
    <div class="it big"><span>ИПН по 910.00</span><b>${fmt(sumL)} ₸</b></div>
    <div class="it">
      <span>Соцплатежи ИП</span>
      <b>${fmt(ipTotal.opv + ipTotal.opvr + ipTotal.so + ipTotal.vosms)} ₸</b>
    </div>
    <div class="it"><span>Итого по 910.00</span><b>${fmt(mainTotal)} ₸</b></div>
    ${S.emps.length ? `
      <div class="it"><span>За работников (200.00)</span><b>${fmt(empTotal)} ₸</b></div>
    ` : ""}
    <span style="flex: 1"></span>
    <div class="it"><span>Всего к уплате</span><b>${fmt(mainTotal + empTotal)} ₸</b></div>
  `;

  document.getElementById("placeWarn").innerHTML = S.places.some((p) => !p.kno)
    ? `<div class="msg w">Не у всех мест деятельности указан код УГД (графа B).</div>`
    : "";

  persist();
}

/* ===================== ГОД / ПАРАМЕТРЫ ===================== */

function resetYearParams() {
  S.po = {};
  syncParams();
  recalc();
}

function syncParams() {
  const effective = effP();
  PKEYS.forEach((key) => {
    const el = document.getElementById("p_" + key);
    if (el) el.value = effective[key];
  });
}

/* ---- аннотация к ставке налога по региону ---- */
function renderRateNote() {
  const base = baseRate();
  const rate = regionRate();
  const raw = S.rateByRegion[S.t.region];
  const isCustom = raw !== undefined && raw !== null && raw !== "";
  const hint = regionHint();
  const varies = +S.t.year === 2026 && REGION_RATE_VARIES.has(S.t.region);

  const baseEl = document.getElementById("t_rate_base");
  if (baseEl) baseEl.value = base + " %";

  const srcEl = document.getElementById("t_rate_src");
  if (srcEl) {
    srcEl.value = isCustom
      ? "Вписана вручную"
      : hint !== null
        ? "Подставлена автоматически"
        : "Базовая ставка (данных по региону нет)";
  }

  const changed = Object.entries(S.rateByRegion)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([region, v]) => `${esc(region)}: ${v} %`);

  let body;
  let cls;

  if (isCustom) {
    cls = "i";
    body = `
      Ставка ${rate} % для региона «${esc(S.t.region)}» задана вручную
      (базовая ставка года: ${base} %).
    `;
  } else if (hint !== null) {
    cls = "g";
    body = `
      Ставка местных органов на ${S.t.year} год: <b>${rate} %</b>
      вместо базовой ${base} % (${REGION_RATE_SOURCE_NOTE}).
      Перед оплатой сверьте её в Кабинете налогоплательщика.
    `;
  } else if (varies) {
    cls = "w";
    body = `
      В этом регионе ставка различается по городам и районам (обычно 2–3 %).
      Применена базовая ставка ${base} %.
      Уточните действующую ставку в Кабинете налогоплательщика.
    `;
  } else {
    cls = "w";
    body = `
      Данных о решении местных органов для этого региона или года нет.
      Применена базовая ставка ${base} %.
      Уточните действующую ставку в Кабинете налогоплательщика.
    `;
  }

  const el = document.getElementById("rateNote");
  if (!el) return;

  el.innerHTML = `
    <div class="msg ${cls}">
      ${body}
      ${changed.length ? `<br>Заданы вручную: ${changed.join("; ")}.` : ""}
      Ставка по отдельному месту деятельности задаётся в графе «Ставка» приложения 910.01.
    </div>
  `;
}

/* ---- шкала ежегодного роста ОПВР ---- */
function renderOpvrScale(P) {
  const el = document.getElementById("opvrScale");
  if (!el) return;

  const years = Object.keys(YEARS).map(Number).filter((y) => YEARS[y].opvr > 0).sort();
  const currentYear = +S.t.year;
  const prevYear = currentYear - 1;
  const currentRate = YEARS[currentYear] ? YEARS[currentYear].opvr : 0;
  const previousRate = YEARS[prevYear] ? YEARS[prevYear].opvr : null;
  const isManual = S.po.opvr !== undefined;

  const delta = previousRate !== null && currentRate > previousRate
    ? `<span class="delta">+${(currentRate - previousRate).toFixed(1)} п.п. к ${prevYear} году</span>`
    : "";

  const scale = years.map((y) => `
    <div class="y ${y === currentYear ? "now" : y > currentYear ? "fut" : ""}">
      <em>${y}${APPROX.includes(y) ? " (прогноз)" : ""}</em>
      <b>${YEARS[y].opvr} %</b>
    </div>
  `).join("");

  el.innerHTML = `
    <div class="msg i" style="margin-bottom: 0">
      Ставка ОПВР на ${currentYear} год: <b>${currentRate} %</b>${delta}.
      Устанавливается законом отдельно на каждый год.
      ${isManual ? `
        <br>Задано вручную: ${P.opvr} % вместо ${currentRate} %.
        Кнопка «Вернуть значения года» восстановит расчётное значение.
      ` : ""}
    </div>
    <div class="scale">${scale}</div>
  `;
}

function setRate(v) {
  if (v === null) {
    delete S.rateByRegion[S.t.region];
  } else {
    S.rateByRegion[S.t.region] = v;
  }
  document.getElementById("t_rate").value = regionRate();
  renderPlaceCalc();
  recalc();
}

/* ===================== ПРИВЯЗКА ===================== */

function bind() {
  silent = true;

  document.getElementById("t_iin").value = S.t.iin || "";
  document.getElementById("t_fio").value = S.t.fio || "";
  document.getElementById("t_year").value = S.t.year || 2026;

  if (!S.t.period) S.t.period = 1;
  document.getElementById("t_period").value = String(S.t.period);

  document.getElementById("t_vid").value = S.t.vid || "Очередная";
  document.getElementById("t_region").value = S.t.region || "г. Астана";
  document.getElementById("f_pens").checked = !!S.t.pens;
  document.getElementById("f_inv").checked = !!S.t.inv;
  document.getElementById("f_noopvr").checked = !!S.t.noopvr;

  if (!S.po) S.po = {};
  if (!S.rateByRegion) S.rateByRegion = {};

  syncParams();
  document.getElementById("t_rate").value = regionRate();
  document.getElementById("p_opvrmin").checked = !!S.po.opvrmin;

  silent = false;
  renderAll();
}

function renderAll() {
  const n = nM();
  S.income = fit(S.income, n, 0);
  S.soBase = fit(S.soBase, n, 0);
  S.opvBase = fit(S.opvBase, n, 0);

  renderMainRows();
  renderIncMonths();
  syncMonthInputs();
  renderPlaces();
  renderPlaceCalc();
  renderEmps();
  recalc();
}

/* ===================== ЗАПУСК ===================== */

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("t_year").innerHTML = Object.keys(YEARS)
    .map((y) => `<option value="${y}">${y}${APPROX.includes(+y) ? " (прогноз)" : ""}</option>`)
    .join("");

  document.getElementById("t_region").innerHTML = Object.keys(REGIONS)
    .map((r) => `<option>${esc(r)}</option>`)
    .join("");

  initTabs();
  load();
  renderProfiles();
  bind();

  document.getElementById("t_year").onchange = (e) => {
    S.t.year = +e.target.value;
    S.po = {}; // ставки года (МРП, МЗП, ОПВР…) подтягиваются заново
    syncParams();
    document.getElementById("t_rate").value = regionRate();
    renderAll();
  };

  document.getElementById("t_period").onchange = (e) => {
    S.t.period = +e.target.value;
    renderAll();
  };

  document.getElementById("t_region").onchange = (e) => {
    S.t.region = e.target.value;
    S.places.forEach((p) => (p.kno = "")); // код УГД привязан к региону
    document.getElementById("t_rate").value = regionRate();
    renderPlaces();
    renderPlaceCalc();
    recalc();
  };

  document.getElementById("t_rate").addEventListener("input", (e) => {
    const value = pos(e.target.value);
    const auto = regionHint() !== null ? regionHint() : baseRate();

    if (e.target.value === "" || Math.abs(value - auto) < 1e-9) {
      delete S.rateByRegion[S.t.region];
    } else {
      S.rateByRegion[S.t.region] = value;
    }

    renderPlaceCalc();
    recalc();
  });

  PKEYS.forEach((key) => {
    const el = document.getElementById("p_" + key);
    el.addEventListener("input", () => {
      const value = num(el.value);
      const yearValue = yearP()[key];

      // храним только ручные правки
      if (el.value === "" || value === yearValue) {
        delete S.po[key];
      } else {
        S.po[key] = value;
      }

      recalc();
      renderPlaceCalc();
    });
  });

  document.getElementById("p_opvrmin").addEventListener("change", (e) => {
    if (e.target.checked) {
      S.po.opvrmin = true;
    } else {
      delete S.po.opvrmin;
    }
    recalc();
  });

  setInterval(persist, 15000);
});
