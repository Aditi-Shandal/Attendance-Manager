const subjectForm = document.getElementById("subject-form");
const subjectNameInput = document.getElementById("subject-name");
const subjectList = document.getElementById("subject-list");

function loadSubjects() {
    fetch('/subjects')
        .then(response => response.json())
        .then(subjects => {
            subjectList.innerHTML = ""; 

            subjects.forEach(subject => {
                fetch(`/attendance/${subject}`)
                    .then(response => response.json())
                    .then(attendance => {
                        let totalDays = Object.keys(attendance).length;
                        let presentDays = Object.values(attendance).filter(s => s === "Present").length;
                        let attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

                        const newRow = document.createElement("tr");
                        newRow.innerHTML = `
                            <td>${subject}</td>
                            <td>
                                <div class="progress-circle">
                                    <svg viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="gradient-${subject}">
                                                <stop offset="0%" stop-color="#2ecc71"/>
                                                <stop offset="100%" stop-color="#27ae60"/>
                                            </linearGradient>
                                        </defs>
                                        <circle class="bg" cx="50" cy="50" r="40"></circle>
                                        <circle class="progress" cx="50" cy="50" r="40"
                                            stroke="url(#gradient-${subject})"
                                            stroke-dasharray="251.2"
                                            stroke-dashoffset="${251.2 - (attendancePercentage / 100) * 251.2}"
                                        ></circle>
                                        <text x="50" y="55" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="white">
                                            ${attendancePercentage}%
                                        </text>
                                    </svg>
                                </div>
                            </td>
                            <td>
                                <button onclick="window.location.href='calendar.html?subject=${encodeURIComponent(subject)}'">📅 View Calendar</button>
                            </td>
                        `;
                        subjectList.appendChild(newRow);
                    })
                    .catch(error => console.error(`❌ Error fetching attendance for ${subject}:`, error));
            });
        })
        .catch(error => console.error('❌ Error loading subjects:', error));
}

subjectForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const subjectName = subjectNameInput.value.trim();

    if (!subjectName) {
        alert("⚠️ Please enter a subject name.");
        return;
    }

    fetch('/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subjectName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`⚠️ ${data.error}`);
        } else {
            loadSubjects(); 
            subjectNameInput.value = ''; 
        }
    })
    .catch(error => console.error('❌ Error adding subject:', error));
});

document.addEventListener("DOMContentLoaded", loadSubjects);
