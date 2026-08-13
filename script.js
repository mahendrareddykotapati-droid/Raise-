/* =========================================================
   RAISE FIRST
   FINAL SCRIPT.JS
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let currentRole = null;
let currentRoom = null;
let currentQuestionMode = null;

let currentRoomData = null;


/* =========================================================
   PAGE CONTROL
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
   STORAGE
   ========================================================= */

function saveData(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}


function getData(key) {

    const data = localStorage.getItem(key);

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}


/* =========================================================
   GENERATE RANDOM CODE
   ========================================================= */

function generateCode(length = 6) {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < length; i++) {

        const randomIndex =
            Math.floor(
                Math.random() * characters.length
            );

        code += characters[randomIndex];
    }

    return code;
}


/* =========================================================
   GENERATE UNIQUE ROOM CODES
   ========================================================= */

function generateRoomCodes() {

    let teacherCode = generateCode();
    let studentCode = generateCode();

    while (teacherCode === studentCode) {
        studentCode = generateCode();
    }

    return {
        teacherCode,
        studentCode
    };
}


/* =========================================================
   LOGIN
   ========================================================= */

function login() {

    const username =
        document.getElementById("loginUsername")
        .value
        .trim();

    const password =
        document.getElementById("loginPassword")
        .value;

    const error =
        document.getElementById("loginError");


    error.textContent = "";


    if (!username || !password) {

        error.textContent =
            "Please enter username and password.";

        return;
    }


    const users =
        getData("raiseFirstUsers") || [];


    const user =
        users.find(
            u =>
                (u.email === username ||
                 u.name === username) &&
                u.password === password
        );


    if (!user) {

        error.textContent =
            "Invalid username/email or password.";

        return;
    }


    currentUser = user;

    saveData(
        "raiseFirstCurrentUser",
        currentUser
    );


    showPage("mainPage");
}


/* =========================================================
   SIGN UP
   ========================================================= */

