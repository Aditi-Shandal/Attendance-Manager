const calendarBody = document.getElementById("calendar-days");
const monthYear = document.getElementById("month-year");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const presentCount = document.getElementById("present-count");
const absentCount = document.getElementById("absent-count");
const leaveCount = document.getElementById("leave-count");

const urlParams = new URLSearchParams(window.location.search);
const subject = urlParams.get("subject");

if (!subject) {
    alert("No subject selected. Please go back and select a subject.");
    window.location.href = "add-subject.html";
}

document.getElementById("subject-title").textContent = `Attendance for ${subject}`;

let currentDate = new Date();
let attendance = {};

fetch(`/attendance/${subject}`)
    .then(response => response.json())
    .then(data => {
        attendance = data;
        generateCalendar(currentDate);
    });

prevMonthButton.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar(currentDate);
});

nextMonthButton.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar(currentDate);
});

function markAttendance(year, month, day, cell, status) {
    const dateKey = `${year}-${month + 1}-${day}`;
    attendance[dateKey] = status; 
    updateCellColor(cell, status); 

    fetch(`/attendance/${subject}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, status })
    }).catch(error => console.error('Error updating attendance:', error));

    updateSummary(); 
}

function updateCellColor(cell, status) {
    cell.className = ""; 
    cell.classList.add(status.toLowerCase()); 
}

function generateCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    monthYear.textContent = date.toLocaleString("default", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarBody.innerHTML = "";
    let row = document.createElement("tr");

    for (let i = 0; i < firstDay; i++) {
        row.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        if ((firstDay + day - 1) % 7 === 0 && row.children.length > 0) {
            calendarBody.appendChild(row);
            row = document.createElement("tr");
        }

        const cell = document.createElement("td");
        cell.textContent = day;
        cell.style.cursor = "pointer";
        cell.style.position = "relative"; 
        const dateKey = `${year}-${month + 1}-${day}`;
        if (attendance[dateKey]) {
            cell.className = attendance[dateKey].toLowerCase();
        }

        const dropdown = document.createElement("div");
        dropdown.classList.add("dropdown");
        dropdown.style.display = "none";
        dropdown.style.position = "absolute";
        dropdown.style.top = "100%";
        dropdown.style.left = "50%";
        dropdown.style.transform = "translateX(-50%)";
        dropdown.style.backgroundColor = "#fff";
        dropdown.style.border = "1px solid #ccc";
        dropdown.style.padding = "5px";
        dropdown.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.2)";
        dropdown.style.zIndex = "1000";

        ["Present", "Absent", "Leave"].forEach(option => {
            const li = document.createElement("div");
            li.textContent = option;
            li.className = "dropdown-item";
            li.style.padding = "5px";
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                markAttendance(year, month, day, cell, option);
                dropdown.style.display = "none";
            });
            dropdown.appendChild(li);
        });

        cell.appendChild(dropdown);
        
        cell.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".dropdown").forEach(d => d.style.display = "none"); 
            dropdown.style.display = "block";
        });

        row.appendChild(cell);
    }

    if (row.children.length > 0) {
        calendarBody.appendChild(row);
    }

    updateSummary();
}

document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach(d => d.style.display = "none");
});

function updateSummary() {
    presentCount.textContent = Object.values(attendance).filter(s => s === "Present").length;
    absentCount.textContent = Object.values(attendance).filter(s => s === "Absent").length;
    leaveCount.textContent = Object.values(attendance).filter(s => s === "Leave").length;
}

generateCalendar(currentDate);
