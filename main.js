function renderCard(name, url, img) {
    const appList = document.getElementById('app-list');

    appList.innerHTML += `
        <div
            class="card"
            onclick="window.location.href='${url}'"
        >
            <div class="vignette-edges" style="background-image: url('${img}')"></div>

            <span>${name}</span>
        </div>
    `;
}

const favicon =
    document.querySelector('link[rel="icon"]') ??
    (() => {
        const link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
        return link;
    })();

const frames = Array.from({ length: 105 }, (_, i) => {
    const delay =
        i === 104
            ? "0.06"
            : i % 3 === 1
            ? "0.06"
            : "0.07";

    return `/icons/frame_${String(i).padStart(3, "0")}_delay-${delay}s_ico_32x32.ico`;
});

function getDelay(filename) {
    return parseFloat(
        filename.match(/delay-(\d+(?:\.\d+)?)s/)[1]
    ) * 1000;
}

async function animateFavicon() {
    while (true) {
        for (const frame of frames) {
            favicon.href = frame;

            await new Promise(resolve =>
                setTimeout(resolve, getDelay(frame))
            );
        }
    }
}

async function changeTitle() {
    let state = false;

    while (true) {
        state = !state;

        document.title = state
            ? "🔴THIS PERSON PLAYING GAMES🟡"
            : "🟡THIS PERSON PLAYING GAMES🔴";

        await new Promise(resolve =>
            setTimeout(resolve, 100)
        );
    }
}

function renderGames(games) {
    games.forEach(game => {
        renderCard(
            game.name,
            new URL(game.url).pathname,
            new URL(game.img).pathname
        );
    });
}

async function getGames() {
    const response = await fetch('games.json');
    return await response.json();
}

async function init() {
    const gamesList = await getGames();
    gamesList.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    renderGames(gamesList);

    animateFavicon();
    changeTitle();
}

init();