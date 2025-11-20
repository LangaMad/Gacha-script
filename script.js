// ——— НАСТРОЙКИ ПРЕДМЕТОВ ———
const items = {
    blue: ["Значок", "Пин"],
    purple: ["Маленький брелок"],
    orange: ["Чай", "Большой брелок"]
};

const rarityWeights = {
    blue: 88,
    purple: 10,
    orange: 2
};

// Ссылки на элементы DOM
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const resultDiv = document.getElementById("result");
const itemNameEl = document.querySelector(".item-name");
const closeButton = document.getElementById("closeButton");
const flashOverlay = document.getElementById("flashOverlay");

// Получаем доступ к трем видео-плеерам сразу
const videos = {
    blue: document.getElementById("vid-blue"),
    purple: document.getElementById("vid-purple"),
    orange: document.getElementById("vid-orange")
};

// ——— СОБЫТИЯ ———

// Кнопка Закрыть
closeButton.addEventListener("click", () => {
    resultDiv.classList.add("hidden");
    startScreen.classList.remove("hidden");
    
    // Сбрасываем все видео на начало (на всякий случай)
    Object.values(videos).forEach(v => {
        v.pause();
        v.currentTime = 0;
        v.classList.add("hidden");
    });
});

// Кнопка PLAY
startButton.addEventListener("click", spinLottery);

// ——— ЛОГИКА ГАЧИ ———
function spinLottery() {
    // 1. Рассчитываем, что выпало
    const total = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    let sum = 0;
    let chosenRarity;

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        sum += weight;
        if (random <= sum) {
            chosenRarity = rarity;
            break;
        }
    }

    // Выбираем конкретный предмет
    let list = [...items[chosenRarity]];
    let item = list[Math.floor(Math.random() * list.length)];

    // Логика исключения (если есть Мику)
    if (item.includes("Мику")) {
        items[chosenRarity] = items[chosenRarity].filter(i => i !== item);
    }

    // 2. ПОДГОТОВКА К ЗАПУСКУ
    const currentVideo = videos[chosenRarity];
    
    // Включаем "звук" (если браузер разрешил)
    currentVideo.muted = false;

    // 3. ЭФФЕКТ ВСПЫШКИ (Скрываем лаги)
    // Мгновенно показываем белый экран
    flashOverlay.classList.remove("hidden");
    flashOverlay.style.opacity = "1";

    // Скрываем меню (пользователь этого не увидит под вспышкой)
    startScreen.classList.add("hidden");

    // Показываем тег видео
    currentVideo.classList.remove("hidden");
    currentVideo.currentTime = 0;

    // 4. ЗАПУСК ВИДЕО
    const playPromise = currentVideo.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Видео реально пошло играть.
            // Убираем белую вспышку с небольшой задержкой (0.1 сек), 
            // чтобы точно перекрыть момент старта.
            setTimeout(() => {
                flashOverlay.classList.add("hidden");
            }, 150);
        })
        .catch(error => {
            // Если автоплей заблокирован или видео сломалось
            console.error("Ошибка видео:", error);
            flashOverlay.classList.add("hidden");
            showResult(chosenRarity, item);
        });
    }

    // 5. КОГДА ВИДЕО ЗАКОНЧИЛОСЬ
    currentVideo.onended = () => {
        currentVideo.classList.add("hidden");
        currentVideo.pause(); // Останавливаем ресурсы
        showResult(chosenRarity, item);
    };
}

// Функция показа результата
function showResult(rarity, itemText) {
    // Очищаем старые цвета
    itemNameEl.classList.remove('item-name-blue', 'item-name-purple', 'item-name-orange');
    // Добавляем новый цвет
    itemNameEl.classList.add(`item-name-${rarity}`);
    // Пишем текст
    itemNameEl.textContent = itemText;
    // Показываем экран
    resultDiv.classList.remove("hidden");
}
