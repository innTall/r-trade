// netlify/edge-functions/auth.js
export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Пропускаем без пароля файлы манифеста, иконки и сервис-воркер,
  // чтобы телефон мог корректно установить PWA на экран
  if (
    path.endsWith("/manifest.json") ||
    path.endsWith("/favicon.ico") ||
    path.endsWith("/sw.js") ||
    path.startsWith("/icons/") ||
    path.startsWith("/img/")
  ) {
    return context.next();
  }

  const authHeader = request.headers.get("authorization");
  const USER = Netlify.env.get("BASIC_AUTH_USER") || "abc";
  const PASS = Netlify.env.get("BASIC_AUTH_PASS") || "123456";

  if (authHeader) {
    try {
      const authValue = authHeader.split(" ")[1];
      const decodedValue = atob(authValue);
      const [user, pass] = decodedValue.split(":");

      if (user === USER && pass === PASS) {
        return context.next(); // Пропускаем пользователя дальше
      }
    } catch (e) {
      // Игнорируем некорректный заголовок
    }
  }

  // Запрос пароля для всего остального интерфейса
  return new Response("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Terminal"'
    }
  });
};
