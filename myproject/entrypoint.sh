#!/bin/sh

# Создаем миграции, если их нет
python manage.py makemigrations samples --noinput

# Применяем миграции
python manage.py migrate --noinput

# Создаем суперпользователя
python manage.py createsuperuser --noinput --username admin --email admin@example.com || true

# Загружаем начальные данные
python manage.py loaddata initial_data.json

# Собираем статические файлы
python manage.py collectstatic --noinput

# Запускаем команду, переданную в контейнер
exec "$@" 