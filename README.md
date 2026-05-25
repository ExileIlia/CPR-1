# CPU Monitor — Electron App

Кросплатформний додаток для моніторингу CPU та оперативної пам'яті в реальному часі. Розроблено на базі Electron.

## Можливості

- Відображення завантаження CPU (%) у реальному часі
- Відображення відсотка вільної оперативної пам'яті
- Відображення загального обсягу RAM (GB)
- Оновлення кожну секунду
- Колірна індикація: 🟢 норма / 🟡 середнє / 🔴 висока завантаженість

## Скріншот

> Темний інтерфейс з трьома показниками системи.

## Встановлення та запуск

### Вимоги

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Кроки

```bash
# 1. Клонувати репозиторій
git clone https://github.com/YOUR_USERNAME/cpu-monitor.git
cd cpu-monitor

# 2. Встановити залежності
npm install

# 3. Запустити
npm start
```

## Збірка інсталятора

```bash
# Стандартна збірка через Electron Forge
npm run make

# Повноцінний інсталятор через electron-builder (Windows/macOS/Linux)
npm run build-installer
```

Файли інсталятора з'являться у папці `dist/`.

## Структура проекту

```
cpu-monitor/
├── src/
│   ├── index.js       # Головний процес Electron
│   ├── preload.js     # Preload-скрипт (IPC bridge)
│   ├── index.html     # Інтерфейс користувача
│   ├── index.css      # Стилі
│   └── renderer.js    # Логіка рендерера
├── forge.config.js    # Конфігурація Electron Forge
├── package.json
├── license.txt
└── .gitignore
```

## Технології

- [Electron](https://www.electronjs.org/)
- [Electron Forge](https://www.electronforge.io/)
- [electron-builder](https://www.electron.build/)
- [os-utils](https://www.npmjs.com/package/os-utils)

## Ліцензія

MIT
