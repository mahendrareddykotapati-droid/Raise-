/* =========================================================
   RAISE FIRST
   Main JavaScript
   ========================================================= */


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let currentRoom = {
    name: "",
    mode: "",
    hostCode: "",
    teacherCode: "",
    studentCode: ""
};

let currentUser = {
    name: "",
    rollNumber: "",
    role: ""
};

let raisedHands = [];

let joinedRoomCode = "";


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.add("hidden");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }
}


/* =========================================================
   HOME
   ========================================================= */

document.getElementById("joinRoomBtn").addEventListener("click", () => {

    clearMessages();

    document.getElementById("roomCodeInput").value = "";

    showPage("joinPage");
});


document.getElementById("createRoomBtn").addEventListener("click", () => {

    clearMessages();

    document.getElementById("roomName").value = "";

    showPage("createRoomPage");
});


/* =========================================================
   CREATE ROOM
   ========================================================= */

document.getElementById("continueCreateBtn").addEventListener("click", () => {

    const roomName =
        document.getElementById("roomName").value.trim();

    if (roomName === "") {

        document.getElementById("createError").textContent =
            "Please enter a room name.";

        return;
    }

    if (roomName.length < 2) {

        document.getElementById("createError").textContent =
            "Room name must contain at least 2 characters.";

        return;
    }

    currentRoom.name = roomName;

    document.getElementById("createError").textContent = "";

    showPage("questionModePage");
});


/* =========================================================
   QUESTION MODE
   ========================================================= */

document.getElementById("websiteQuestionBtn")
    .addEventListener("click", () => {

        createRoom("website");

    });


document.getElementById("manualQuestionBtn")
    .addEventListener("click", () => {

        createRoom("manual");

    });


/* =========================================================
   CREATE ROOM FUNCTION
   ========================================================= */

function createRoom(mode) {

    currentRoom.mode = mode;

    currentRoom.hostCode = generateCode("H");

    currentRoom.teacherCode = generateCode("T");

    currentRoom.studentCode = generateCode("S");

    document.getElementById("createdRoomName").textContent =
        currentRoom.name;

    document.getElementById("hostCode").textContent =
        currentRoom.hostCode;

    document.getElementById("teacherCode").textContent =
        currentRoom.teacherCode;

    document.getElementById("studentCode").textContent =
        currentRoom.studentCode;

    showPage("roomCreatedPage");
}


/* =========================================================
   GENERATE ROOM CODES
   ========================================================= */

function generateCode(prefix) {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = prefix + "-";

    for (let i = 0; i < 6; i++) {

        const randomIndex =
            Math.floor(Math.random() * characters.length);

        code += characters[randomIndex];
    }

    return code;
}


/* =========================================================
   COPY CODE
   ========================================================= */

function copyCode(elementId) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    const code = element.textContent;

    navigator.clipboard.writeText(code)
        .then(() => {

            const oldText = element.textContent;

            element.textContent = "Copied!";

            setTimeout(() => {

                element.textContent = oldText;

            }, 1200);

        })
        .catch(() => {

            alert("Unable to copy the code.");

        });
}


/* =========================================================
   ENTER HOST ROOM
   ========================================================= */

document.getElementById("enterHostRoomBtn")
    .addEventListener("click", () => {

        currentUser.role = "host";

        document.getElementById("hostRoomName").textContent =
            currentRoom.name;

        showPage("hostRoomPage");
    });


/* =========================================================
   JOIN ROOM
   ========================================================= */

document.getElementById("continueJoinBtn")
    .addEventListener("click", () => {

        const code =
            document.getElementById("roomCodeInput")
                .value
                .trim()
                .toUpperCase();

        if (code === "") {

            document.getElementById("joinError").textContent =
                "Please enter a room code.";

            return;
        }

        /*
         * In the real version Firebase will check
         * whether this code actually exists.
         */

        joinedRoomCode = code;

        document.getElementById("joinError").textContent = "";

        showPage("joinRolePage");
    });


/* =========================================================
   CHOOSE TEACHER
   ========================================================= */

document.getElementById("teacherJoinBtn")
    .addEventListener("click", () => {

        currentUser.role = "teacher";

        document.getElementById("teacherName").value = "";

        showPage("teacherDetailsPage");
    });


/* =========================================================
   CHOOSE STUDENT
   ========================================================= */

document.getElementById("studentJoinBtn")
    .addEventListener("click", () => {

        currentUser.role = "student";

        document.getElementById("studentName").value = "";

        document.getElementById("rollNumber").value = "";

        showPage("studentDetailsPage");
    });


/* =========================================================
   JOIN AS STUDENT
   ========================================================= */

document.getElementById("joinAsStudentBtn")
    .addEventListener("click", () => {

        const name =
            document.getElementById("studentName")
                .value
                .trim();

        const rollNumber =
            document.getElementById("rollNumber")
                .value
                .trim();

        if (name === "") {

            document.getElementById("studentError").textContent =
                "Please enter your name.";

            return;
        }

        if (rollNumber === "") {

            document.getElementById("studentError").textContent =
                "Please enter your roll number.";

            return;
        }

        currentUser.name = name;

        currentUser.rollNumber = rollNumber;

        currentUser.role = "student";

        document.getElementById("studentWelcome").textContent =
            "Welcome, " + name + " 👋";

        document.getElementById("studentRoomName").textContent =
            joinedRoomCode;

        document.getElementById("handStatus").textContent =
            "Waiting for the next question...";

        showPage("studentRoomPage");
    });


