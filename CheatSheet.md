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
pnpm netlify:dev
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
pnpm deploy
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
git reset HEAD~1 - удалить последний коммит
git reset --hard HEAD~1 - жестко удалить последний коммит
git push origin master --force  - отправить удаление в origin
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

