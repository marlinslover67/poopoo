
    function openSite(url) {

        const win = window.open('', '_blank');
        if (!win) return;

        const doc = win.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>hi</title>
                <link rel="icon" href="">
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <iframe src="${url}"></iframe>
            </body>
            </html>
        `);
        doc.close();
    }

function renderCard(name, url, img) {
    const appList = document.getElementById('app-list');

    appList.innerHTML += `
        <div
            class="card"
            onclick='openSite("${url}")'
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

    return `icons/frame_${String(i).padStart(3, "0")}_delay-${delay}s_ico_32x32.ico`;
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
            //new URL(new URL(game.url).pathname,"").href,
            //new URL(new URL(game.img).pathname,"").href
            "." + new URL(game.url).pathname,
            "." + new URL(game.img).pathname
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

const searchBar = document.getElementById("universal-search");

searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
        card.style.display =
            card.textContent.toLowerCase().includes(query)
                ? ""
                : "none";
    });
});

searchBar.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;

    const value = searchBar.value.trim();

    if (!value) return;

    const visibleCards = [...document.querySelectorAll(".card")]
        .filter(card => card.style.display !== "none");

    if (visibleCards.length === 1) {
        visibleCards[0].click();
        return;
    }

    let url = value;

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.includes(".")
    ) {
        if (!value.startsWith("http")) {
            url = "https://" + value;
        }

        openSite(url);
    } else {
        alert("type in an actual url bro");
    }
});

init();