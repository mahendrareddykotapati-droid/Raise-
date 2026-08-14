====================================================
   RAISE HAND CLASSROOM
===================================================== */


/* =========================
   GLOBAL VARIABLES
========================= */

let currentUser = null;
let currentClassCode = null;
let isHost = false;

let registeredUsers =
    JSON.parse(localStorage.getItem("registeredUsers")) || {};

let classrooms =
    JSON.parse(localStorage.getItem("classrooms")) || {};


/* =========================
   PAGE FUNCTIONS
========================= */

function hideAllPages() {

    document.getElementById("registerPage")
        .classList.add("hidden");

    document.getElementById("loginPage")
        .classList.add("hidden");

    document.getElementById("homePage")
        .classList.add("hidden");

    document.getElementById("joinPage")
        .classList.add("hidden");

    document.getElementById("classroomPage")
        .classList.add("hidden");
}


/* =========================
   SHOW REGISTER
========================= */

function showRegister() {

    hideAllPages();

    document.getElementById("registerPage")
        .classList.remove("hidden");
}


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

    hideAllPages();

    document.getElementById("loginPage")
        .classList.remove("hidden");
}


/* =========================
   REGISTER USER
========================= */

function registerUser() {

    const name =
        document.getElementById("registerName")
        .value.trim();

    const phone =
        document.getElementById("registerPhone")
        .value.trim();


    /* NAME CHECK */

    if (name === "") {

        alert("Please enter your name.");

        return;
    }


    /* PHONE CHECK */

    if (!/^[0-9]{10}$/.test(phone)) {

        alert("Please enter a valid 10-digit phone number.");

        return;
    }


    /* ALREADY REGISTERED */

    if (registeredUsers[phone]) {

        alert(
            "This phone number is already registered. Please login."
        );

        showLogin();

        return;
    }


    /* SAVE USER */

    registeredUsers[phone] = {

        name: name,
        phone: phone

    };


    localStorage.setItem(
        "registeredUsers",
        JSON.stringify(registeredUsers)
    );


    alert("Registration successful!");


    /* CLEAR */

    document.getElementById("registerName").value = "";
    document.getElementById("registerPhone").value = "";


    showLogin();
}


/* =========================
   LOGIN USER
========================= */

function loginUser() {

    const phone =
        document.getElementById("loginPhone")
        .value.trim();


    if (!/^[0-9]{10}$/.test(phone)) {

        alert("Please enter a valid 10-digit phone number.");

        return;
    }


    const user = registeredUsers[phone];


    if (!user) {

        alert(
            "This number is not registered. Please register first."
        );

        return;
    }


    currentUser = user;


    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );


    document.getElementById("loginPhone").value = "";


    showHome();
}


/* =========================
   HOME PAGE
========================= */

function showHome() {

    if (!currentUser) {

        showLogin();

        return;
    }


    hideAllPages();


    document.getElementById("homePage")
        .classList.remove("hidden");


    document.getElementById("welcomeText")
        .textContent =
        "Welcome, " + currentUser.name;
}


/* =========================
   JOIN CLASS PAGE
========================= */

function showJoinClass() {

    hideAllPages();

    document.getElementById("joinPage")
        .classList.remove("hidden");
}


/* =========================
   GENERATE CLASS CODE
========================= */

function generateClassCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code += characters[
            Math.floor(
                Math.random() * characters.length
            )
        ];
    }

    return code;
}


/* =========================
   CREATE CLASS
   HOST FUNCTION
========================= */

function createClass() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    let code = generateClassCode();


    while (classrooms[code]) {

        code = generateClassCode();
    }


    classrooms[code] = {

        hostPhone: currentUser.phone,

        hostName: currentUser.name,

        members: {},

        raisedHands: [],

        questions: []

    };


    classrooms[code].members[currentUser.phone] =
        currentUser.name;


    saveClassrooms();


    currentClassCode = code;

    isHost = true;


    openClassroom();
}


/* =========================
   JOIN CLASS
========================= */

function joinClass() {

    const code =
        document.getElementById("classCodeInput")
        .value.trim()
        .toUpperCase();


    if (code === "") {

        alert("Please enter the Class Code.");

        return;
    }


    if (!classrooms[code]) {

        alert("Class not found. Check the Class Code.");

        return;
    }


    currentClassCode = code;


    const classroom =
        classrooms[currentClassCode];


    /* CHECK HOST */

    isHost =
        classroom.hostPhone === currentUser.phone;


    /* ADD MEMBER */

    classroom.members[currentUser.phone] =
        currentUser.name;


    saveClassrooms();


    document.getElementById("classCodeInput").value = "";


    openClassroom();
}


