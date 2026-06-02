import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDUgTAyO5NgAPv6G9peylTBvIyem7sMF0w",
  authDomain: "zawgtwinmeh.firebaseapp.com",
  projectId: "zawgtwinmeh",
  storageBucket: "zawgtwinmeh.appspot.com",
  messagingSenderId: "655399885638",
  appId: "1:655399885638:web:cc8d2e24ba1418ee466347",
  measurementId: "G-5EBBM23JWD"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

const gameArea = document.getElementById("game-area");
const startPage = document.getElementById("start-page");

const usernameInput = document.getElementById("un-li");
const passwordInput = document.getElementById("pw-li");
const loginButton = document.querySelector("#login-section button");

let allGames = [];
let userSettings = {};

function closeGame(){
    window.close();
}

const commandStartTime = Date.now();

function listenForCommands(uid){

    const ref = collection(db,"users",uid,"commands");

    onSnapshot(ref, snap => {

        snap.docChanges().forEach(async change => {

            if(change.type === "added"){

                const data = change.doc.data();

                if(!data.created || data.created < commandStartTime) return;
                await deleteDoc(change.doc.ref);

                if(data.type === "signout"){
                    signOut(auth);
                }

            }

        });

    });

}

async function sendAdminMessage(uid, message){

    await setDoc(
        doc(db, "users", uid, "notifications", Date.now().toString()),
        {
            message: message,
            read: false,
            timestamp: Date.now()
        }
    );

}

window.addEventListener("beforeunload", async () => {

    const user = auth.currentUser;
    if(!user) return;

    await updateDoc(doc(db,"users",user.uid),{
        online: false,
        lastSeen: Date.now()
    });

});

async function msg(username, message){

    const q = query(
        collection(db,"users"),
        where("username","==",username)
    );

    const snap = await getDocs(q);

    if(snap.empty){
        console.log("user not found");
        return;
    }

    const uid = snap.docs[0].id;

    await sendAdminMessage(uid,message);

    console.log("sent to",username,uid);

}

function checkRam() {
    if ('deviceMemory' in navigator) {
        return navigator.deviceMemory >= 6;
    }
    return true;
}


function listenForAdminMessages(user){

    const notifRef = collection(db, "users", user.uid, "notifications");

    onSnapshot(notifRef, (snapshot) => {

        snapshot.docChanges().forEach(async (change) => {

            if (change.type === "added" && !change.doc.metadata.hasPendingWrites) {

                const data = change.doc.data();

                if (!data.read) {
                    alert(data.message);
                    await deleteDoc(change.doc.ref);
                }

            }

        });

    });

}

async function showFakeGames() {

    const gamesRes = await fetch("https://raw.githubusercontent.com/ilovebananasoup/andrewlovesmillie/refs/heads/main/games.json");

    const baseGames = await gamesRes.json();

    const allGames = [
        ...baseGames,
    ].sort((a, b) => a.name.localeCompare(b.name));

    allGames.forEach(game => {
        game.url = "haha you thought";
    });

    renderGames(allGames);
}

showFakeGames()

async function initGames(user) {

    const [gamesRes, snap] = await Promise.all([
        fetch("https://raw.githubusercontent.com/ilovebananasoup/andrewlovesmillie/refs/heads/main/games.json"),
        getDoc(doc(db,"users",user.uid))
    ]);

    const baseGames = await gamesRes.json();
    userSettings = snap.data() || {};

    allGames = [
        ...baseGames,
        ...(userSettings.customGames || [])
    ].sort((a,b)=>a.name.localeCompare(b.name));

    renderGames(allGames);
}

function renderGames(games){

    const eightgigs = checkRam();
    gameArea.innerHTML = "";

    games.forEach(game => {

        if(!eightgigs && game.needs8gbRam) return;

        const gameDiv = document.createElement("div");
        gameDiv.addEventListener("contextmenu", (e) => {

            e.preventDefault();

            if (!game.custom) return;

            if (!confirm(`Delete "${game.name}"?`)) return;

            deleteCustomGame(game.id);

        });
        gameDiv.className = "game";

        if (game.id) {
            gameDiv.dataset.id = game.id;
        }

        const imgDiv = document.createElement("div");
        imgDiv.className = "game-img";
        imgDiv.style.backgroundImage = `url('${game.img}')`;

        const titleDiv = document.createElement("div");
        titleDiv.className = "game-title";
        titleDiv.textContent = game.name;

        gameDiv.onclick = () => openGame(game.url);

        gameDiv.append(imgDiv,titleDiv);
        gameArea.appendChild(gameDiv);

    });
}

