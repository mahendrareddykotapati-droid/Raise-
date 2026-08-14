import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   🔥 PASTE YOUR FIREBASE CONFIG HERE
===================================================== */

const firebaseConfig = {

    apiKey: "PASTE_YOUR_API_KEY",

    authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",

    projectId: "PASTE_YOUR_PROJECT_ID",

    storageBucket: "PASTE_YOUR_STORAGE_BUCKET",

    messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",

    appId: "PASTE_YOUR_APP_ID"
};


/* =====================================================
   FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =====================================================
   VARIABLES
===================================================== */

let currentUser = null;
let currentUserData = null;

let currentRoomCode = null;
let isHost = false;

let loginConfirmation = null;
let registerConfirmation = null;

let loginRecaptcha = null;
let registerRecaptcha = null;

let unsubscribeRoom = null;


/* =====================================================
   PAGE
===================================================== */

function showPage(id) {

    document
        .querySelectorAll(".page, .classroom-page")
        .forEach(page => {
            page.classList.add("hidden");
        });

    const page = document.getElementById(id);

    if (page) {
        page.classList.remove("hidden");
    }
}


/* =====================================================
   ERROR
===================================================== */

function showError(id, message) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = message;
    }
}


/* =====================================================
   PHONE
===================================================== */

function validPhone(phone) {

    return /^[0-9]{10}$/.test(phone);
}

function firebasePhone(phone) {

    return "+91" + phone;
}


/* =====================================================
   LOGIN RECAPTCHA
===================================================== */

async function setupLoginRecaptcha() {

    if (loginRecaptcha) {
        try {
            loginRecaptcha.clear();
        } catch (e) {}
    }

    loginRecaptcha =
        new RecaptchaVerifier(
            auth,
            "loginRecaptcha",
            {
                size: "normal"
            }
        );

    await loginRecaptcha.render();

    return loginRecaptcha;
}


/* =====================================================
   REGISTER RECAPTCHA
===================================================== */

async function setupRegisterRecaptcha() {

    if (registerRecaptcha) {
        try {
            registerRecaptcha.clear();
        } catch (e) {}
    }

    registerRecaptcha =
        new RecaptchaVerifier(
            auth,
            "registerRecaptcha",
            {
                size: "normal"
            }
        );

    await registerRecaptcha.render();

    return registerRecaptcha;
}


/* =====================================================
   REGISTER OTP
===================================================== */

async function sendRegisterOTP() {

    showError("registerError", "");

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();

    const phone =
        document
            .getElementById("registerPhone")
            .value
            .trim();

    if (!name) {
        showError(
            "registerError",
            "Please enter your name."
        );
        return;
    }

    if (!validPhone(phone)) {
        showError(
            "registerError",
            "Enter a valid 10-digit mobile number."
        );
        return;
    }

    try {

        const phoneNumber =
            firebasePhone(phone);

        const existing =
            await getDoc(
                doc(
                    db,
                    "phoneUsers",
                    phoneNumber
                )
            );

        if (existing.exists()) {

            showError(
                "registerError",
                "This number is already registered. Please sign in."
            );

            return;
        }

        await setupRegisterRecaptcha();

        registerConfirmation =
            await signInWithPhoneNumber(
                auth,
                phoneNumber,
                registerRecaptcha
            );

        document
            .getElementById("registerOtpBox")
            .classList
            .remove("hidden");

        showError(
            "registerError",
            "OTP sent successfully."
        );

    } catch (error) {

        console.error(error);

        showError(
            "registerError",
            getFirebaseError(error)
        );

        registerRecaptcha = null;
    }
}


/* =====================================================
   VERIFY REGISTER OTP
===================================================== */

async function verifyRegisterOTP() {

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();

    const otp =
        document
            .getElementById("registerOtp")
            .value
            .trim();

    if (!registerConfirmation) {

        showError(
            "registerError",
            "Please request an OTP first."
        );

        return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {

        showError(
            "registerError",
            "Enter the 6-digit OTP."
        );

        return;
    }

    try {

        const result =
            await registerConfirmation.confirm(otp);

        const user =
            result.user;

        const userData = {

            uid: user.uid,

            name: name,

            phone: user.phoneNumber,

            createdAt: serverTimestamp()
        };

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            userData
        );

        await setDoc(
            doc(
                db,
                "phoneUsers",
                user.phoneNumber
            ),
            {
                uid: user.uid,
                name: name
            }
        );

        currentUser = user;

        currentUserData = userData;

        showHome();

    } catch (error) {

        console.error(error);

        showError(
            "registerError",
            "Invalid OTP. Please try again."
        );
    }
}


