const taskInput = document.getElementById("taskInput");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");


addTaskBtn.addEventListener("click", function () {

    const task = taskInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    // Check if task is empty
    if (task === "") {
        alert("Please enter a task!");
        return;
    }

    // Create a new table row
    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="task">${task}</td>

        <td>${date || "No date"}</td>

        <td>${time || "No time"}</td>

        <td>
            <button class="complete-btn">
                Complete
            </button>
        </td>

        <td>
            <button class="delete-btn">
                Delete
            </button>
        </td>
    `;

    // Add row to table
    taskList.appendChild(row);


    // Complete button
    const completeBtn = row.querySelector(".complete-btn");

    completeBtn.addEventListener("click", function () {

        const taskText = row.querySelector(".task");

        taskText.classList.toggle("completed");

        if (taskText.classList.contains("completed")) {
            completeBtn.textContent = "Completed";
        } else {
            completeBtn.textContent = "Complete";
        }

    });


    // Delete button
    const deleteBtn = row.querySelector(".delete-btn");

    deleteBtn.addEventListener("click", function () {
        row.remove();
    });


    // Clear inputs
    taskInput.value = "";
    dateInput.value = "";
    timeInput.value = "";

});