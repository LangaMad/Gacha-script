// ——— НАСТРОЙКИ ———
const items = {
    blue: ["Значок", "Пин"],
    purple: ["Маленький брелок"],
    orange: ["Чай", "Большой брелок", "Фигурка"]
};

const rarityWeights = {
    blue: 80,
    purple: 12,
    orange: 2
};

const rarityVideos = {
    blue: "videos/star_blue.mp4",
    purple: "videos/star_purple.mp4",
    orange: "videos/star_orange.mp4"
};

// Путь к иконкам (ты сам подставишь свои PNG)
function getItemIcon(name) {
    return `images/cate.jpg`; // например: icons/Кольцо.png
}

// ——— ЭЛЕМЕНТЫ ———
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const starVideo = document.getElementById("starVideo");
const resultDiv = document.getElementById("result");
const itemNameEl = document.querySelector(".item-name");
const itemIcon = document.getElementById("itemIcon");

document.getElementById("againButton").addEventListener("click", () => {
    resultDiv.classList.add("hidden");
    startScreen.classList.remove("hidden");
});

document.getElementById("closeButton").addEventListener("click", () => {
    resultDiv.classList.add("hidden");
    startScreen.classList.remove("hidden");
});

// ——— ЛОГИКА СПИНА ———
startButton.addEventListener("click", spinLottery);

function spinLottery() {
    startScreen.classList.add("hidden");

    // Выбор редкости
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

    // Случайный предмет
    const list = [...items[chosenRarity]];
    const item = list[Math.floor(Math.random() * list.length)];

    // // Если Мику выпала — удаляем
    // if (item.includes("Мику")) {
    //     items[chosenRarity] = items[chosenRarity].filter(i => i !== item);
    // }

    // Проиграть видео
    starVideo.src = rarityVideos[chosenRarity];
    starVideo.classList.remove("hidden");
    starVideo.play();

    starVideo.onended = () => {
        starVideo.classList.add("hidden");

        // Показать результат
        winTitleEl.classList.remove('win-title-blue', 'win-title-purple', 'win-title-orange');

        // Добавляем класс в зависимости от редкости
        if (chosenRarity === 'blue') {
            winTitleEl.classList.add('win-title-blue');
        } else if (chosenRarity === 'purple') {
            winTitleEl.classList.add('win-title-purple');
        } else if (chosenRarity === 'orange') {
            winTitleEl.classList.add('win-title-orange');
        }
        
        // Показать результат
        itemNameEl.textContent = item;
        resultDiv.classList.remove("hidden");
    };
}

// ——— РЕДКОЕ ВИДЕО НА СТАРТОВОМ ЭКРАНЕ ———
function playRandomRareVideo() {
    if (!startScreen.classList.contains("hidden")) {

        const rare = Math.random() < 0.5 ? "star_purple.mp4" : "star_orange.mp4";

        starVideo.src = "videos/" + rare;
        starVideo.classList.remove("hidden");
        starVideo.play();

        starVideo.onended = () => {
            starVideo.classList.add("hidden");
        };
    }

    // следующее время: от 5 до 10 минут
    const next = 1000 * 60 * (5 + Math.random() * 5);
    setTimeout(playRandomRareVideo, next);
}

setTimeout(playRandomRareVideo, 30000); // первым спустя 30 секунд