/* =====================================================
   LOGIN OTP
===================================================== */

async function sendLoginOTP() {

    showError("loginError", "");

    const phone =
        document
            .getElementById("loginPhone")
            .value
            .trim();

    if (!validPhone(phone)) {

        showError(
            "loginError",
            "Enter a valid 10-digit mobile number."
        );

        return;
    }

    try {

        const phoneNumber =
            firebasePhone(phone);

        const existing =
            await getDoc(
                doc(
                    db,
                    "phoneUsers",
                    phoneNumber
                )
            );

        if (!existing.exists()) {

            showError(
                "loginError",
                "Number not registered. Create an account first."
            );

            return;
        }

        await setupLoginRecaptcha();

        loginConfirmation =
            await signInWithPhoneNumber(
                auth,
                phoneNumber,
                loginRecaptcha
            );

        document
            .getElementById("loginOtpBox")
            .classList
            .remove("hidden");

        showError(
            "loginError",
            "OTP sent successfully."
        );

    } catch (error) {

        console.error(error);

        showError(
            "loginError",
            getFirebaseError(error)
        );

        loginRecaptcha = null;
    }
}


/* =====================================================
   VERIFY LOGIN OTP
===================================================== */

async function verifyLoginOTP() {

    const otp =
        document
            .getElementById("loginOtp")
            .value
            .trim();

    if (!loginConfirmation) {

        showError(
            "loginError",
            "Please request an OTP first."
        );

        return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {

        showError(
            "loginError",
            "Enter the 6-digit OTP."
        );

        return;
    }

    try {

        const result =
            await loginConfirmation.confirm(otp);

        currentUser =
            result.user;

        const userDoc =
            await getDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                )
            );

        if (!userDoc.exists()) {

            await signOut(auth);

            showError(
                "loginError",
                "Account data not found."
            );

            return;
        }

        currentUserData =
            userDoc.data();

        showHome();

    } catch (error) {

        console.error(error);

        showError(
            "loginError",
            "Invalid OTP. Please try again."
        );
    }
}


/* =====================================================
   HOME
===================================================== */

function showHome() {

    if (!currentUserData) {

        showPage("loginPage");

        return;
    }

    showPage("homePage");

    document
        .getElementById("welcomeText")
        .textContent =
        "Welcome, " +
        currentUserData.name +
        " 👋";
}


/* =====================================================
   CREATE ROOM
===================================================== */

function generateCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];
    }

    return code;
}


async function createRoom() {

    const roomName =
        document
            .getElementById("roomName")
            .value
            .trim();

    if (!roomName) {

        showError(
            "createError",
            "Enter a room name."
        );

        return;
    }

    try {

        let teacherCode =
            generateCode();

        let studentCode =
            generateCode();

        while (studentCode === teacherCode) {
            studentCode = generateCode();
        }

        let roomDoc =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    teacherCode
                )
            );

        while (roomDoc.exists()) {

            teacherCode = generateCode();

            roomDoc =
                await getDoc(
                    doc(
                        db,
                        "rooms",
                        teacherCode
                    )
                );
        }

        const room = {

            name: roomName,

            hostUid:
                currentUser.uid,

            hostName:
                currentUserData.name,

            teacherCode:
                teacherCode,

            studentCode:
                studentCode,

            members: [
                {
                    uid:
                        currentUser.uid,

                    name:
                        currentUserData.name,

                    role:
                        "host"
                }
            ],

            raisedHands: [],

            questions: [],

            createdAt:
                serverTimestamp()
        };

        await setDoc(
            doc(
                db,
                "rooms",
                teacherCode
            ),
            room
        );

        currentRoomCode =
            teacherCode;

        isHost = true;

        document
            .getElementById("createdRoomName")
            .textContent =
            roomName;

        document
            .getElementById("teacherCode")
            .textContent =
            teacherCode;

        document
            .getElementById("studentCode")
            .textContent =
            studentCode;

        showPage("roomCreatedPage");

    } catch (error) {

        console.error(error);

        showError(
            "createError",
            getFirebaseError(error)
        );
    }
}


/* =====================================================
   COPY
===================================================== */

async function copyText(id) {

    const text =
        document
            .getElementById(id)
            .textContent;

    try {

        await navigator.clipboard.writeText(text);

        alert("Code copied!");

    } catch (error) {

        alert(text);
    }
}