function searchGames(search){

    const filtered = allGames.filter(game =>
        game.name.toLowerCase().includes(search.toLowerCase())
    );

    renderGames(filtered);
}



function openGame(url) {
    const uid = auth.currentUser?.uid;

    const win = window.open("", "_blank");
    if (!win) return;

    const doc = win.document;

    window.addEventListener("message",(e)=>{

    if(e.data === "closegame"){
        closeGame();
    }

    if(e.data === "signout"){
        signOut(auth);
        closeGame();
    }

});

    doc.open();
    doc.write(`
<!DOCTYPE html>
<html>
<head>
<title>Dashboard</title>
<link rel="icon" type="image/x-icon" href="https://andrewlovesmillie.com/assets/icons/canvas.ico"></head>

<style>
html,body{
    margin:0;
    height:100%;
    overflow:hidden;
}
iframe{
    width:100%;
    height:100%;
    border:none;
}
</style>
</head>

<body>

<iframe src="${url}?uid=${uid}" sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin"></iframe>
<script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUgTAyO5NgAPv6G9peylTBvIyem7sMF0w",
  authDomain: "zawgtwinmeh.firebaseapp.com",
  projectId: "zawgtwinmeh",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function runCommand(cmd){

    if(cmd.type === "closegame"){
        window.close();
    }

    if(cmd.type === "signout"){
        signOut(auth);
        window.close();
    }

    if(cmd.type === "message"){
        alert(cmd.message);
    }

}

function listenForCommands(uid){

    const ref = collection(db,"users",uid,"commands");

    onSnapshot(ref, snap => {

        snap.docChanges().forEach(async change => {

            if(change.type !== "added") return;

            const data = change.doc.data();

            await deleteDoc(change.doc.ref);

            runCommand(data);

        });

    });

}

onAuthStateChanged(auth,(user)=>{

    if(user){
        listenForCommands(user.uid);
    }

});

</script>

</body>
</html>
    `);
    doc.close();
}

document.getElementById('search-bar')
.addEventListener("input", () => {
    searchGames(document.getElementById('search-bar').value)
});

function emailFromUsername(username){
    return username + "@blapowpow.com";
}

async function login(username, password){

    const email = emailFromUsername(username);

    try{

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("logged in:", userCredential.user.uid);

    }catch(err){

        if(
            err.code === "auth/user-not-found" ||
            err.code === "auth/invalid-login-credentials"
        ){

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            console.log("created account:", userCredential.user.uid);

            await saveSettings(userCredential.user, {
                username: username,
                favorites: [],
                customGames: [],
                created: Date.now()
            });

        }else{
            alert(err.message);
        }

    }

}

async function signup(username, password){

    const email = emailFromUsername(username);

    try{

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        console.log("account created:", userCredential.user.uid);

        await saveSettings(userCredential.user, {
            username: username,
            favorites: [],
            customGames: [],
            created: Date.now()
        });

    }catch(err){
        alert(err.message);
    }

}

async function logout(){
    await signOut(auth);
}

async function saveSettings(user, settings){
    await setDoc(doc(db,"users",user.uid),settings,{merge:true});
}

loginButton.onclick = async () => {

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if(!username || !password){
        alert("enter username and password");
        return;
    }

    await login(username,password);

};

async function setOnline(user){
    await updateDoc(doc(db,"users",user.uid),{
        online: true,
        lastSeen: Date.now()
    });
}

