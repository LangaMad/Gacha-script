// ——— НАСТРОЙКИ ПРЕДМЕТОВ ———
const items = {
    blue: ["Значок", "Пин"],
    purple: ["Брелок", "Печатка", "Большая Печатка"],
    orange: ["Чай", "Кухенки", "Сидячая Фигурка"]
};

const rarityWeights = {
    blue: 77,
    purple: 20,
    orange: 3
};

// ——— ЗАЩИТА ОТ СЕРИЙ ———
// Сколько раз подряд максимум может выпасть одна и та же редкость.
// null = без ограничения. Сейчас: фиолетовый не может выпасть 3 раза подряд.
const maxStreak = {
    blue: null,
    purple: 2,
    orange: null
};

// Сколько звёздочек показывать под названием приза
const starCounts = {
    blue: 3,
    purple: 4,
    orange: 5
};

// Ссылки на элементы DOM
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const resultDiv = document.getElementById("result");
const itemNameEl = document.querySelector(".item-name");
const closeButton = document.getElementById("closeButton");
const flashOverlay = document.getElementById("flashOverlay");
const starsBox = document.getElementById("starsBox");

// Получаем доступ к трем видео-плеерам сразу
const videos = {
    blue: document.getElementById("vid-blue"),
    purple: document.getElementById("vid-purple"),
    orange: document.getElementById("vid-orange")
};

// Звуки, которые играют вместе с показом приза
const sounds = {
    blue: document.getElementById("snd-blue"),
    purple: document.getElementById("snd-purple"),
    orange: document.getElementById("snd-orange")
};


// Что выпало в прошлый раз и сколько раз подряд — для защиты от серий
let lastRarity = null;
let streakCount = 0;

let idleTimer;

// ——— РЕЖИМ ОЖИДАНИЯ ———
// Через сколько простоя запускать ролик-завлекалку.
// Пауза берётся случайная в этом диапазоне, чтобы не выглядело как метроном.
const IDLE_MIN = 30 * 1000; // 30 секунд
const IDLE_MAX = 40 * 1000; // 40 секунд

// Какие ролики крутить в ожидании — случайно один из списка.
const idleOptions = ["purple", "orange"];

// ——— ЗАПУСК ПРИ ЗАГРУЗКЕ ———
// Запускаем таймер сразу, как открыли страницу
resetIdleTimer();

// ——— СОБЫТИЯ ———

// Кнопка Закрыть (возврат в меню)
closeButton.addEventListener("click", () => {
    resultDiv.classList.add("hidden");
    startScreen.classList.remove("hidden");
    
    // Сбрасываем все видео и звуки (на всякий случай)
    stopAllVideos();
    stopAllSounds();
    starsBox.innerHTML = "";
    
    // Снова запускаем таймер ожидания
    resetIdleTimer();
});

// Запуск игры. Вызывается и кнопкой PLAY, и тапом по ролику-завлекалке.
function startGame() {
    // 1. Убиваем таймер бездействия (чтобы видео не вылезло во время игры)
    clearTimeout(idleTimer);

    // 2. Разблокируем звук (планшеты разрешают это только внутри касания)
    primeSounds();

    // 3. Если прямо сейчас шло "фоновое" видео или звук — рубим
    stopAllVideos();
    stopAllSounds();

    // 4. Запускаем саму гачу
    spinLottery();
}

// Кнопка PLAY
startButton.addEventListener("click", startGame);


// ——— ВЫБОР РЕДКОСТИ ———
// exclude — редкость, которую нужно пропустить (для защиты от серий).
// Оставшиеся редкости сохраняют пропорции между собой.
function pickRarity(exclude) {
    let total = 0;
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        if (rarity !== exclude) total += weight;
    }

    let random = Math.random() * total;
    let sum = 0;

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        if (rarity === exclude) continue;
        sum += weight;
        if (random <= sum) return rarity;
    }
}

