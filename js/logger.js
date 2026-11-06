/**
 * Logger — простой логгер для браузера.
 * Уровни: debug, info, warn, error. Каждая запись — объект, который можно
 * отправить во внешнюю систему (Sentry, ELK и т.п.) через Logger.transport.
 *
 * Пример записи:
 * { ts: "2026-11-02T10:00:00.000Z", level: "error", scope: "form", sessionId: "a1b2c3",
 *   message: "Не удалось отправить заявку", context: { plan: "Лендинг" },
 *   error: { name: "TypeError", message: "...", stack: "..." } }
 */
(function () {
  const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
  const sessionId = Math.random().toString(36).slice(2, 8);
  // На рабочем сайте можно поднять до "warn", чтобы не шуметь в консоли
  const minLevel = location.hostname === "localhost" || location.protocol === "file:" ? "debug" : "warn";

  function serializeError(err) {
    if (!err) return undefined;
    return { name: err.name, message: err.message, stack: err.stack };
  }

  function write(level, scope, message, context, err) {
    if (LEVELS[level] < LEVELS[minLevel]) return;
    const entry = {
      ts: new Date().toISOString(),
      level,
      scope,
      sessionId,
      message,
      context: context || {},
      error: serializeError(err),
    };
    const out = level === "debug" ? console.debug : console[level] || console.log;
    out(`[${entry.level}] [${scope}] ${message}`, entry);
    if (typeof Logger.transport === "function") {
      try { Logger.transport(entry); } catch (_) { /* транспорт не должен ломать сайт */ }
    }
  }

  class Logger {
    constructor(scope) { this.scope = scope; }
    debug(msg, ctx) { write("debug", this.scope, msg, ctx); }
    info(msg, ctx) { write("info", this.scope, msg, ctx); }
    warn(msg, ctx) { write("warn", this.scope, msg, ctx); }
    error(msg, ctx, err) { write("error", this.scope, msg, ctx, err); }
  }

  // Сюда можно подключить отправку логов: Logger.transport = (entry) => fetch(...)
  Logger.transport = null;

  window.addEventListener("error", (e) => write("error", "window", "Необработанная ошибка", { src: e.filename, line: e.lineno }, e.error));
  window.addEventListener("unhandledrejection", (e) => write("error", "window", "Необработанный promise", {}, e.reason instanceof Error ? e.reason : new Error(String(e.reason))));

  window.Logger = Logger;
})();
