/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
   REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    projectId: "YOUR_PROJECT_ID",

    storageBucket: "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

    appId: "YOUR_APP_ID"

};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


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
   PAGE CONTROL
===================================================== */

function showPage(id) {

    document
        .querySelectorAll(".page, .classroom-page")
        .forEach(page => {

            page.classList.add("hidden");

        });

    document
        .getElementById(id)
        .classList.remove("hidden");
}


/* =====================================================
   ERROR
===================================================== */

function errorMessage(id, message) {

    const element =
        document.getElementById(id);

    element.textContent = message;
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

function setupLoginRecaptcha() {

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

    return loginRecaptcha.render();
}


/* =====================================================
   REGISTER RECAPTCHA
===================================================== */

function setupRegisterRecaptcha() {

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

    return registerRecaptcha.render();
}


/* =====================================================
   REGISTER — SEND OTP
===================================================== */

async function sendRegisterOTP() {

    errorMessage(
        "registerError",
        ""
    );

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

        errorMessage(
            "registerError",
            "Please enter your name."
        );

        return;
    }


    if (!validPhone(phone)) {

        errorMessage(
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

            errorMessage(
                "registerError",
                "This number is already registered. Please sign in."
            );

            return;
        }


        if (!registerRecaptcha) {

            await setupRegisterRecaptcha();

        }


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


        errorMessage(
            "registerError",
            "OTP sent successfully."
        );

    } catch (error) {

        console.error(error);

        errorMessage(
            "registerError",
            error.message
        );

        registerRecaptcha = null;

    }

}


/* =====================================================
   REGISTER — VERIFY OTP
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

        errorMessage(
            "registerError",
            "Please request an OTP first."
        );

        return;
    }


    if (!/^[0-9]{6}$/.test(otp)) {

        errorMessage(
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

            createdAt:
                serverTimestamp()

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


        currentUser =
            user;

        currentUserData =
            userData;


        showHome();


    } catch (error) {

        console.error(error);

        errorMessage(
            "registerError",
            "Invalid OTP. Please try again."
        );

    }

}


/* =====================================================
   LOGIN — SEND OTP
===================================================== */

async function sendLoginOTP() {

    errorMessage(
        "loginError",
        ""
    );


    const phone =
        document
            .getElementById("loginPhone")
            .value
            .trim();


    if (!validPhone(phone)) {

        errorMessage(
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

            errorMessage(
                "loginError",
                "Number not registered. Create an account first."
            );

            return;
        }


        if (!loginRecaptcha) {

            await setupLoginRecaptcha();

        }


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


        errorMessage(
            "loginError",
            "OTP sent successfully."
        );


    } catch (error) {

        console.error(error);

        errorMessage(
            "loginError",
            error.message
        );

        loginRecaptcha = null;

    }

}


/* =====================================================
   LOGIN — VERIFY OTP
===================================================== */

async function verifyLoginOTP() {

    const otp =
        document
            .getElementById("loginOtp")
            .value
            .trim();


    if (!loginConfirmation) {

        errorMessage(
            "loginError",
            "Please request an OTP first."
        );

        return;
    }


    if (!/^[0-9]{6}$/.test(otp)) {

        errorMessage(
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

            errorMessage(
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

        errorMessage(
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
   GENERATE CODE
===================================================== */

function generateCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (
        let i = 0;
        i < 6;
        i++
    ) {

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

        errorMessage(
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


        let teacherExists =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    teacherCode
                )
            );


        while (teacherExists.exists()) {

            teacherCode =
                generateCode();

            teacherExists =
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


        showPage(
            "roomCreatedPage"
        );


    } catch (error) {

        console.error(error);

        errorMessage(
            "createError",
            error.message
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
   ENTER HOST ROOM
===================================================== */

function enterHostRoom() {

    openClassroom(
        currentRoomCode,
        true
    );

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

        errorMessage(
            "joinError",
            "Enter a room code."
        );

        return;
    }


    try {

        /*
          We check every room document.
          For the current simple version,
          the teacher code is the Firebase document ID.
        */

        const roomDoc =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    code
                )
            );


        if (!roomDoc.exists()) {

            errorMessage(
                "joinError",
                "Room not found. Check the code."
            );

            return;
        }


        const room =
            roomDoc.data();


        currentRoomCode =
            code;


        isHost =
            room.hostUid ===
            currentUser.uid;


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
                                "student"
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

        errorMessage(
            "joinError",
            error.message
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


    if (isHost) {

        document
            .getElementById("teacherArea")
            .classList
            .remove("hidden");

    } else {

        document
            .getElementById("teacherArea")
            .classList
            .add("hidden");

    }


    listenToRoom();

}


/* =====================================================
   FIRESTORE REAL-TIME
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
                        "This room no longer exists."
                    );

                    showHome();

                    return;
                }


                renderRoom(
                    snapshot.data()
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


    const raiseButton =
        document
            .getElementById(
                "raiseHandButton"
            );


    const status =
        document
            .getElementById(
                "handStatus"
            );


    if (myHand) {

        raiseButton.textContent =
            "✋ Hand Raised";

        raiseButton.classList.add(
            "hand-raised"
        );

        status.textContent =
            "Your hand is raised.";

    } else {

        raiseButton.textContent =
            "✋ Raise Hand";

        raiseButton.classList.remove(
            "hand-raised"
        );

        status.textContent = "";

    }


    renderRanking(
        raisedHands
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
            await getDoc(
                roomRef
            );
