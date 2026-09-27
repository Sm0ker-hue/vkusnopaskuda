# ВкусноПаскуда! - Scraper System

Система парсинга актуальных скидок и цен из чешских супермаркетов.

## Поддерживаемые сети:
- Albert
- Tesco
- Lidl
- Kaufland
- Billa
- Penny Market
- Globus
- Makro
- Coop
- Norma
- Rohlík
- Košík

## Установка

1. Создайте виртуальное окружение:
   ```bash
   python -m venv venv
   source venv/bin/activate  # На Windows: venv\Scripts\activate
   ```
2. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```

## Запуск

Для периодического обновления данных (каждые 6 часов) запустите планировщик:
```bash
python -m src.scheduler
```

Архитектура:
- `src/base_scraper.py` - базовый класс для всех скраперов
- `src/scrapers/` - специфичные скраперы для каждой сети
- `src/aggregators/` - агрегаторы скидок (kupi.cz, akcniceny.cz)
- `src/normalizer.py` - нормализация данных продуктов
- `src/matcher.py` - fuzzy matching продуктов
