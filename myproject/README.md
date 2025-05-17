# Sample Library - Библиотека аудиосэмплов

Веб-приложение для управления и обмена аудиосэмплами. Позволяет пользователям загружать, скачивать, оценивать и категоризировать аудиосэмплы.

## 🚀 Возможности

- Загрузка и скачивание аудиосэмплов
- Категоризация сэмплов
- Система тегов
- Поиск и фильтрация
- Система лайков
- История загрузок
- Аутентификация пользователей
- REST API

## 🛠 Технологии

- Python 3.11
- Django 5.0
- Django REST Framework
- PostgreSQL
- Docker & Docker Compose
- HTML/CSS/JavaScript
- Bootstrap 5

## 📋 Требования

- Docker
- Docker Compose
- Git

## 🚀 Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/sample-library.git
cd sample-library
```

2. Запустите проект с помощью Docker Compose:
```bash
docker-compose up --build -d
```

После запуска приложение будет доступно по адресу: http://localhost:8000

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в корневой директории проекта со следующими параметрами:

```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://postgres:postgres@db:5432/postgres
```

### Настройка базы данных

База данных PostgreSQL настраивается автоматически при первом запуске. Данные для подключения:
- База данных: postgres
- Пользователь: postgres
- Пароль: postgres
- Хост: db
- Порт: 5432

## 👤 Учетные данные по умолчанию

При первом запуске создается суперпользователь:
- Логин: admin
- Email: admin@example.com
- Пароль: admin

**Важно**: Измените пароль после первого входа!

## 📚 API Endpoints

### Аутентификация
- `POST /api/login/` - Вход в систему
- `POST /api/logout/` - Выход из системы
- `POST /api/register/` - Регистрация нового пользователя

### Сэмплы
- `GET /api/samples/` - Список всех сэмплов
- `POST /api/samples/` - Загрузка нового сэмпла
- `GET /api/samples/{id}/` - Детали сэмпла
- `PUT /api/samples/{id}/` - Обновление сэмпла
- `DELETE /api/samples/{id}/` - Удаление сэмпла

### Категории и теги
- `GET /api/categories/` - Список категорий
- `GET /api/tags/` - Список тегов

### Пользовательские данные
- `GET /api/samples/liked/` - Понравившиеся сэмплы
- `GET /api/samples/uploaded/` - Загруженные сэмплы
- `GET /api/samples/downloaded/` - История загрузок

## 🗂 Структура проекта

```
sample-library/
├── docker-compose.yml    # Конфигурация Docker Compose
├── Dockerfile           # Конфигурация Docker
├── entrypoint.sh        # Скрипт инициализации
├── requirements.txt     # Зависимости Python
├── manage.py           # Скрипт управления Django
├── myproject/          # Основной проект Django
│   ├── settings.py     # Настройки проекта
│   ├── urls.py         # URL-маршруты
│   └── wsgi.py         # WSGI конфигурация
├── samples/            # Приложение для работы с сэмплами
│   ├── models.py       # Модели данных
│   ├── views.py        # Представления
│   └── serializers.py  # Сериализаторы
└── front/              # Фронтенд часть
    ├── static/         # Статические файлы
    └── templates/      # HTML шаблоны
```

## 🔄 Процесс разработки

1. Создайте новую ветку для ваших изменений:
```bash
git checkout -b feature/your-feature-name
```

2. Внесите изменения и закоммитьте их:
```bash
git add .
git commit -m "Описание ваших изменений"
```

3. Отправьте изменения в репозиторий:
```bash
git push origin feature/your-feature-name
```

4. Создайте Pull Request для слияния изменений.

## 🧪 Тестирование

Для запуска тестов:
```bash
docker-compose run --rm web python manage.py test
```

## 📝 Лицензия

MIT License. См. файл `LICENSE` для подробностей.

## 👥 Авторы

- Ваше имя - [GitHub](https://github.com/your-username)

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для ваших изменений
3. Внесите изменения
4. Отправьте Pull Request

## ⚠️ Известные проблемы

- При первом запуске может потребоваться несколько секунд для инициализации базы данных
- При загрузке больших файлов может потребоваться настройка параметров nginx

## 🔜 Планы по развитию

- [ ] Добавление системы комментариев
- [ ] Интеграция с облачными хранилищами
- [ ] Добавление предпросмотра аудио
- [ ] Система модерации контента
- [ ] API для мобильного приложения 