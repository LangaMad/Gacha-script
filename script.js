// ——— НАСТРОЙКИ ———
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

const rarityVideos = {
    blue: "videos/star_blue.mp4",
    purple: "videos/star_purple.mp4",
    orange: "videos/star_orange.mp4"
};


const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const starVideo = document.getElementById("starVideo");
const resultDiv = document.getElementById("result");
const winTitleEl = document.querySelector(".win-title");
const itemNameEl = document.querySelector(".item-name");


document.getElementById("closeButton").addEventListener("click", () => {
    resultDiv.classList.add("hidden");
    startScreen.classList.remove("hidden");
});


startButton.addEventListener("click", spinLottery);

function spinLottery() {
    startScreen.classList.add("hidden");


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


    const list = [...items[chosenRarity]];
    const item = list[Math.floor(Math.random() * list.length)];


    if (item.includes("Мику")) {
        items[chosenRarity] = items[chosenRarity].filter(i => i !== item);
    }


    starVideo.src = rarityVideos[chosenRarity];
    starVideo.classList.remove("hidden");
    starVideo.play();

    starVideo.onended = () => {
        starVideo.classList.add("hidden");
        itemNameEl.classList.remove('item-name-blue', 'item-name-purple', 'item-name-orange');
        itemNameEl.classList.add(`item-name-${chosenRarity}`);
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
