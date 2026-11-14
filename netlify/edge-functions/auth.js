// netlify/edge-functions/auth.js
export default async (request, context) => {
  const authHeader = request.headers.get("authorization");

  // Читаем логин и пароль из защищенных переменных окружения Netlify
  const USER = Netlify.env.get("BASIC_AUTH_USER") || "admin";
  const PASS = Netlify.env.get("BASIC_AUTH_PASS") || "secret";

  if (authHeader) {
    try {
      const authValue = authHeader.split(" ")[1];
      const decodedValue = atob(authValue);
      const [user, pass] = decodedValue.split(":");

      if (user === USER && pass === PASS) {
        return context.next(); // Пропускаем пользователя дальше на сайт
      }
    } catch (e) {
      // Игнорируем некорректный заголовок
    }
  }

  // Если пароля нет или он неверный — запрашиваем авторизацию
  return new Response("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Terminal"'
    }
  });
};
