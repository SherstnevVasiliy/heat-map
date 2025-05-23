# Тепловая карта кликов

Интерактивное веб-приложение для создания тепловой карты кликов на изображении. Приложение позволяет отслеживать клики пользователей и визуализировать их в виде тепловой карты с градиентом от желтого к фиолетовому.

## Функциональность

- Загрузка изображения
- Отслеживание кликов и тапов на изображении
- Визуализация тепловой карты с накоплением интенсивности
- Адаптивный дизайн для мобильных устройств

## Технологии

- React
- TypeScript
- CSS Modules
- HTML5 Canvas

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/SherstnevVasiliy/heat-map.git
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите приложение:
```bash
npm run dev
```

4. Откройте браузер и перейдите по адресу `http://localhost:5173`

## Использование

1. Загрузите изображение в папку `public` с именем `sample-image.jpg`
2. Запустите приложение
3. Кликайте по изображению для создания тепловой карты
4. Чем больше кликов в одном месте, тем интенсивнее становится цвет

## Лицензия

MIT
