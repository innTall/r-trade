# M-Trade — шпаргалка проекта

## Рабочая среда

Проект: `r-trade`  
Package manager: **pnpm**  
Основная локальная команда разработки: `pnpm dev`

> `.env` не коммитить. Секреты и ключи не переносить в этот файл.

---

## 1. Установить зависимости

После клонирования проекта или если зависимости отсутствуют:

```powershell
pnpm install
```

---

## 2. Запустить приложение локально

```powershell
pnpm dev
```

Остановить сервер:

```text
Ctrl+C
```

---

## 3. Собрать production-версию

Перед deploy:

```powershell
pnpm build
```

Если сборка успешна — можно переходить к тестированию/deploy.

---

## 4. Локально проверить production build

Сначала:

```powershell
pnpm build
```

Затем:

```powershell
pnpm preview
```

Остановить:

```text
Ctrl+C
```

---

## 5. GitHub

Для обычной работы Git можно выполнять кнопками VSCode.

Рекомендуемый порядок:

1. Изменить код.
2. Проверить приложение.
3. Выполнить `pnpm build`.
4. Проверить изменения в Source Control.
5. Commit.
6. Push.

Перед серьёзным изменением можно проверить состояние:

```powershell
git status
```

Посмотреть последние коммиты:

```powershell
git log --oneline -10
```

---

## 6. Netlify

В проекте используется `netlify.toml`.

Если сайт Netlify подключён к GitHub-репозиторию, обычный workflow:

```text
изменения
   ↓
pnpm build
   ↓
тест
   ↓
Git commit
   ↓
Git push
   ↓
Netlify автоматически делает новый deploy
```

### Важно

Команда:

```powershell
pnpm run deploy
```

относится к GitHub Pages (`gh-pages -d dist`) и **не является обычным способом deploy в Netlify**.

Для Netlify сначала нужно убедиться, какая ветка подключена в настройках сайта Netlify. После push именно в эту ветку Netlify выполняет автоматический deploy.

---

## 7. Если нужно посмотреть состояние Git

```powershell
git status
```

Последние коммиты:

```powershell
git log --oneline -10
```

Показать удалённые tracked-файлы:

```powershell
git ls-files --deleted
```

---

## 8. Перед изменением существующей функции

Наш рабочий принцип:

**сначала понять → затем изменить → затем build → затем тест → затем commit/deploy.**

Не делать одновременно:
- bugfix;
- refactor;
- optimization;
- новые функции.

---

## 9. Текущий подтверждённый bugfix

### TradingView: `SOL → SUSDT`

Причина:

`LongData.vue` / `ShortData.vue` передают символ в `TradingViewChart.vue`.

При вводе первого символа:

```text
S
↓
BINGX:SUSDT.P
```

TradingView widget создаётся в `onMounted()`, а изменение `props.symbol` после этого не обрабатывается.

После исправления проверить:

```text
Long → SOL
Short → SOL
```

Ожидаемый результат:

```text
BINGX:SOLUSDT.P
```

без переключения страницы/режима.

---

## 10. Текущая функциональность проекта

Уже существует:

- Long / Short UI;
- расчёт параметров сделки;
- настройки депозита и риска;
- Pinia state;
- Telegram отправка;
- TradingView chart;
- PWA.

Пока не реализовано:

- реальная отправка ордера в BingX;
- открытая позиция;
- SL/TP management;
- Break-even;
- partial close;
- управление остатком позиции;
- полноценный trade journal / analytics.

---

## 11. После bugfix

Минимальный цикл проверки:

```powershell
pnpm build
```

Затем:

1. проверить Long;
2. проверить Short;
3. проверить `SOL`;
4. проверить Telegram;
5. проверить остальные существующие функции;
6. только после успешного теста — commit/push;
7. дождаться Netlify deploy;
8. проверить deployed PWA на телефоне.

---

## 12. Принцип дальнейшей разработки

Каждый новый крупный этап:

1. ТЗ;
2. обсуждение;
3. согласование архитектуры;
4. код;
5. compile/build;
6. тест;
7. подтверждение;
8. checkpoint;
9. следующий этап.

Не переходить к следующему этапу, пока текущий не подтверждён.