/* =========================
   OPEN CLASSROOM
========================= */

function openClassroom() {

    hideAllPages();


    document.getElementById("classroomPage")
        .classList.remove("hidden");


    document.getElementById("classCodeDisplay")
        .textContent =
        "Class Code: " + currentClassCode;


    document.getElementById("studentName")
        .textContent =
        currentUser.name;


    updateClassroom();


    if (isHost) {

        document.getElementById("teacherArea")
            .classList.remove("hidden");

    } else {

        document.getElementById("teacherArea")
            .classList.add("hidden");
    }
}


/* =========================
   UPDATE CLASSROOM
========================= */

function updateClassroom() {

    if (!currentClassCode) return;


    const classroom =
        classrooms[currentClassCode];


    if (!classroom) return;


    /* MEMBER COUNT */

    const memberCount =
        Object.keys(classroom.members).length;


    document.getElementById("memberCount")
        .textContent = memberCount;


    /* CHECK CURRENT HAND */

    const alreadyRaised =
        classroom.raisedHands.some(
            phone => phone === currentUser.phone
        );


    const button =
        document.getElementById("raiseHandButton");


    const status =
        document.getElementById("handStatus");


    if (alreadyRaised) {

        button.textContent =
            "✋ Hand Raised";

        button.classList.add("handRaised");

        status.textContent =
            "Your hand is raised.";

    } else {

        button.textContent =
            "✋ Raise Hand";

        button.classList.remove("handRaised");

        status.textContent = "";
    }


    /* UPDATE TEACHER RANKING */

    updateRanking();


    /* UPDATE QUESTIONS */

    updateQuestions();
}


/* =========================
   RAISE HAND
========================= */

function raiseHand() {

    if (!currentClassCode) {

        alert("You are not inside a classroom.");

        return;
    }


    const classroom =
        classrooms[currentClassCode];


    if (!classroom) return;


    /* PREVENT DUPLICATE */

    if (
        classroom.raisedHands.includes(
            currentUser.phone
        )
    ) {

        return;
    }


    /* ADD PHONE INTERNALLY */

    classroom.raisedHands.push(
        currentUser.phone
    );


    saveClassrooms();


    updateClassroom();
}


/* =========================
   UPDATE RANKING
========================= */

function updateRanking() {

    if (!isHost) return;


    const list =
        document.getElementById("rankingList");


    const classroom =
        classrooms[currentClassCode];


    if (
        !classroom ||
        classroom.raisedHands.length === 0
    ) {

        list.innerHTML = `
            <p class="emptyMessage">
                No students have raised their hands.
            </p>
        `;

        return;
    }


    list.innerHTML = "";


    classroom.raisedHands.forEach(
        (phone, index) => {

            const name =
                classroom.members[phone] ||
                registeredUsers[phone]?.name ||
                "Unknown";


            const item =
                document.createElement("div");

            item.className = "rankingItem";


            item.innerHTML = `
                <div class="rankNumber">
                    ${index + 1}
                </div>

                <div class="studentRankName">
                    ${escapeHTML(name)}
                </div>
            `;


            list.appendChild(item);
        }
    );
}


/* =========================
   RESET RAISED HANDS
========================= */

function resetRaisedHands() {

    if (!isHost) {

        alert(
            "Only the host can reset raised hands."
        );

        return;
    }


    const classroom =
        classrooms[currentClassCode];


    if (!classroom) return;


    classroom.raisedHands = [];


    saveClassrooms();


    updateClassroom();
}


/* =========================
   ASK QUESTION
========================= */

function askQuestion() {

    const input =
        document.getElementById("questionInput");


    const question =
        input.value.trim();


    if (question === "") {

        alert("Please enter a question.");

        return;
    }


    const classroom =
        classrooms[currentClassCode];


    if (!classroom) return;


    classroom.questions.push({

        name: currentUser.name,

        question: question

    });


    saveClassrooms();


    input.value = "";


    updateQuestions();
}


/* =========================
   DISPLAY QUESTIONS
========================= */

function updateQuestions() {

    const list =
        document.getElementById("questionList");


    const classroom =
        classrooms[currentClassCode];


    if (!classroom) return;


    list.innerHTML = "";


    classroom.questions.forEach(
        item => {

            const div =
                document.createElement("div");

            div.className =
                "questionItem";


            div.innerHTML = `
                <div class="questionName">
                    ${escapeHTML(item.name)}
                </div
