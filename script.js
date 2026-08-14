/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG — AGNI
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
   INITIALIZE FIREBASE
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
   PAGE CONTROL
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
   ERROR MESSAGE
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

function getFirebaseError(error) {

    const code = error?.code || "";

    const messages = {

        "auth/invalid-phone-number":
            "Invalid phone number.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/invalid-verification-code":
            "Invalid OTP.",

        "auth/code-expired":
            "OTP expired. Please request a new OTP.",

        "auth/quota-exceeded":
            "SMS quota exceeded. Please try again later.",

        "auth/network-request-failed":
            "Network error. Check your internet connection.",

        "auth/operation-not-allowed":
            "Phone authentication is not enabled in Firebase.",

        "auth/captcha-check-failed":
            "reCAPTCHA verification failed."
    };

    return messages[code] ||
        error?.message ||
        "Something went wrong.";
}


/* =====================================================
   PHONE VALIDATION
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

    showError(
        "registerError",
        ""
    );

    const name =
        document
            .getElementById("registerName")
            ?.value
            .trim();

    const phone =
        document
            .getElementById("registerPhone")
            ?.value
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
            ?.classList
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

    }

}


/* =====================================================
   VERIFY REGISTER OTP
===================================================== */

async function verifyRegisterOTP() {

    const name =
        document
            .getElementById("registerName")
            ?.value
            .trim();

    const otp =
        document
            .getElementById("registerOtp")
            ?.value
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

        currentUser =
            user;

        currentUserData =
            userData;

        showHome();

    } catch (error) {

        console.error(error);

        showError(
            "registerError",
            getFirebaseError(error)
        );

    }

}


/* =====================================================
   LOGIN OTP
===================================================== */

async function sendLoginOTP() {

    showError(
        "loginError",
        ""
    );

    const phone =
        document
            .getElementById("loginPhone")
            ?.value
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
            ?.classList
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

    }

}


/* =====================================================
   VERIFY LOGIN OTP
===================================================== */

async function verifyLoginOTP() {

    const otp =
        document
            .getElementById("loginOtp")
            ?.value
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
            getFirebaseError(error)
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

    const welcome =
        document.getElementById(
            "welcomeText"
        );

    if (welcome) {

        welcome.textContent =
            "Welcome, " +
            currentUserData.name +
            " 👋";

    }

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
            ?.value
            .trim();

    if (!roomName) {

        showError(
            "createError",
            "Enter a room name."
        );

        return;
    }

    if (!currentUser) {

        showError(
            "createError",
            "Please login first."
        );

        return;
    }

    try {

        let teacherCode =
            generateCode();

        let studentCode =
            generateCode();

        while (
            studentCode ===
            teacherCode
        ) {

            studentCode =
                generateCode();

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

            teacherCode =
                generateCode();

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

        const createdName =
            document.getElementById(
                "createdRoomName"
            );

        if (createdName) {

            createdName.textContent =
                roomName;

        }

        const teacher =
            document.getElementById(
                "teacherCode"
            );

        if (teacher) {

            teacher.textContent =
                teacherCode;

        }

        const student =
            document.getElementById(
                "studentCode"
            );

        if (student) {

            student.textContent =
                studentCode;

        }

        showPage(
            "roomCreatedPage"
        );

    } catch (error) {

        console.error(error);

        showError(
            "createError",
            getFirebaseError(error)
        );

    }

}


/* =====================================================
   COPY CODE
===================================================== */

async function copyText(id) {

    const element =
        document.getElementById(id);

    if (!element) return;

    const text =
        element.textContent;

    try {

        await navigator.clipboard.writeText(
            text
        );

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
            .getElementById(
                "roomCodeInput"
            )
            ?.value
            .trim()
            .toUpperCase();

    if (!code) {

        showError(
            "joinError",
            "Enter a room code."
        );

        return;
    }

    if (!currentUser) {

        showError(
            "joinError",
            "Please login first."
        );

        return;
    }

    try {

        let roomCode = code;

        let roomDoc =
            await getDoc(
                doc(
                    db,
                    "rooms",
                    roomCode
                )
            );

        /*
           If student enters student code,
           find the room by searching room documents.
        */

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
            roomCode;

        if (
            code ===
            room.teacherCode
        ) {

            isHost =
                room.hostUid ===
                currentUser.uid;

        } else if (
            code ===
            room.studentCode
        ) {

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

    showPage(
        "classroomPage"
    );

    const teacherArea =
        document.getElementById(
            "teacherArea"
        );

    if (teacherArea) {

        teacherArea.classList.toggle(
            "hidden",
            !isHost
        );

    }

    listenToRoom();

}


/* =====================================================
   REAL-TIME ROOM LISTENER
===================================================== */

function listenToRoom() {

    if (unsubscribeRoom) {

        unsubscribeRoom();

    }

    if (!currentRoomCode) return;

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

                    currentRoomCode =
                        null;

                    isHost = false;

                    showHome();

                    return;
                }

                renderRoom(
                    