// ——— ФУНКЦИЯ ГАЧИ (ИГРА) ———
function spinLottery() {
    // Рассчитываем, что выпало
    let chosenRarity = pickRarity(null);

    // Защита от серий: если эта редкость уже выпадала подряд сколько можно —
    // перевыбираем без неё. Важно: это происходит ДО запуска видео,
    // поэтому видео, приз, звёздочки и звук всегда совпадают между собой.
    const limit = maxStreak[chosenRarity];
    if (limit && chosenRarity === lastRarity && streakCount >= limit) {
        chosenRarity = pickRarity(chosenRarity);
    }

    // Запоминаем для следующего прокрута
    if (chosenRarity === lastRarity) {
        streakCount++;
    } else {
        lastRarity = chosenRarity;
        streakCount = 1;
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
    // Ставим новый со случайной паузой 10–15 секунд
    const delay = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
    idleTimer = setTimeout(playRandomIdleVideo, delay);
}

function playRandomIdleVideo() {
    // Если мы НЕ на стартовом экране (например, смотрим результат) —
    // не лезем поверх, но и не бросаем цикл: пробуем ещё раз через паузу
    if (startScreen.classList.contains("hidden")) {
        resetIdleTimer();
        return;
    }

    const randomChoice = idleOptions[Math.floor(Math.random() * idleOptions.length)];
    const videoToPlay = videos[randomChoice];

    // Браузеры разрешают автозапуск только без звука.
    // Со звуком на планшете ролик просто не запустится.
    videoToPlay.muted = true;

    videoToPlay.classList.remove("hidden");
    videoToPlay.currentTime = 0;

    // Ролик закрывает собой кнопку PLAY, поэтому тап по нему сам запускает игру.
    // Вешаем обработчик только на время завлекалки: во время настоящей гачи
    // видео должно быть некликабельным, иначе можно перезапустить прокрут на середине.
    videoToPlay.onclick = startGame;

    videoToPlay.play().catch(e => {
        // Автозапуск заблокирован — прячем обратно и пробуем позже,
        // иначе режим ожидания заглохнет навсегда
        console.log("Автоплей заблокирован браузером (это норма):", e);
        videoToPlay.classList.add("hidden");
        videoToPlay.onclick = null;
        resetIdleTimer();
    });

    // Когда ролик закончился — ждём следующую паузу
    videoToPlay.onended = () => {
        videoToPlay.classList.add("hidden");
        videoToPlay.onclick = null;
        resetIdleTimer();
    };
}

// Вспомогательная функция: остановить всё
function stopAllVideos() {
    Object.values(videos).forEach(v => {
        v.pause();
        v.currentTime = 0;
        v.classList.add("hidden");
        // Убираем обработчики, чтобы они не сработали при принудительной остановке
        v.onended = null;
        v.onclick = null;
    });
}

// Вспомогательная функция: заглушить все звуки
function stopAllSounds() {
    Object.values(sounds).forEach(a => {
        a.pause();
        a.currentTime = 0;
    });
}

// Планшеты и телефоны разрешают запуск звука только внутри касания.
// Поэтому при первом нажатии PLAY мы "прогреваем" все три файла: беззвучно
// запускаем и сразу останавливаем. После этого их можно играть когда угодно.
let soundsPrimed = false;
function primeSounds() {
    if (soundsPrimed) return;
    soundsPrimed = true;

    Object.values(sounds).forEach(a => {
        a.muted = true;
        const p = a.play();
        if (p !== undefined) {
            p.then(() => {
                a.pause();
                a.currentTime = 0;
                a.muted = false;
            }).catch(() => {
                // Не получилось — не страшно, звук просто включится позже
                a.muted = false;
            });
        } else {
            a.muted = false;
        }
    });
}

// ——— ЗВЁЗДОЧКИ РЕДКОСТИ ———
// Рисуем нужное количество звёздочек, каждая со своей задержкой,
// поэтому они появляются по одной, а не все сразу.
function renderStars(rarity) {
    starsBox.innerHTML = "";
    starsBox.classList.remove("stars-blue", "stars-purple", "stars-orange");
    starsBox.classList.add(`stars-${rarity}`);

    const count = starCounts[rarity] || 0;

    for (let i = 0; i < count; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        // 1-я через 0.35с (когда карточка уже проявилась), дальше каждые 0.22с
        star.style.animationDelay = (0.35 + i * 0.22) + "s";
        starsBox.appendChild(star);
    }
}

function showResult(rarity, itemText) {
    itemNameEl.classList.remove('item-name-blue', 'item-name-purple', 'item-name-orange');
    itemNameEl.classList.add(`item-name-${rarity}`);
    itemNameEl.textContent = itemText;

    // Звёздочки по редкости
    renderStars(rarity);

    // Звук выигрыша
    const snd = sounds[rarity];
    if (snd) {
        snd.muted = false; // на случай, если "прогрев" ещё не успел снять заглушку
        snd.currentTime = 0;
        const p = snd.play();
        if (p !== undefined) {
            p.catch(e => console.log("Звук не запустился:", e));
        }
    }

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






