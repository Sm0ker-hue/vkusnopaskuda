# ВкусноПаскуда! (FoodTech PWA)

"ВкусноПаскуда!" — это FoodTech PWA приложение для генерации рецептов, умного планирования покупок и навигации по скидкам в супермаркетах Чехии.

## Структура проекта

### 1. Backend (`/backend`)
Backend написан на **FastAPI (Python 3.11+)** с использованием асинхронной СУБД **PostgreSQL** (Neon).
В качестве ORM используется **SQLAlchemy 2.0 (async)** + миграции **Alembic**.

#### Основные модули:
- **LLM Service (`llm_service.py`)**: Интеграция с Google Gemini API для генерации вариаций рецептов, перевода ингредиентов и парсинга Structured JSON.
- **Recipe Service (`recipe_service.py`)**: Логика работы с блюдами, рецептами и инвентарем пользователя.
- **Shopping Service (`shopping_service.py`)**: Логика "умной корзины" с использованием гео-запросов (Haversine), Fuzzy Matching ингредиентов и поиском оптимальных стратегий (Самая дешевая, Ближайшая, Оптимальная).
- **Seed Service (`seed_service.py`)**: Инициализация 12 чешских сетей магазинов (Albert, Tesco, Lidl и др.).

#### Запуск Backend:
1. Перейдите в папку `backend` и создайте `.env` файл на базе `.env.example`.
2. Активируйте виртуальное окружение: `venv\Scripts\activate`
3. Установите зависимости: `pip install -r requirements.txt`
4. Примените миграции базы данных: `alembic upgrade head`
5. Запустите сервер: `uvicorn app.main:app --reload`

### 2. Frontend (В разработке)
*TBD*

---

## Архитектура Базы Данных (Схема)

Используются строгие нормализованные связи (3NF), UUID-ключи, и индексы.

- `users`, `user_settings`
- `dishes`, `recipe_variations`, `recipe_ingredients`, `recipe_steps`
- `ingredients`, `user_inventory`
- `stores`, `store_locations`, `products`, `product_ingredients`
- `shopping_lists`, `shopping_list_items`
- `ratings`, `cooking_history`
