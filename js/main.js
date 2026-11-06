/* Лендинг «Дмитрий Смирнов — сайты для малого бизнеса» */
(function () {
  "use strict";

  const log = new Logger("landing");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  // Куда отправляются заявки: Worker в Cloudflare, он пересылает их в Telegram (код: форма-витрина-api/worker.js)
  const FORM_ENDPOINT = "https://vitrina-form-api.tuzir2022.workers.dev";

  /* ---------- 2. Заголовок по словам с общим градиентом ---------- */
  function initTitle() {
    const title = document.querySelector("[data-split]");
    if (!title) return;
    // Делим только по обычным пробелам: неразрывный пробел (&nbsp;) держит слова вместе
    const words = title.textContent.trim().split(/ +/);
    title.setAttribute("aria-label", title.textContent.trim().replace(/ /g, " "));
    // Слова вставляем через textContent, а не innerHTML — так в заголовок не пролезет чужой код
    title.textContent = "";
    words.forEach((wd, i) => {
      const outer = document.createElement("span");
      outer.className = "word";
      outer.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.style.setProperty("--i", i);
      inner.textContent = wd;
      outer.appendChild(inner);
      if (i > 0) title.appendChild(document.createTextNode(" "));
      title.appendChild(outer);
    });

    function measure() {
      const box = title.getBoundingClientRect();
      title.style.setProperty("--w", box.width + "px");
      title.style.setProperty("--h", box.height + "px");
      title.querySelectorAll(".word").forEach((wEl) => {
        const r = wEl.getBoundingClientRect();
        const inner = wEl.firstElementChild;
        inner.style.setProperty("--x", r.left - box.left + "px");
        inner.style.setProperty("--y", r.top - box.top + "px");
      });
    }
    measure();
    title.classList.add("is-split");
    window.addEventListener("resize", measure);
    document.fonts && document.fonts.ready.then(measure);
  }

  /* ---------- 3. Веер телефонов ---------- */
  const TOASTS = ["Заявка: прогулка на квадроциклах, суббота", "Заявка: расчёт дачного дома", "Запись на мастер-класс, суббота"];

  function initPhones() {
    const wrap = document.getElementById("phones");
    const phones = [...wrap.querySelectorAll(".phone")];
    const tabs = [...document.querySelectorAll(".niche-tabs button")];
    const toast = document.getElementById("demoToast");
    const toastText = document.getElementById("demoToastText");
    let active = 1, autoTimer = 0, toastTimer = 0;

    // Выбранный телефон — в центре, остальные расходятся веером влево и вправо
    function show(index, fromUser) {
      active = index;
      const n = phones.length;
      phones.forEach((ph, i) => {
        const pos = (i - index + n) % n; // 0 — впереди, 1 — справа, 2 — слева
        ph.classList.toggle("is-front", pos === 0);
        ph.classList.toggle("is-right", pos === 1);
        ph.classList.toggle("is-left", pos === n - 1);
      });
      tabs.forEach((b, i) => b.setAttribute("aria-selected", String(i === index)));
      toast.classList.remove("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastText.textContent = TOASTS[index];
        toast.classList.add("is-on");
      }, reduceMotion ? 0 : 900);
      log.debug("Показан телефон", { index, fromUser });
    }

    function pick(i) {
      clearInterval(autoTimer); // человек выбрал сам — больше не листаем
      show(i, true);
    }
    tabs.forEach((btn, i) => btn.addEventListener("click", () => pick(i)));
    phones.forEach((ph, i) => ph.addEventListener("click", () => pick(i)));

    // При прокрутке телефоны расходятся шире
    if (!reduceMotion) {
      const base = () => (innerWidth <= 680 ? 88 : 130);
      const onScroll = () => {
        const k = Math.min(scrollY / 400, 1);
        wrap.style.setProperty("--spread", `${base() + k * base() * 0.35}px`);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      onScroll();
      autoTimer = setInterval(() => show((active + 1) % phones.length, false), 4800);
    }
    show(active, false);
  }

  /* ---------- 4. Плавное появление блоков ---------- */
  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- 5. Эффекты при наведении ---------- */
  function initHover() {
    if (!canHover || reduceMotion) return;

    // Подсветка карточек за курсором
    document.querySelectorAll("[data-glow]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    // «Магнитные» кнопки
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
    });

    // Наклон карточек-примеров в 3D
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- 6. Калькулятор потерь ---------- */
  function initCalc() {
    const check = document.getElementById("check");
    const lost = document.getElementById("lost");
    const money = document.getElementById("lossMoney");
    const payback = document.getElementById("payback");
    const fmt = new Intl.NumberFormat("ru-RU");
    const LANDING_PRICE = 15000; // цена одностраничного сайта
    let shown = 0, anim = 0;

    function paint(input) {
      const p = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty("--p", p + "%");
    }

    function plural(n, forms) {
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return forms[0];
      if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
      return forms[2];
    }

    function update() {
      paint(check); paint(lost);
      document.getElementById("checkOut").textContent = fmt.format(check.value) + " ₽";
      document.getElementById("lostOut").textContent = lost.value;
      const target = Math.round(check.value * lost.value * 4.3);
      // Осторожное допущение: сайт возвращает треть «потерянных» клиентов
      const days = Math.max(1, Math.ceil(LANDING_PRICE / (target / 3 / 30)));
      payback.textContent = days <= 10
        ? `${days} ${plural(days, ["день", "дня", "дней"])}`
        : days <= 60 ? `${Math.round(days / 7)} ${plural(Math.round(days / 7), ["неделю", "недели", "недель"])}`
        : `${Math.round(days / 30)} ${plural(Math.round(days / 30), ["месяц", "месяца", "месяцев"])}`;

      // Плавный «бег» цифры
      cancelAnimationFrame(anim);
      const from = shown, start = performance.now(), dur = reduceMotion ? 1 : 500;
      const step = (now) => {
        const k = Math.min((now - start) / dur, 1);
        shown = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
        money.textContent = fmt.format(shown) + " ₽";
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    check.addEventListener("input", update);
    lost.addEventListener("input", update);
    update();
  }

  /* ---------- 7. Линия процесса заполняется при прокрутке ---------- */
  function initSteps() {
    const list = document.getElementById("steps");
    const fill = document.getElementById("stepsFill");
    const steps = [...list.querySelectorAll(".step")];
    function onScroll() {
      const r = list.getBoundingClientRect();
      const mid = innerHeight * 0.6;
      const progress = Math.min(Math.max((mid - r.top - 60) / (r.height - 120), 0), 1);
      fill.style.height = progress * 100 + "%";
      steps.forEach((s) => s.classList.toggle("is-lit", s.getBoundingClientRect().top + 38 < mid));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 8. Шапка и липкая кнопка ---------- */
  function initChrome() {
    const header = document.getElementById("header");
    const cta = document.getElementById("mobileCta");
    const order = document.getElementById("order");
    const toTop = document.getElementById("toTop");
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
    function onScroll() {
      header.classList.toggle("is-scrolled", scrollY > 30);
      const orderTop = order.getBoundingClientRect().top;
      cta.classList.toggle("is-on", scrollY > innerHeight * 0.8 && orderTop > innerHeight);
      toTop.classList.toggle("is-on", scrollY > innerHeight * 0.8);
      toTop.classList.toggle("is-lifted", cta.classList.contains("is-on")); // на телефоне поднимаем над липкой кнопкой
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Кнопка тарифа подставляет его в форму
    document.querySelectorAll("[data-plan]").forEach((a) =>
      a.addEventListener("click", () => { document.getElementById("planSelect").value = a.dataset.plan; })
    );
  }

  /* ---------- 9. Форма заявки ---------- */
  function initForm() {
    const form = document.getElementById("orderForm");
    const error = document.getElementById("formError");
    const done = document.getElementById("formDone");
    const btn = form.querySelector("button[type=submit]");

    // Пока нет галочки согласия (ФЗ-152), кнопка неактивна и полупрозрачная
    const consent = form.elements.consent;
    const syncBtn = () => { btn.disabled = !consent.checked; };
    consent.addEventListener("change", syncBtn);
    syncBtn();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const problems = [];
      [["name", "имя"], ["contact", "телефон или Telegram"]].forEach(([key, label]) => {
        const field = form.elements[key];
        const empty = !String(data[key] || "").trim();
        field.setAttribute("aria-invalid", String(empty));
        if (empty) problems.push(label);
      });
      if (problems.length) { error.textContent = `Заполните: ${problems.join(" и ")}.`; return; }
      if (!form.elements.consent.checked) { error.textContent = "Отметьте согласие на обработку данных, иначе я не смогу ответить."; return; }
      error.textContent = "";

      btn.disabled = true;
      btn.textContent = "Отправляю…";
      // Персональные данные в лог не пишем — только тариф
      const ctx = { plan: data.plan };
      try {
        if (FORM_ENDPOINT) {
          const res = await fetch(FORM_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(`Сервер ответил ${res.status}`);
          log.info("Заявка отправлена", ctx);
        } else {
          log.warn("FORM_ENDPOINT не задан: заявка никуда не отправлена (демо-режим)", ctx);
        }
        done.hidden = false;
        form.reset();
      } catch (err) {
        log.error("Не удалось отправить заявку", ctx, err);
        error.textContent = "Заявка не отправилась. Проверьте интернет и попробуйте ещё раз или напишите мне в Telegram.";
      } finally {
        syncBtn();
        btn.textContent = "Отправить заявку";
      }
    });
  }

  /* ---------- Запуск ---------- */
  [initTitle, initPhones, initReveal, initHover, initCalc, initSteps, initChrome, initForm].forEach((fn) => {
    try { fn(); } catch (err) { log.error("Ошибка инициализации", { fn: fn.name }, err); }
  });
  log.info("Лендинг запущен", { reduceMotion, canHover });
})();