function signUp() {

    const name =
        document.getElementById("signupName")
        .value
        .trim();

    const email =
        document.getElementById("signupEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
        document.getElementById("signupPassword")
        .value;

    const error =
        document.getElementById("signupError");


    error.textContent = "";


    if (!name || !email || !password) {

        error.textContent =
            "Please fill all fields.";

        return;
    }


    if (password.length < 6) {

        error.textContent =
            "Password must contain at least 6 characters.";

        return;
    }


    const users =
        getData("raiseFirstUsers") || [];


    const existingUser =
        users.find(
            user => user.email === email
        );


    if (existingUser) {

        error.textContent =
            "An account with this email already exists.";

        return;
    }


    const newUser = {

        id:
            Date.now().toString(),

        name: name,

        email: email,

        password: password
    };


    users.push(newUser);


    saveData(
        "raiseFirstUsers",
        users
    );


    currentUser = newUser;


    saveData(
        "raiseFirstCurrentUser",
        currentUser
    );


    document.getElementById("signupName").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";


    showPage("mainPage");
}


/* =========================================================
   CREATE ROOM — STEP 1
   ========================================================= */

function continueCreateRoom() {

    const roomName =
        document.getElementById("roomName")
        .value
        .trim();

    const error =
        document.getElementById("createError");


    error.textContent = "";


    if (!roomName) {

        error.textContent =
            "Please enter a room name.";

        return;
    }


    if (!currentUser) {

        alert("Please login first.");

        showPage("loginPage");

        return;
    }


    currentRoomData = {

        roomName: roomName
    };


    showPage("questionModePage");
}


/* =========================================================
   CREATE ROOM — WEBSITE MODE
   ========================================================= */

function createWebsiteRoom() {

    createRoom("website");
}


/* =========================================================
   CREATE ROOM — MANUAL MODE
   ========================================================= */

function createManualRoom() {

    createRoom("manual");
}


/* =========================================================
   CREATE ROOM
   ========================================================= */

function createRoom(mode) {

    if (!currentRoomData) {
        return;
    }


    const roomName =
        currentRoomData.roomName;


    const codes =
        generateRoomCodes();


    const roomId =
        Date.now().toString();


    const room = {

        roomId: roomId,

        roomName: roomName,

        mode: mode,

        hostId: currentUser.id,

        hostName: currentUser.name,

        teacherCode: codes.teacherCode,

        studentCode: codes.studentCode,

        teachers: [],

        students: [],

        handsRaised: [],

        currentQuestion: "",

        createdAt: Date.now(),

        active: true
    };


    const rooms =
        getData("raiseFirstRooms") || [];


    rooms.push(room);


    saveData(
        "raiseFirstRooms",
        rooms
    );


    currentRoom = roomId;

    currentRole = "host";

    currentQuestionMode = mode;


    saveData(
        "raiseFirstCurrentRoom",
        currentRoom
    );


    document.getElementById(
        "createdRoomName"
    ).textContent = roomName;


    document.getElementById(
        "teacherCode"
    ).textContent = codes.teacherCode;


    document.getElementById(
        "studentCode"
    ).textContent = codes.studentCode;


    updateCreatedRoomCounts();


    showPage("roomCreatedPage");
}


/* =========================================================
   UPDATE CREATED ROOM COUNTS
   ========================================================= */

function updateCreatedRoomCounts() {

    const room =
        getCurrentRoomData();

    if (!room) {
        return;
    }


    const teacherTotal =
        1 + room.teachers.length;


    const studentTotal =
        room.students.length;


    const limitInfo =
        document.querySelector(
            ".room-limit-info"
        );


    if (!limitInfo) {
        return;
    }


    limitInfo.innerHTML = `

        <p>
            👨‍🏫 Host + Teachers:
            <strong>
                ${teacherTotal} / 50
            </strong>
        </p>

        <p>
            👨‍🎓 Students:
            <strong>
                ${studentTotal} / 300
            </strong>
        </p>
    `;
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


    const code =
        element.textContent.trim();


    navigator.clipboard
        .writeText(code)
        .then(() => {

            alert(
                "Code copied: " + code
            );

        })
        .catch(() => {

            alert(
                "Code: " + code
            );

        });
}


/* =========================================================
   ENTER HOST ROOM
   ========================================================= */

function enterHostRoom() {

    const room =
        getCurrentRoomData();


    if (!room) {
        return;
    }


    currentRole = "host";

    currentRoom = room.roomId;

    currentQuestionMode = room.mode;


    setupHostPage(room);

    showPage("hostRoomPage");
}


/* =========================================================
   SETUP HOST PAGE
   ========================================================= */

function setupHostPage(room) {

    document.getElementById(
        "hostRoomName"
    ).textContent = room.roomName;


    updateHostCounts(room);

    updateHostQuestionMode(room);

    renderHostHands(room);
}


/* =========================================================
   UPDATE HOST COUNTS
   ========================================================= */

function updateHostCounts(room) {

    const teacherCount =
        1 + room.teachers.length;


    const studentCount =
        room.students.length;


    document.getElementById(
        "hostTeacherCount"
    ).textContent = teacherCount;


    document.getElementById(
        "hostStudentCount"
    ).textContent = studentCount;
}


/* =========================================================
   HOST QUESTION MODE
   ========================================================= */

function updateHostQuestionMode(room) {

    const questionArea =
        document.getElementById(
            "hostQuestionArea"
        );

    const manualMessage =
        document.getElementById(
            "hostManualMessage"
        );


    if (room.mode === "website") {

        questionArea.classList.remove(
            "hidden"
        );

        manualMessage.classList.add(
            "hidden"
        );

    } else {

        questionArea.classList.add(
            "hidden"
        );

        manualMessage.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   JOIN PAGE
   ========================================================= */

function openJoinPage() {

    document.getElementById(
        "roomCodeInput"
    ).value = "";


    document.getElementById(
        "joinError"
    ).textContent = "";


    showPage("joinPage");
}


/* =========================================================
   FIND ROOM BY CODE
   ========================================================= */

function findRoomByCode(code) {

    const rooms =
        getData("raiseFirstRooms") || [];


    return rooms.find(
        room =>
            room.active &&
            (
                room.teacherCode === code ||
                room.studentCode === code
            )
    );
}


/* =========================================================
   JOIN USING CODE
   ========================================================= */

function continueJoin() {

    const input =
        document.getElementById(
            "roomCodeInput"
        );


    const error =
        document.getElementById(
            "joinError"
        );


    const code =
        input.value
            .trim()
            .toUpperCase();


    error.textContent = "";


    if (!code) {

        error.textContent =
            "Please enter a room code.";

        return;
    }


    const room =
        findRoomByCode(code);


    if (!room) {

        error.textContent =
            "Invalid or expired room code.";

        return;
    }


    currentRoom =
        room.roomId;


    currentQuestionMode =
        room.mode;


    if (code === room.teacherCode) {

        currentRole = "teacher";


        if (
            1 + room.teachers.length >= 50
        ) {

            error.textContent =
                "Teacher limit reached.";

            return;
        }


        document.getElementById(
            "teacherName"
        ).value = "";


        document.getElementById(
            "teacherError"
        ).textContent = "";


        showPage("teacherDetailsPage");


    } else {


        currentRole = "student";


        if (
            room.students.length >= 300
        ) {

            error.textContent =
                "Student limit reached.";

            return;
        }


        document.getElementById(
            "studentName"
        ).value = "";


        document.getElementById(
            "rollNumber"
        ).value = "";


        document.getElementById(
            "studentError"
        ).textContent = "";


        showPage("studentDetailsPage");
    }
}


/* =========================================================
   JOIN AS TEACHER
   ========================================================= */

function joinAsTeacher() {

    const name =
        document.getElementById(
            "teacherName"
        ).value.trim();


    const error =
        document.getElementById(
            "teacherError"
        );


    error.textContent = "";


    if (!name) {

        error.textContent =
            "Please enter your name.";

        return;
    }


    const room =
        getCurrentRoomData();


    if (!room) {

        error.textContent =
            "Room not found.";

        return;
    }


    if (
        1 + room.teachers.length >= 50
    ) {

        error.textContent =
            "Teacher limit reached.";

        return;
    }


    const teacher = {

        id:
            "teacher_" +
            Date.now(),

        name: name,

        joinedAt: Date.now()
    };


    room.teachers.push(teacher);


    saveRoom(room);


    setupTeacherPage(room);


    showPage("teacherRoomPage");
}


/* =========================================================
   JOIN AS STUDENT
   ========================================================= */

function joinAsStudent() {

    const name =
        document.getElementById(
            "studentName"
        ).value.trim();


    const roll =
        document.getElementById(
            "rollNumber"
        ).value.trim();


    const error =
        document.getElementById(
            "studentError"
        );


    error.textContent = "";


    if (!name) {

        error.textContent =
            "Please enter your name.";

        return;
    }


    if (!roll) {

        error.textContent =
            "Please enter your roll number.";

        return;
    }


    const room =
        getCurrentRoomData();


    if (!room) {

        error.textContent =
            "Room not found.";

        return;
    }


    if (
        room.students.length >= 300
    ) {

        error.textContent =
            "Student limit reached.";

        return;
    }


    const student = {

        id:
            "student_" +
            Date.now(),

        name: name,

        rollNumber: roll,

        joinedAt: Date.now()
    };


    room.students.push(student);


    saveRoom(room);


    currentUser = student;


    setupStudentPage(room);


    showPage("studentRoomPage");
}


/* =========================================================
   SETUP STUDENT PAGE
   ========================================================= */

function setupStudentPage(room) {

    document.getElementById(
        "studentRoomName"
    ).textContent = room.roomName;


    updateStudentCount(room);


    updateStudentQuestion(room);


    document.getElementById(
        "handStatus"
    ).textContent =
        "Ready to raise your hand.";


    const button =
        document.getElementById(
            "raiseHandBtn"
        );


    button.disabled = false;
}


/* =========================================================
   UPDATE STUDENT COUNT
   ========================================================= */

function updateStudentCount(room) {

    document.getElementById(
        "studentCount"
    ).textContent =
        room.students.length;
}


/* =========================================================
   STUDENT QUESTION
   ========================================================= */

function updateStudentQuestion(room) {

    const questionBox =
        document.getElementById(
            "studentQuestionBox"
        );


    const manualMessage =
        document.getElementById(
            "manualQuestionMessage"
        );


    const question =
        document.getElementById(
            "currentQuestion"
        );


    if (room.mode === "website") {

        questionBox.classList.remove(
            "hidden"
        );

        manualMessage.classList.add(
            "hidden"
        );


        if (room.currentQuestion) {

            question.textContent =
                room.currentQuestion;

        } else {

            question.textContent =
                "Waiting for question...";
        }

    } else {

        questionBox.classList.add(
            "hidden"
        );

        manualMessage.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   SETUP TEACHER PAGE
   ========================================================= */

function setupTeacherPage(room) {

    document.getElementById(
        "teacherRoomName"
    ).textContent =
        room.roomName;


    updateTeacherCount(room);


    updateTeacherQuestionMode(room);


    renderTeacherHands(room);
}


/* =========================================================
   UPDATE TEACHER COUNT
   ========================================================= */

function updateTeacherCount(room) {

    document.getElementById(
        "teacherCount"
    ).textContent =
        room.teachers.length;
}


/* =========================================================
   TEACHER QUESTION MODE
   ========================================================= */

function updateTeacherQuestionMode(room) {

    const questionArea =
        document.getElementById(
            "teacherQuestionArea"
        );


    const manualMessage =
        document.getElementById(
            "teacherManualMessage"
        );


    if (room.mode === "website") {

        questionArea.classList.remove(
            "hidden"
        );

        manualMessage.classList.add(
            "hidden"
        );

    } else {

        questionArea.classList.add(
            "hidden"
        );

        manualMessage.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   STUDENT RAISE HAND
   ========================================================= */

function raiseHand() {

    if (currentRole !== "student") {
        return;
    }


    const room =
        getCurrentRoomData();


    if (!room) {
        return;
    }


    const studentId =
        currentUser.id;


    const alreadyRaised =
        room.handsRaised.find(
            hand =>
                hand.studentId === studentId
        );


    if (alreadyRaised) {

        document.getElementById(
            "handStatus"
        ).textContent =
            "✋ Your hand is already raised.";

        return;
    }


    const student =
        room.students.find(
            s =>
                s.id === studentId
        );


    if (!student) {
        return;
    }


    const hand = {

        studentId: student.id,

        name: student.name,

        rollNumber: student.rollNumber,

        raisedAt: Date.now()
    };


    room.handsRaised.push(hand);


    room.handsRaised.sort(
        (a, b) =>
            a.raisedAt - b.raisedAt
    );


    saveRoom(room);


    document.getElementById(
        "handStatus"
    ).textContent =
        "✋ Hand raised! Waiting for teacher.";


    document.getElementById(
        "raiseHandBtn"
    ).disabled = true;
}


/* =========================================================
   RENDER TEACHER HANDS
   ========================================================= */

function renderTeacherHands(room) {

    const list =
        document.getElementById(
            "teacherHandList"
        );


    if (!list) {
        return;
    }


    if (
        !room.handsRaised ||
        room.handsRaised.length === 0
    ) {

        list.innerHTML = `
            <p class="empty-message">
                No hands raised yet.
            </p>
        `;

        return;
    }


    list.innerHTML = "";


    room.handsRaised.forEach(
        (hand, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "hand-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${index + 1}. ${escapeHTML(hand.name)}
                    </strong>

                    <small>
                        Roll No: ${escapeHTML(hand.rollNumber)}
                    </small>

                </div>

                <span>
                    🙋
                </span>
            `;


            list.appendChild(item);
        }
    );
}


/* =========================================================
   RENDER HOST HANDS
   ========================================================= */

function renderHostHands(room) {

    const list =
        document.getElementById(
            "hostHandList"
        );


    if (!list) {
        return;
    }


    if (
        !room.handsRaised ||
        room.handsRaised.length === 0
    ) {

        list.innerHTML = `
            <p class="empty-message">
                No hands raised yet.
            </p>
        `;
