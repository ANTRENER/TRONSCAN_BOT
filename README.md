# TRONSCAN Telegram Bot

Telegram бот для мониторинга транзакций TRON кошельков. Бот отслеживает новые транзакции и отправляет уведомления в чат.

## Возможности

- ✅ Добавление/удаление кошельков для мониторинга
- ✅ Автоматический мониторинг транзакций каждые 30 секунд
- ✅ Отправка уведомлений о новых транзакциях
- ✅ Валидация TRON адресов
- ✅ SQLite база данных для хранения данных

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте переменные окружения:

```bash
cp .env.example .env
```

Или создайте файл `.env` в корне проекта с содержимым:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=ваш_пароль
DATABASE_NAME=tronscan_bot
TRONSCAN_API_URL=https://apilist.tronscanapi.com/api
TRONSCAN_API_KEY=ваш_api_ключ
```

### 3. Запуск приложения

```bash
# Режим разработки
npm run start:dev

# Продакшн режим
npm run start:prod
```

## Развертывание на Vercel

### 1. Установка Vercel CLI

```bash
npm install -g vercel
```

### 2. Развертывание

```bash
# Авторизация (если еще не авторизованы)
vercel login

# Развертывание
vercel

# При первом развертывании укажите:
# - Project name: tronscan-bot
# - Directory: ./
# - Build Command: npm run build
# - Output Directory: dist
# - Install Command: npm install
```

### 3. Настройка переменных окружения в Vercel

В панели управления Vercel перейдите в Settings → Environment Variables и добавьте:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DATABASE_HOST=ваш_supabase_host
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=ваш_supabase_password
DATABASE_NAME=postgres
TRONSCAN_API_URL=https://apilist.tronscanapi.com/api
TRONSCAN_API_KEY=ваш_api_ключ
```

### Настройка Supabase:

1. **Регистрация**: Перейдите на [supabase.com](https://supabase.com) и создайте аккаунт
2. **Новый проект**: Нажмите "New project"
3. **Настройки проекта**:
   - **Name**: TRONSCAN Bot
   - **Database Password**: Придумайте надежный пароль
   - **Region**: Выберите ближайший регион
4. **Подождите**: Создание проекта занимает 2-3 минуты
5. **Подключение**: В панели управления перейдите Settings → Database
6. **Connection string**: Скопируйте данные:
   - **Host**: `db.xxxxx.supabase.co`
   - **Password**: Тот, что вы указали при создании

**Пример переменных для Supabase:**
```env
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_PASSWORD=ваш_пароль_от_supabase
```

### 4. Настройка webhook для Telegram

После развертывания Vercel покажет URL вашего приложения (например: `https://tronscan-bot.vercel.app`).

Установите webhook для Telegram бота:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tronscan-bot.vercel.app/api/telegram"}'
```

### ⚠️ Важные замечания для Vercel:

- **База данных**: Настроена Supabase PostgreSQL
- **Ограничения**: Vercel имеет лимиты на время выполнения (30 сек для cron jobs)
- **Cron Jobs**: Могут работать нестабильно на бесплатном плане
- **Supabase**: Бесплатный план имеет ограничения (500MB, 50MB bandwidth/месяц)
- **Альтернативы**: Для постоянного бота лучше использовать Railway, Render или Heroku

### Проверка работы:

```bash
# Health check
curl https://tronscan-bot.vercel.app/health

# Тест cron job
curl -X POST https://tronscan-bot.vercel.app/api/cron
```

## Использование бота

1. Найдите бота в Telegram: `@tronscan_monitor_bot`
2. Отправьте команду `/start` для начала работы
3. Используйте команды:

### Команды бота

- `/start` - Запуск бота и получение справки
- `/help` - Показать справку
- `/add_wallet <адрес>` - Добавить кошелек для мониторинга
- `/remove_wallet <адрес>` - Удалить кошелек из мониторинга
- `/list_wallets` - Показать список отслеживаемых кошельков

### Формат уведомлений

Бот отправляет уведомления в следующем формате:

```
🔔 Новая транзакция!

Исходящий кошелек: TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Кому: TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Сумма: 100.000000 TRX
Баланс: 500.000000 TRX
Дата и время: 23.09.2025 15:30:00

🔗 Посмотреть транзакцию
```

## Архитектура

### Модули

- **TelegramModule** - Интеграция с Telegram Bot API
- **DatabaseModule** - Работа с базой данных (SQLite)
- **TronModule** - Интеграция с TRONSCAN API
- **MonitoringModule** - Сервис мониторинга транзакций

### Сущности базы данных

- **Wallet** - Информация о отслеживаемых кошельках
- **TransactionCheckpoint** - Чекпоинты для отслеживания последних проверенных транзакций

### API TRONSCAN

Бот использует API TRONSCAN с API ключом для получения данных о транзакциях:
- `GET /transfer` - Получение TRX/TRC10/TRC20 переводов для кошелька
- `GET /account` - Получение баланса аккаунта

**Частота запросов**:
- **Все кошельки**: Каждые 2 минуты (гарантированное отслеживание всех транзакций)
- **Параллельная обработка**: Запросы выполняются параллельно для повышения производительности
- **Резервная проверка**: Каждые 6 часов - валидация всех чекпоинтов

API ключ добавляется в заголовок `TRON-PRO-API-KEY` для аутентификации.

## Разработка

### Структура проекта

```
src/
├── app.module.ts           # Главный модуль приложения
├── config/                 # Конфигурация
├── database/               # Модуль базы данных
│   ├── entities/          # Сущности БД
│   └── services/          # Сервисы БД
├── telegram/               # Telegram бот модуль
├── tron/                   # TRON API модуль
└── monitoring/             # Сервис мониторинга
```

### Запуск в режиме разработки

```bash
npm run start:dev
```

### Сборка проекта

```bash
npm run build
```

### Тестирование

```bash
npm run test
```

## Производственное развертывание

Для продакшена рекомендуется:

1. Использовать PostgreSQL вместо SQLite
2. Настроить миграции вместо `synchronize: true`
3. Добавить логирование в файл
4. Настроить мониторинг и алерты
5. Использовать Docker для контейнеризации

## Безопасность

- Токен бота хранится в переменных окружения
- Валидация TRON адресов перед добавлением
- Обработка ошибок API

## Лицензия

UNLICENSED