// ——— НАСТРОЙКИ ПРЕДМЕТОВ ———
const items = {
    blue: ["Значок", "Пин"],
    purple: ["Маленький брелок"],
    orange: ["Чай", "Большой брелок","Чай в пакетиках(Упк.)"]
};

const rarityWeights = {
    blue: 79,
    purple: 18,
    orange: 3
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


let idleTimer;
// Время бездействия (5 минут = 300000 мс)
// Для теста можешь поставить 10000 (10 секунд), чтобы проверить, работает ли
const IDLE_TIME = 4 * 60 * 1000; 

// ——— ЗАПУСК ПРИ ЗАГРУЗКЕ ———
// Запускаем таймер сразу, как открыли страницу
resetIdleTimer();

// ——— СОБЫТИЯ ———

// Кнопка Закрыть (возврат в меню)
closeButton.addEventListener("click", () => {
    resultDiv.classList.add("hidden");
    startScreen.classList.remove("hidden");
    
    // Сбрасываем все видео (на всякий случай)
    stopAllVideos();
    
    // Снова запускаем таймер ожидания
    resetIdleTimer();
});

// Кнопка PLAY
startButton.addEventListener("click", () => {
    // 1. Убиваем таймер бездействия (чтобы видео не вылезло во время игры)
    clearTimeout(idleTimer);
    
    // 2. Если прямо сейчас шло "фоновое" видео — рубим его
    stopAllVideos();

    // 3. Запускаем саму гачу
    spinLottery();
});


// ——— ФУНКЦИЯ ГАЧИ (ИГРА) ———
function spinLottery() {
    // Рассчитываем, что выпало
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

    let list = [...items[chosenRarity]];
    let item = list[Math.floor(Math.random() * list.length)];

    if (item.includes("Мику")) {
        items[chosenRarity] = items[chosenRarity].filter(i => i !== item);
    }

    // ПОДГОТОВКА ВИДЕО
    const currentVideo = videos[chosenRarity];
    currentVideo.muted = false; // Включаем звук для игрока

    // ЭФФЕКТ ВСПЫШКИ
    flashOverlay.classList.remove("hidden");
    flashOverlay.style.opacity = "1";
    startScreen.classList.add("hidden");

    currentVideo.classList.remove("hidden");
    currentVideo.currentTime = 0;

    // ЗАПУСК
    const playPromise = currentVideo.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            setTimeout(() => {
                flashOverlay.classList.add("hidden");
            }, 150);
        })
        .catch(error => {
            console.error("Ошибка видео:", error);
            flashOverlay.classList.add("hidden");
            showResult(chosenRarity, item);
        });
    }

    // КОГДА ЗАКОНЧИЛОСЬ
    currentVideo.onended = () => {
        currentVideo.classList.add("hidden");
        currentVideo.pause();
        showResult(chosenRarity, item);
    };
}

// ——— ФУНКЦИИ ДЛЯ РЕЖИМА ОЖИДАНИЯ (IDLE) ———

function resetIdleTimer() {
    // Очищаем старый таймер, если был
    clearTimeout(idleTimer);
    // Ставим новый
    idleTimer = setTimeout(playRandomIdleVideo, IDLE_TIME);
}

function playRandomIdleVideo() {
    // Если мы НЕ на стартовом экране (например, смотрим результат), ничего не делаем
    if (startScreen.classList.contains("hidden")) return;

    // Ты просил: blue_star и orange_star
    const idleOptions = ["blue", "orange"];
    const randomChoice = idleOptions[Math.floor(Math.random() * idleOptions.length)];
    
    const videoToPlay = videos[randomChoice];

    // Важно: для фона видео лучше оставить без звука или тихое, 
    // но обычно браузеры разрешают автоплей только muted.
    // Если хочешь со звуком - убери строку ниже, но на планшете может не сработать автозапуск.
    videoToPlay.muted = true; 

    videoToPlay.classList.remove("hidden");
    videoToPlay.currentTime = 0;
    
    videoToPlay.play().then(() => {
        // Видео пошло
    }).catch(e => console.log("Автоплей заблокирован браузером (это норма):", e));

    // Когда фоновое видео закончилось
    videoToPlay.onended = () => {
        videoToPlay.classList.add("hidden");
        // Снова заводим таймер на следующие 5 минут
        resetIdleTimer();
    };
}

// Вспомогательная функция: остановить всё
function stopAllVideos() {
    Object.values(videos).forEach(v => {
        v.pause();
        v.currentTime = 0;
        v.classList.add("hidden");
        // Убираем обработчик onended, чтобы он не сработал при принудительной остановке
        v.onended = null; 
    });
}

function showResult(rarity, itemText) {
    itemNameEl.classList.remove('item-name-blue', 'item-name-purple', 'item-name-orange');
    itemNameEl.classList.add(`item-name-${rarity}`);
    itemNameEl.textContent = itemText;
    resultDiv.classList.remove("hidden");
}


// ——— РОТАЦИЯ ЗАГОЛОВКА ———

const mainTitle = document.getElementById("mainTitle");

const titlesList = [
    "GACHA",
    "Попробуй свою удачу",
    "Гача",
    "Испытай судьбу",
    "Твой приз ждет"
];

let titleIndex = 0;

function rotateTitle() {
    // 1. Плавно скрываем текст
    mainTitle.classList.add("fade-out");

    // 2. Ждем полсекунды (пока исчезнет), меняем текст и показываем обратно
    setTimeout(() => {
        titleIndex++;
        if (titleIndex >= titlesList.length) {
            titleIndex = 0; // Зацикливаем список
        }
        
        mainTitle.textContent = titlesList[titleIndex];
        
        // Показываем текст обратно
        mainTitle.classList.remove("fade-out");
    }, 500); // 500мс = время transition в CSS
}

// Запускаем таймер: 15000 мс = 15 секунд
setInterval(rotateTitle, 15000);