/* =========================================================
   JOIN AS TEACHER
   ========================================================= */

document.getElementById("joinAsTeacherBtn")
    .addEventListener("click", () => {

        const name =
            document.getElementById("teacherName")
                .value
                .trim();

        if (name === "") {

            document.getElementById("teacherError").textContent =
                "Please enter your name.";

            return;
        }

        currentUser.name = name;

        currentUser.role = "teacher";

        document.getElementById("teacherRoomName").textContent =
            joinedRoomCode;

        showPage("teacherRoomPage");
    });


/* =========================================================
   RAISE HAND
   ========================================================= */

document.getElementById("raiseHandBtn")
    .addEventListener("click", () => {

        raiseHand();

    });


function raiseHand() {

    /*
     * Prevent the same student from raising
     * their hand multiple times.
     */

    const alreadyRaised = raisedHands.some(
        person => person.name === currentUser.name
    );

    if (alreadyRaised) {

        document.getElementById("handStatus").textContent =
            "✋ Your hand is already raised.";

        return;
    }


    const participant = {

        name: currentUser.name,

        rollNumber: currentUser.rollNumber,

        time: Date.now(),

        position: raisedHands.length + 1
    };


    raisedHands.push(participant);


    /*
     * Update the student's screen.
     */

    document.getElementById("handStatus").textContent =
        "✋ Hand raised! You are #" +
        participant.position;


    /*
     * Update teacher/host screen.
     */

    updateHandList();
}


/* =========================================================
   UPDATE HAND LIST
   ========================================================= */

function updateHandList() {

    const list =
        document.getElementById("handList");

    if (!list) {
        return;
    }

    list.innerHTML = "";


    if (raisedHands.length === 0) {

        list.innerHTML = `
            <p class="empty-message">
                No hands raised yet.
            </p>
        `;

        return;
    }


    raisedHands.forEach((person, index) => {

        const item =
            document.createElement("div");

        item.className = "hand-item";


        let medal = "";

        if (index === 0) {
            medal = "🥇";
        }
        else if (index === 1) {
            medal = "🥈";
        }
        else if (index === 2) {
            medal = "🥉";
        }
        else {
            medal = `${index + 1}.`;
        }


        item.innerHTML = `
            <div>
                <strong>
                    ${medal} ${escapeHTML(person.name)}
                </strong>

                <small>
                    Roll No: ${escapeHTML(person.rollNumber)}
                </small>
            </div>
        `;


        list.appendChild(item);

    });
}


/* =========================================================
   RESET HANDS
   ========================================================= */

document.getElementById("resetHandsBtn")
    .addEventListener("click", () => {

        resetHands();

    });


document.getElementById("hostResetBtn")
    .addEventListener("click", () => {

        resetHands();

    });


function resetHands() {

    raisedHands = [];

    updateHandList();


    const status =
        document.getElementById("handStatus");

    if (status) {

        status.textContent =
            "Waiting for the next question...";

    }

    const raiseButton =
        document.getElementById("raiseHandBtn");

    if (raiseButton) {

        raiseButton.disabled = false;

    }
}


/* =========================================================
   END ROOM
   ========================================================= */

document.getElementById("endRoomBtn")
    .addEventListener("click", () => {

        const confirmEnd =
            confirm(
                "Are you sure you want to end this room?"
            );

        if (!confirmEnd) {
            return;
        }

        currentRoom = {

            name: "",

            mode: "",

            hostCode: "",

            teacherCode: "",

            studentCode: ""

        };

        currentUser = {

            name: "",

            rollNumber: "",

            role: ""

        };

        raisedHands = [];

        joinedRoomCode = "";

        showPage("homePage");
    });


/* =========================================================
   VIEW MEMBERS
   ========================================================= */

document.getElementById("viewMembersBtn")
    .addEventListener("click", () => {

        alert(
            "Member list will be connected to Firebase."
        );

    });


/* =========================================================
   WEBSITE QUESTION MODE
   ========================================================= */

function showQuestion(question) {

    const questionDisplay =
        document.getElementById("questionDisplay");

    const currentQuestion =
        document.getElementById("currentQuestion");


    if (!questionDisplay || !currentQuestion) {
        return;
    }


    currentQuestion.textContent = question;

    questionDisplay.classList.remove("hidden");
}


/* =========================================================
   CLEAR QUESTIONS
   ========================================================= */

function clearQuestion() {

    const questionDisplay =
        document.getElementById("questionDisplay");

    const currentQuestion =
        document.getElementById("currentQuestion");


    if (questionDisplay) {

        questionDisplay.classList.add("hidden");

    }

    if (currentQuestion) {

        currentQuestion.textContent =
            "Waiting for question...";

    }
}


/* =========================================================
   ERROR MESSAGE CLEANUP
   ========================================================= */

function clearMessages() {

    const messages = document.querySelectorAll(
        ".error-message"
    );

    messages.forEach(message => {

        message.textContent = "";

    });
}


/* =========================================================
   SECURITY HELPER
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIAL PAGE
   ========================================================= */

showPage("homePage");
