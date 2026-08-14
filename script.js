import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    collection,
    getDocs,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyA14EEPgj71NrbHo_yLmgPZdgfVeCVBkfQ",
    authDomain: "agni-572a5.firebaseapp.com",
    projectId: "agni-572a5",
    storageBucket: "agni-572a5.firebasestorage.app",
    messagingSenderId: "302971641868",
    appId: "1:302971641868:web:ed91fa94d2e939bc114e29",
    measurementId: "G-G2H5WZ8NVH"
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

    const page =
        document.getElementById(id);

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
   FIREBASE ERROR
===================================================== */

function firebaseError(error) {

    console.error(error);

    if (error.code === "auth/invalid-phone-number")
        return "Invalid phone number.";

    if (error.code === "auth/too-many-requests")
        return "Too many attempts. Try again later.";

    if (error.code === "auth/invalid-verification-code")
        return "Invalid OTP.";

    if (error.code === "auth/code-expired")
        return "OTP expired. Request a new OTP.";

    if (error.code === "auth/quota-exceeded")
        return "SMS quota exceeded.";

    if (error.code === "permission-denied")
        return "Firebase permission denied. Check Firestore Rules.";

    return error.message || "Something went wrong.";
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
   REGISTER
===================================================== */

async function sendRegisterOTP() {

    showError("registerError", "");

    const name =
        document.getElementById("registerName").value.trim();

    const phone =
        document.getElementById("registerPhone").value.trim();

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
                "Number already registered. Please login."
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
            .classList.remove("hidden");

        showError(
            "registerError",
            "OTP sent successfully."
        );

    } catch (error) {

        showError(
            "registerError",
            firebaseError(error)
        );

    }
}


async function verifyRegisterOTP() {

    const name =
        document.getElementById("registerName").value.trim();

    const otp =
        document.getElementById("registerOtp").value.trim();

    if (!registerConfirmation) {

        showError(
            "registerError",
            "Please request OTP first."
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
            doc(db, "users", user.uid),
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

        showError(
            "registerError",
            firebaseError(error)
        );

    }
}


/* =====================================================
   LOGIN
===================================================== */

async function sendLoginOTP() {

    showError("loginError", "");

    const phone =
        document.getElementById("loginPhone").value.trim();

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
                "Number not registered."
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
            .classList.remove("hidden");

        showError(
            "loginError",
            "OTP sent successfully."
        );

    } catch (error) {

        showError(
            "loginError",
            firebaseError(error)
        );

    }
}


async function verifyLoginOTP() {

    const otp =
        document.getElementById("loginOtp").value.trim();

    if (!loginConfirmation) {

        showError(
            "loginError",
            "Please request OTP first."
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

        showError(
            "loginError",
            firebaseError(error)
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
   ROOM CODE
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


/* =====================================================
   CREATE ROOM
===================================================== */

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

        let roomCheck =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    teacherCode
                )
            );

        while (roomCheck.exists()) {

            teacherCode =
                generateCode();

            roomCheck =
                await getDoc(
                    doc(
                        db,
                        "rooms",
                        teacherCode
                    )
                );
        }

        while (
            studentCode ===
            teacherCode
        ) {

            studentCode =
                generateCode();
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


        showPage(
            "roomCreatedPage"
        );

    } catch (error) {

        showError(
            "createError",
            firebaseError(error)
        );

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

        /* First check teacher code */

        let roomSnapshot =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    code
                )
            );


        let actualRoomCode = code;
        let room = null;


        if (roomSnapshot.exists()) {

            room =
                roomSnapshot.data();

            if (
                room.teacherCode !==
                code
            ) {

                room = null;

            } else {

                isHost =
                    room.hostUid ===
                    currentUser.uid;

            }
        }


        /* If not teacher code,
           search student code */

        if (!room) {

            const roomsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "rooms"
                    )
                );

            roomsSnapshot.forEach(
                item => {

                    const data =
                        item.data();

                    if (
                        data.studentCode ===
                        code
                    ) {

                        room =
                            data;

                        actualRoomCode =
                            item.id;

                        isHost = false;

                    }

                }
            );

        }


        if (!room) {

            showError(
                "joinError",
                "Invalid room code."
            );

            return;
        }


        currentRoomCode =
            actualRoomCode;


        /* Add member */

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
                    currentRoomCode
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

        showError(
            "joinError",
            firebaseError(error)
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

    showPage(
        "classroomPage"
    );


    document
        .getElementById("teacherArea")
        .classList
        .toggle(
            "hidden",
            !isHost
        );


    listenToRoom();
}


/* =====================================================
   REAL TIME
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
                    "Unable to load classroom."
                );

            }
        );
}


/* =====================================================
   RENDER ROOM
===================================================== */

function renderRoom(room) {

    document
        .getElementById(
            "classNameDisplay"
        )
        .textContent =
        room.name;


    document
        .getElementById(
            "classCodeDisplay"
        )
        .textContent =
        "Room Code: " +
        currentRoomCode;


    document
        .getElementById(
            "studentName"
        )
        .textContent =
        currentUserData.name;


    document
        .getElementById(
            "memberCount"
        )
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


    if (myHand) {

        button.textContent =
            "✋ Hand Raised";

        button.classList.add(
            "handRaised"
        );

        document
            .getElementById(
                "handStatus"
            )
            .textContent =
            "Your hand is raised.";

    } else {

        button.textContent =
            "✋ Raise Hand";

        button.classList.remove(
            "handRaised"
        );

        document
            .getElementById(
                "handStatus"
            )
            .textContent = "";

    }


    renderRanking(
        raisedHands
    );


    renderQuestions(
        room.questions || []
    );
}


/* =====================================================
   RAISE / LOWER HAND
=====================================
