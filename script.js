
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");

const enableNotificationsBtn =
    document.getElementById("enableNotificationsBtn");
const notificationStatus =
    document.getElementById("notificationStatus");

const reminderModal = document.getElementById("reminderModal");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const closeModalBtn = document.getElementById("closeModalBtn");

const STORAGE_KEY = "myTodoListTasks";
const REMINDER_TIME = 15 * 60 * 1000;

let tasks = loadTasks();
let modalQueue = [];
let modalOpen = false;

// Load tasks saved in this browser
function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(saved)) return [];

        return saved.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.date === "string" &&
            typeof task.time === "string"
        );
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

// Save tasks to localStorage
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Unable to save tasks. Check your browser storage.");
        return false;
    }
}

// Get the scheduled start time in the user's local timezone
function getStartTime(task) {
    return new Date(`${task.date}T${task.time}:00`).getTime();
}

// Format countdown as days, hours, minutes and seconds
function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(
        0,
        Math.floor(milliseconds / 1000)
    );

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = number => String(number).padStart(2, "0");

    if (days > 0) {
        return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Display a popup inside the webpage
function showPopup(title, message, icon = "🔔") {
    modalQueue.push({ title, message, icon });
    displayNextPopup();
}

function displayNextPopup() {
    if (modalOpen || modalQueue.length === 0) return;

    const popup = modalQueue.shift();

    modalOpen = true;
    modalTitle.textContent = popup.title;
    modalMessage.textContent = popup.message;
    modalIcon.textContent = popup.icon;
    reminderModal.hidden = false;
    closeModalBtn.focus();
}

function closePopup() {
    reminderModal.hidden = true;
    modalOpen = false;
    displayNextPopup();
}

closeModalBtn.addEventListener("click", closePopup);

reminderModal.addEventListener("click", event => {
    if (event.target === reminderModal) {
        closePopup();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modalOpen) {
        closePopup();
    }
});

// Optional browser notification
async function enableNotifications() {
    if (!("Notification" in window)) {
        notificationStatus.textContent =
            "Browser notifications are not supported here.";
        return;
    }

    if (!window.isSecureContext) {
        notificationStatus.textContent =
            "Use HTTPS or localhost to enable browser notifications.";
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            notificationStatus.textContent =
                "Browser notifications are enabled.";
        } else {
            notificationStatus.textContent =
                "Browser notifications are blocked. In-page reminders still work while this page is open.";
        }
    } catch (error) {
        notificationStatus.textContent =
            "Could not enable browser notifications.";
    }
}

enableNotificationsBtn.addEventListener(
    "click",
    enableNotifications
);

function sendNotification(title, message, icon = "🔔") {
    // Always show the in-page popup
    showPopup(title, message, icon);

    // Also attempt a system notification when permitted
    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        try {
            const notification = new Notification(title, {
                body: message,
                icon: ""
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.warn("System notification could not be shown.");
        }
    }
}

// Add a new task
taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskInput.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (!title || !date || !time) {
        alert("Please enter a task, date and time.");
        return;
    }

    const startTime = new Date(`${date}T${time}:00`).getTime();

    if (!Number.isFinite(startTime)) {
        alert("Please enter a valid date and time.");
        return;
    }

    if (startTime <= Date.now()) {
        alert("Please choose a future date and time.");
        return;
    }

    const task = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        title,
        date,
        time,
        completed: false,
        reminderSent: false,
        startAlertSent: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);

    if (!saveTasks()) {
        tasks = tasks.filter(item => item.id !== task.id);
        return;
    }

    renderTasks();
    taskForm.reset();

    showPopup(
        "Task Added!",
        `"${title}" has been scheduled for ${date} at ${time}.`,
        "✅"
    );
});

// Render the task table
function renderTasks() {
    taskList.replaceChildren();

    emptyMessage.hidden = tasks.length > 0;

    // Sort by scheduled time, earliest first
    const sortedTasks = [...tasks].sort(
        (a, b) => getStartTime(a) - getStartTime(b)
    );

    sortedTasks.forEach(task => {
        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        titleCell.className = "task-name";

        const titleText = document.createElement("span");
        titleText.textContent = task.title;

        if (task.completed) {
            titleText.classList.add("completed-task");
        }

        titleCell.appendChild(titleText);

        const dateCell = document.createElement("td");
        dateCell.textContent = task.date;

        const timeCell = document.createElement("td");
        timeCell.textContent = task.time;

        const countdownCell = document.createElement("td");
        const countdown = document.createElement("span");
        countdown.className = "countdown";
        countdown.id = `countdown-${task.id}`;
        countdownCell.appendChild(countdown);

        const completeCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "complete-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as completed`
        );

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;

            if (saveTasks()) {
                renderTasks();

                showPopup(
                    task.completed ? "Task Completed!" : "Task Reopened",
                    task.completed
                        ? `"${task.title}" has been marked as complete.`
                        : `"${task.title}" has been marked as incomplete.`,
                    task.completed ? "🎉" : "📝"
                );
            }
        });

        completeCell.appendChild(checkbox);

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${task.title}`
        );

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        deleteCell.appendChild(deleteButton);

        row.append(
            titleCell,
            dateCell,
            timeCell,
            countdownCell,
            completeCell,
            deleteCell
        );

        taskList.appendChild(row);
    });

    updateCountdowns();
}

// Update every task's countdown
function updateCountdowns() {
    const now = Date.now();

    tasks.forEach(task => {
        const countdown = document.getElementById(
            `countdown-${task.id}`
        );

        if (!countdown) return;

        const startTime = getStartTime(task);
        const remaining = startTime - now;

        countdown.className = "countdown";

        if (task.completed) {
            countdown.textContent = "Completed";
            countdown.classList.add("started");
            return;
        }

        if (remaining > 0) {
            countdown.textContent = formatCountdown(remaining);

            if (remaining <= REMINDER_TIME) {
                countdown.classList.add("soon");
            }
        } else {
            countdown.textContent = "Started";
            countdown.classList.add("overdue");
        }
    });
}

// Check whether a reminder or start alert is due
function checkReminders() {
    const now = Date.now();
    let changed = false;

    tasks.forEach(task => {
        if (task.completed) return;

        const startTime = getStartTime(task);
        const reminderTime = startTime - REMINDER_TIME;

        // Fifteen-minute warning
        if (
            !task.reminderSent &&
            now >= reminderTime &&
            now < startTime
        ) {
            task.reminderSent = true;
            changed = true;

            sendNotification(
                "⏰ Task Reminder!",
                `"${task.title}" starts in 15 minutes. Get ready!`
            );
        }

        // Alert when the scheduled start time arrives
        if (
            !task.startAlertSent &&
            now >= startTime
        ) {
            task.startAlertSent = true;
            changed = true;

            sendNotification(
                "🚀 Your Task Starts Now!",
                `"${task.title}" is scheduled to start now. Time to get started!`,
                "🚀"
            );
        }
    });

    if (changed) {
        saveTasks();
    }

    updateCountdowns();
}

// Delete a task
function deleteTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
        return;
    }

    const previousTasks = tasks;
    tasks = tasks.filter(item => item.id !== id);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    renderTasks();
}

// Keep saved reminders and completion status after reload
renderTasks();
checkReminders();

// Update the countdown and check reminders every second
setInterval(checkReminders, 1000);
