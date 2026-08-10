// ============================================================
// КОНФИГ КАФЕ — поменяйте ссылки и контакты здесь
// ============================================================
const CONFIG = {
  telegram: "https://t.me/uyut_cafe",          // ссылка на чат-бота Telegram
  vk: "https://vk.com/uyut_cafe",              // ссылка на сообщество VK
  phone: "+7 (999) 123-45-67",
  phoneHref: "+79991234567",
  address: "г. Москва, ул. Уютная, д. 7",
  hours: "Пн–Вс · 09:00–22:00",
  deadlineDays: 1                              // дедлайн спецпредложения (в днях)
};

// ============================================================
// УТИЛИТЫ
// ============================================================
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmt = n => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

function toast(message, type = "success") {
  const box = $("#toast-box");
  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.innerHTML = `<span class="toast__icon">${type === "success" ? "✓" : "!"}</span><span>${message}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add("toast--show"));
  setTimeout(() => {
    t.classList.remove("toast--show");
    setTimeout(() => t.remove(), 400);
  }, 4200);
}

// ============================================================
// HERO-СЛАЙДЕР: затемнённый экран, фото внутри/снаружи,
// плавно подтягивается из глубины (ken-burns) на весь экран
// ============================================================
const slides = $$(".hero-slide");
let slideIndex = 0;
let slideTimer;

function showSlide(i) {
  slides.forEach((s, idx) => {
    const active = idx === i;
    s.classList.toggle("is-active", active);
    const media = s.querySelector(".hero-slide__media");
    if (media) {
      media.classList.remove("is-zoom");
      if (active) requestAnimationFrame(() => media.classList.add("is-zoom"));
    }
  });
}

function nextSlide() { slideIndex = (slideIndex + 1) % slides.length; showSlide(slideIndex); }
function restartSlideTimer() {
  clearInterval(slideTimer);
  slideTimer = setInterval(nextSlide, 7000);
}
restartSlideTimer();

$$(".hero__dot").forEach((dot, i) => dot.addEventListener("click", () => {
  slideIndex = i; showSlide(slideIndex); restartSlideTimer();
}));
$$(".hero__arrow").forEach(btn => btn.addEventListener("click", () => {
  slideIndex = btn.classList.contains("is-prev")
    ? (slideIndex - 1 + slides.length) % slides.length
    : (slideIndex + 1) % slides.length;
  showSlide(slideIndex); restartSlideTimer();
}));

// Плавный параллакс фона при скролле
window.addEventListener("scroll", () => {
  const hero = $("#hero");
  if (!hero) return;
  const y = window.scrollY;
  if (y < window.innerHeight) hero.style.transform = `translateY(${y * 0.22}px)`;
}, { passive: true });

// ============================================================
// ШАПКА: фон при скролле, бургер-меню, прогресс чтения
// ============================================================
const header = $("#header");
window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 30);
  const h = document.documentElement;
  const pct = window.scrollY / (h.scrollHeight - h.clientHeight);
  $("#read-progress").style.transform = `scaleX(${pct})`;
}, { passive: true });

const burger = $("#burger");
const navMenu = $("#nav-menu");
burger.addEventListener("click", () => {
  burger.classList.toggle("is-open");
  navMenu.classList.toggle("is-open");
  document.body.classList.toggle("no-scroll", navMenu.classList.contains("is-open"));
});
$$(".nav__link, .nav__cta").forEach(el => el.addEventListener("click", () => {
  burger.classList.remove("is-open");
  navMenu.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}));

// ============================================================
// ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ
// ============================================================
$$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const id = a.getAttribute("href");
  if (id.length < 2) return;
  const target = $(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}));

// ============================================================
// REVEAL-АНИМАЦИИ ПРИ ПОЯВЛЕНИИ (IntersectionObserver)
// ============================================================
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.14 });
$$("[data-reveal]").forEach(el => io.observe(el));

// Счётчики цифр
const counters = $$("[data-count]");
const cio = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const dur = 1400;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    cio.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(el => cio.observe(el));

// ============================================================
// МЕНЮ: рендер из menu.js, табы категорий
// ============================================================
const menuGrid = $("#menu-grid");
let activeCat = CATEGORIES[0];

function menuCard(item) {
  return `
  <article class="menu-card" data-reveal>
    <div class="menu-card__media">
      <img src="images/dishes/fallback.svg" data-slug="${item.img || ""}" alt="${item.name}" loading="lazy">
      ${item.badge ? `<span class="menu-card__badge">${item.badge}</span>` : ""}
      ${item.tag ? `<span class="menu-card__tag">${item.tag}</span>` : ""}
    </div>
    <div class="menu-card__body">
      <div class="menu-card__head">
        <h3 class="menu-card__name">${item.name}</h3>
        <span class="menu-card__price">${fmt(item.price)}</span>
      </div>
      <p class="menu-card__desc">${item.desc}</p>
    </div>
  </article>`;
}

// Умная подстановка фото: если реальный .jpg существует — подставляем его,
// иначе остаётся уютная подложка. Позволяет просто положить файлы в images/.
function upgradeDishPhoto(card) {
  const img = $("img", card);
  const slug = img && img.dataset.slug;
  if (!slug) return;
  const probe = new Image();
  probe.onload = () => { if (img && !img.dataset.loaded) { img.src = probe.src; img.dataset.loaded = "1"; } };
  probe.onerror = () => {};
  probe.src = `images/dishes/${slug}.jpg`;
}

function upgradeHeroPhoto(img) {
  const probe = new Image();
  probe.onload = () => { img.src = probe.src; };
  probe.onerror = () => {};
  probe.src = img.dataset.photo;
}
$$(".hero-slide__media img[data-photo]").forEach(upgradeHeroPhoto);
$$("img[data-photo]:not(.hero-slide__media img)").forEach(upgradeHeroPhoto);

function renderMenu(cat) {
  menuGrid.innerHTML = "";
  MENU[cat].forEach(item => {
    const wrap = document.createElement("div");
    wrap.innerHTML = menuCard(item).trim();
    const card = wrap.firstElementChild;
    menuGrid.appendChild(card);
    io.observe(card);
    upgradeDishPhoto(card);
  });
}

function renderTabs() {
  const tabs = $("#menu-tabs");
  tabs.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const b = document.createElement("button");
    b.className = "menu-tab" + (cat === activeCat ? " is-active" : "");
    b.textContent = cat;
    b.addEventListener("click", () => {
      activeCat = cat;
      $$(".menu-tab", tabs).forEach(t => t.classList.toggle("is-active", t === b));
      renderMenu(cat);
    });
    tabs.appendChild(b);
  });
}
renderTabs();
renderMenu(activeCat);

// ============================================================
// ВИТРИНА ВКУСА — «липкий взгляд»: блюдо следует за курсором
// ============================================================
const scStage = $("#showcase-stage");
const scCard = $("#showcase-card");
const scImg = $("#showcase-img");
const scBadge = $("#showcase-badge");
const scCatLbl = $("#showcase-cat");
const scName = $("#showcase-name");
const scDesc = $("#showcase-desc");
const scStory = $("#showcase-story");
const scWeight = $("#showcase-weight");
const scPrice = $("#showcase-price");
const scDots = $("#showcase-dots");
const scTabs = $("#showcase-tabs");

let scCatIdx = 0;
let scIdx = 0;

function scItems() { return MENU[CATEGORIES[scCatIdx]]; }

function scRender() {
  const items = scItems();
  scIdx = Math.min(scIdx, items.length - 1);
  const it = items[scIdx];
  scName.textContent = it.name;
  scCatLbl.textContent = CATEGORIES[scCatIdx];
  scDesc.textContent = it.desc;
  scStory.textContent = it.story || "";
  scStory.style.display = it.story ? "" : "none";
  scWeight.textContent = it.tag || "";
  scPrice.textContent = fmt(it.price);
  scBadge.textContent = it.badge || "";
  scBadge.style.display = it.badge ? "" : "none";
  scImg.alt = it.name;
  delete scImg.dataset.loaded;
  scImg.src = "images/dishes/fallback.svg";
  scImg.dataset.slug = it.img || "";
  upgradeDishPhoto(scCard);
  scDots.innerHTML = "";
  items.forEach((_, i) => {
    const d = document.createElement("button");
    d.className = "showcase-dot" + (i === scIdx ? " is-active" : "");
    d.setAttribute("aria-label", "Блюдо " + (i + 1));
    d.addEventListener("click", () => { scIdx = i; scSwitch(); });
    scDots.appendChild(d);
  });
}

function scSwitch() {
  scCard.classList.add("is-out");
  setTimeout(() => { scRender(); scCard.classList.remove("is-out"); }, 240);
}

CATEGORIES.forEach((cat, i) => {
  const b = document.createElement("button");
  b.className = "showcase-tab" + (i === scCatIdx ? " is-active" : "");
  b.textContent = cat;
  b.addEventListener("click", () => {
    scCatIdx = i; scIdx = 0;
    $$(".showcase-tab", scTabs).forEach(t => t.classList.toggle("is-active", t === b));
    scSwitch();
  });
  scTabs.appendChild(b);
});

$("[data-sc-prev]", scStage).addEventListener("click", () => {
  scIdx = (scIdx - 1 + scItems().length) % scItems().length; scSwitch();
});
$("[data-sc-next]", scStage).addEventListener("click", () => {
  scIdx = (scIdx + 1) % scItems().length; scSwitch();
});

function scMove(x, y) {
  const r = scCard.getBoundingClientRect();
  scStage.style.setProperty("--mx", ((x - r.left) / r.width - 0.5).toFixed(3));
  scStage.style.setProperty("--my", ((y - r.top) / r.height - 0.5).toFixed(3));
}
scStage.addEventListener("mousemove", e => {
  scCard.classList.add("is-hover");
  scMove(e.clientX, e.clientY);
});
scStage.addEventListener("mouseleave", () => {
  scCard.classList.remove("is-hover");
  scStage.style.setProperty("--mx", 0);
  scStage.style.setProperty("--my", 0);
});
const scWrap = $("#showcase");
if (scWrap) {
  scWrap.addEventListener("mouseenter", () => scStage.classList.add("is-captured"));
  scWrap.addEventListener("mouseleave", () => scStage.classList.remove("is-captured"));
}

let scTouchX = null, scTouchY = null, scTapT = 0;
scStage.addEventListener("touchstart", e => {
  scStage.classList.add("is-touch");
  scTouchX = e.touches[0].clientX;
  scTouchY = e.touches[0].clientY;
  scTapT = Date.now();
}, { passive: true });
scStage.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - scTouchX;
  const dy = e.changedTouches[0].clientY - scTouchY;
  if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
    dx < 0 ? $("[data-sc-next]", scStage).click() : $("[data-sc-prev]", scStage).click();
  } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - scTapT < 300) {
    scCard.classList.toggle("is-hover");
  }
}, { passive: true });

scRender();

// ============================================================
// ОТЗЫВЫ: автослайдер
// ============================================================
const reviews = $$(".review");
let revIdx = 0;
function showReview(i) {
  reviews.forEach((r, idx) => {
    r.classList.toggle("is-active", idx === i);
    if (idx === i) r.classList.remove("is-in"), requestAnimationFrame(() => r.classList.add("is-in"));
  });
  $$(".review-dot").forEach((d, idx) => d.classList.toggle("is-active", idx === i));
}
setInterval(() => { revIdx = (revIdx + 1) % reviews.length; showReview(revIdx); }, 6500);
$$(".review-dot").forEach((d, i) => d.addEventListener("click", () => { revIdx = i; showReview(i); }));

// ============================================================
// FAQ-АККОРДЕОН
// ============================================================
$$(".faq__item").forEach(item => {
  const q = $(".faq__q", item);
  q.addEventListener("click", () => {
    const open = item.classList.contains("is-open");
    $$(".faq__item").forEach(i => i.classList.remove("is-open"));
    if (!open) item.classList.add("is-open");
  });
});

// ============================================================
// ТАЙМЕР СПЕЦПРЕДЛОЖЕНИЯ (дедлайн — в localStorage)
// ============================================================
const KEY_DEADLINE = "uyut_deadline";
function getDeadline() {
  let d = localStorage.getItem(KEY_DEADLINE);
  if (!d || new Date(d).getTime() < Date.now()) {
    d = new Date(Date.now() + CONFIG.deadlineDays * 864e5).toISOString();
    localStorage.setItem(KEY_DEADLINE, d);
  }
  return new Date(d).getTime();
}
const deadline = getDeadline();
function tickTimer() {
  const diff = Math.max(deadline - Date.now(), 0);
  const h = Math.floor(diff / 36e5);
  const m = Math.floor(diff % 36e5 / 6e4);
  const s = Math.floor(diff % 6e4 / 1e3);
  const pad = n => String(n).padStart(2, "0");
  $$("[data-timer-h]").forEach(el => el.textContent = pad(h));
  $$("[data-timer-m]").forEach(el => el.textContent = pad(m));
  $$("[data-timer-s]").forEach(el => el.textContent = pad(s));
}
tickTimer();
setInterval(tickTimer, 1000);

// ============================================================
// МОДАЛКА БРОНИРОВАНИЯ + localStorage
// ============================================================
const KEY_BOOKINGS = "uyut_bookings";
const modal = $("#booking-modal");
const bookingList = $("#booking-list");

function loadBookings() {
  try { return JSON.parse(localStorage.getItem(KEY_BOOKINGS)) || []; }
  catch { return []; }
}
function saveBooking(b) {
  const list = loadBookings();
  list.push(b);
  localStorage.setItem(KEY_BOOKINGS, JSON.stringify(list));
  renderBookings();
}
function renderBookings() {
  const list = loadBookings();
  if (!list.length) {
    bookingList.innerHTML = `<p class="bookings-empty">Бронирований пока нет — станьте первым гостем :)</p>`;
    return;
  }
  const recent = list.slice(-3).reverse();
  bookingList.innerHTML = `<h4 class="bookings-title">Ваши брони (${list.length})</h4>` +
    recent.map(b =>
      `<div class="booking-chip">
        <div class="booking-chip__main">${b.date} · ${b.time} · ${b.guests} ${b.guests > 1 ? "гостя" : "гость"}</div>
        <div class="booking-chip__name">${b.name} · +${b.phone}</div>
      </div>`
    ).join("");
}
renderBookings();

function openBooking() { modal.classList.add("is-open"); document.body.classList.add("no-scroll"); }
function closeBooking() { modal.classList.remove("is-open"); document.body.classList.remove("no-scroll"); }

$$("[data-open-booking]").forEach(b => b.addEventListener("click", e => {
  e.preventDefault(); openBooking();
}));
$$("[data-close-booking]").forEach(b => b.addEventListener("click", closeBooking));
modal.addEventListener("click", e => { if (e.target === modal) closeBooking(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeBooking(); });

const form = $("#booking-form");
const inputs = $$("input, select, textarea", form);
const fieldStates = new WeakMap();

inputs.forEach(inp => {
  const field = inp.closest(".field");
  inp.addEventListener("blur", () => validateField(inp, field));
  inp.addEventListener("input", () => {
    field.classList.remove("field--error");
    const msg = $(".field__msg", field);
    if (msg) msg.textContent = "";
  });
});

function setError(field, msg) {
  field.classList.add("field--error");
  const el = $(".field__msg", field);
  if (el) el.textContent = msg;
}

function validateField(inp, field) {
  const val = inp.value.trim();
  if (inp.hasAttribute("required") && !val) { setError(field, "Заполните это поле"); return false; }
  if (inp.type === "tel") {
    const digits = val.replace(/\D/g, "");
    if (digits.length < 10) { setError(field, "Введите корректный номер телефона"); return false; }
  }
  if (inp.type === "date") {
    if (val && new Date(val).getTime() < new Date(new Date().toDateString()).getTime()) {
      setError(field, "Выберите дату не раньше завтрашнего дня");
      return false;
    }
  }
  if (inp.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    setError(field, "Похоже, в адресе ошибка");
    return false;
  }
  return true;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  let ok = true;
  inputs.forEach(inp => {
    const field = inp.closest(".field");
    if (!validateField(inp, field)) ok = false;
  });
  if (!ok) { toast("Проверьте выделенные поля формы", "error"); return; }

  const data = Object.fromEntries(new FormData(form).entries());
  saveBooking({
    name: data.name.trim(),
    phone: data.phone.replace(/\D/g, ""),
    date: data.date,
    time: data.time,
    guests: data.guests,
    comment: data.comment.trim(),
    createdAt: new Date().toISOString()
  });
  form.reset();
  toast("Столик забронирован! Мы позвоним для подтверждения в течение 15 минут. Приятного аппетита!");
  renderBookings();
  setTimeout(closeBooking, 2200);
});

// Маска телефона
const phoneInput = $("#booking-phone");
if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    let d = phoneInput.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (d.startsWith("9")) d = "7" + d;
    d = d.slice(0, 11);
    let out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 5) out += ") " + d.slice(4, 7);
    if (d.length >= 8) out += "-" + d.slice(7, 9);
    if (d.length >= 10) out += "-" + d.slice(9, 11);
    phoneInput.value = out;
  });
}

// ============================================================
// КНОПКА «НАВЕРХ» + копирование адреса
// ============================================================
const toTop = $("#to-top");
window.addEventListener("scroll", () => {
  toTop.classList.toggle("is-visible", window.scrollY > 700);
}, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

$("#copy-address").addEventListener("click", () => {
  navigator.clipboard.writeText(CONFIG.address).then(
    () => toast("Адрес скопирован: " + CONFIG.address),
    () => toast("Не удалось скопировать", "error")
  );
});

// ============================================================
// ДИНАМИЧЕСКИЕ КОНТАКТЫ ИЗ КОНФИГА
// ============================================================
$$("[data-telegram]").forEach(a => a.href = CONFIG.telegram);
$$("[data-vk]").forEach(a => a.href = CONFIG.vk);
$$("[data-phone-href]").forEach(a => a.href = "tel:" + CONFIG.phoneHref);
$$("[data-phone-text]").forEach(el => el.textContent = CONFIG.phone);
$$("[data-address]").forEach(el => el.textContent = CONFIG.address);
$$("[data-hours]").forEach(el => el.textContent = CONFIG.hours);

// Год в футере
$$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