onAuthStateChanged(auth, async (user) => {

    if (user) {

        try {
            await user.getIdToken(true);
            await user.reload();
        } catch (err) {
            console.log("Account no longer exists or token invalid");
            await signOut(auth);
            location.reload();
            return;
        }

        const snap = await getDoc(doc(db,"users",user.uid));

        if(snap.data()?.banned){
            alert(snap.data().banMessage || "You are banned");
            await signOut(auth);
            return;
        }

        console.log("logged in:",user.uid);

        startPage.style.display = "none";

        listenForCommands(user.uid);

        setOnline(user);

        initGames(user);
        loadSettings(user);
        watchBan(user);

        listenForAdminMessages(user);

    } else {

        console.log("not logged in");
        startPage.style.display = "flex";

    }

});

function watchBan(user){

    const ref = doc(db,"users",user.uid);

    onSnapshot(ref,(snap)=>{

        const data = snap.data();

        if(data?.banned){

            alert(data.banMessage || "You are banned");

            signOut(auth);

            location.reload();

        }

    });

}

async function loadSettings(user){

    const ref = doc(db,"users",user.uid);
    const snap = await getDoc(ref);

    if(!snap.exists()) return;

}

async function addCustomGame(name, url, img, id) {

    const ref = doc(db,"users",auth.currentUser.uid);
    const snap = await getDoc(ref);

    const data = snap.data() || {};

    if (!data.customGames) {
        data.customGames = [];
    }

    data.customGames.push({
        name: name,
        url: url,
        img: img,
        needs8gbRam: false,
        id: id,
        custom: true
    });

    await saveSettings(auth.currentUser,{ customGames: data.customGames });

    initGames(auth.currentUser);
}

async function deleteCustomGame(id) {

    const ref = doc(db,"users",auth.currentUser.uid);
    const snap = await getDoc(ref);

    const data = snap.data() || {};

    if (!data.customGames) return;

    data.customGames = data.customGames.filter(game => game.id !== id);

    await saveSettings(auth.currentUser, { customGames: data.customGames });

    initGames(auth.currentUser);

}

const fileInput = document.getElementById('gamePictureInput');
const label = document.getElementById('gamePictureInputLabel');
const fileNameDisplay = document.getElementById('fileNameDisplay');

function setFile(file) {

    if (!file) {
        fileNameDisplay.textContent = "No file selected";
        label.style.backgroundImage = "";
        return;
    }

    fileNameDisplay.textContent = file.name;

    const reader = new FileReader();

    reader.onload = (e) => {

        label.style.backgroundImage = `url('${e.target.result}')`;
        label.style.backgroundSize = "cover";
        label.style.backgroundPosition = "center";

    };

    reader.readAsDataURL(file);
}

fileInput.addEventListener("change", () => {
    setFile(fileInput.files[0]);
});

label.addEventListener("dragover", e => {
    e.preventDefault();
    label.classList.add("dragover");
});

label.addEventListener("dragleave", () => {
    label.classList.remove("dragover");
});

label.addEventListener("drop", e => {

    e.preventDefault();
    label.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (!file) return;

    fileInput.files = e.dataTransfer.files;
    setFile(file);

});

const addGameName = document.getElementById('ag-name');
const addGameURL = document.getElementById('ag-url');
const addGameSubmit = document.getElementById('ag-submit-btn');

function resetAddGameForm(){

    fileInput.value = "";
    fileNameDisplay.textContent = "No file selected";
    label.style.backgroundImage = "";
    addGameName.value = "";
    addGameURL.value = "";

}

const addGameModalWrapper = document.getElementById("add-game-wrapper");

addGameModalWrapper.addEventListener("click", (e) => {

    if (e.target === addGameModalWrapper) {
        addGameModalWrapper.classList.remove("visible");
        resetAddGameForm();
    }

});

const addGameBtn = document.getElementById("add-game-btn");

addGameBtn.addEventListener("click", () => {
    addGameModalWrapper.classList.toggle('visible');
});



addGameSubmit.addEventListener("click", async () => {

    const file = fileInput.files[0];

    if (!file) {

        addCustomGame(
            addGameName.value,
            addGameURL.value,
            "",
            crypto.randomUUID()
        );

        return;
    }

    if (file.size > 500000) {
        alert("Image too large (max 500KB)");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        const base64 = reader.result;

        addCustomGame(
            addGameName.value,
            addGameURL.value,
            base64,
            crypto.randomUUID()
        );

    };

    reader.readAsDataURL(file);


});

window.logout = logout;