/* =====================================================
   JOIN ROOM
===================================================== */

async function joinRoom() {

    const code =
        document
            .getElementById("roomCodeInput")
            .value
            .trim()
            .toUpperCase();

    if (!code) {

        showError(
            "joinError",
            "Enter a room code."
        );

        return;
    }

    try {

        const roomDoc =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    code
                )
            );

        if (!roomDoc.exists()) {

            showError(
                "joinError",
                "Room not found."
            );

            return;
        }

        const room =
            roomDoc.data();

        currentRoomCode =
            code;

        if (code === room.teacherCode) {

            isHost =
                room.hostUid ===
                currentUser.uid;

        } else if (code === room.studentCode) {

            isHost = false;

        } else {

            showError(
                "joinError",
                "Invalid room code."
            );

            return;
        }

        const members =
            room.members || [];

        const alreadyMember =
            members.some(
                member =>
                    member.uid ===
                    currentUser.uid
            );

        if (!alreadyMember) {

            await updateDoc(
                doc(
                    db,
                    "rooms",
                    code
                ),
                {
                    members:
                        arrayUnion({
                            uid:
                                currentUser.uid,

                            name:
                                currentUserData.name,

                            role:
                                isHost
                                    ? "host"
                                    : "student"
                        })
                }
            );
        }

        openClassroom(
            currentRoomCode,
            isHost
        );

    } catch (error) {

        console.error(error);

        showError(
            "joinError",
            getFirebaseError(error)
        );
    }
}


/* =====================================================
   OPEN CLASSROOM
===================================================== */

function openClassroom(
    roomCode,
    host
) {

    currentRoomCode =
        roomCode;

    isHost =
        host;

    showPage("classroomPage");

    document
        .getElementById("teacherArea")
        .classList
        .toggle("hidden", !isHost);

    listenToRoom();
}


/* =====================================================
   REAL TIME ROOM
===================================================== */

function listenToRoom() {

    if (unsubscribeRoom) {
        unsubscribeRoom();
    }

    const roomRef =
        doc(
            db,
            "rooms",
            currentRoomCode
        );

    unsubscribeRoom =
        onSnapshot(
            roomRef,
            snapshot => {

                if (!snapshot.exists()) {

                    alert(
                        "Room no longer exists."
                    );

                    showHome();

                    return;
                }

                renderRoom(
                    snapshot.data()
                );
            },
            error => {

                console.error(error);

                alert(
                    "Unable to read classroom."
                );
            }
        );
}


/* =====================================================
   RENDER ROOM
===================================================== */

function renderRoom(room) {

    document
        .getElementById("classNameDisplay")
        .textContent =
        room.name;

    document
        .getElementById("classCodeDisplay")
        .textContent =
        "Room Code: " +
        currentRoomCode;

    document
        .getElementById("studentName")
        .textContent =
        currentUserData.name;

    document
        .getElementById("memberCount")
        .textContent =
        (room.members || []).length;

    const raisedHands =
        room.raisedHands || [];

    const myHand =
        raisedHands.some(
            hand =>
                hand.uid ===
                currentUser.uid
        );

    const button =
        document.getElementById(
            "raiseHandButton"
        );

    const status =
        document.getElementById(
            "handStatus"
        );

    if (myHand) {

        button.textContent =
            "✋ Hand Raised";

        button.classList.add(
            "handRaised"
        );

        status.textContent =
            "Your hand is raised.";

    } else {

        button.textContent =
            "✋ Raise Hand";

        button.classList.remove(
            "handRaised"
        );

        status.textContent = "";
    }

    renderRanking(
        raisedHands,
        room.members || []
    );

    renderQuestions(
        room.questions || []
    );
}


/* =====================================================
   RAISE HAND
===================================================== */

async function raiseHand() {

    if (!currentRoomCode) return;

    try {

        const roomRef =
            doc(
                db,
                "rooms",
                currentRoomCode
            );

        const roomDoc =
            await getDoc(roomRef);

        if (!roomDoc.exists()) return;

        const room =
            roomDoc.data();

        const raisedHands =
            room.raisedHands || [];

        const alreadyRaised =
            raisedHands.some(
                hand =>
                    hand.uid ===
                    currentUser.uid
            );

        if (alreadyRaised) return;

        const hand = {

            uid:
                currentUser.uid,

            name:
                currentUserData.name,

            raisedAt:
                Date.now()
        };

        await updateDoc(
            roomRef,
            {
                raised
