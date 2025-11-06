
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

// Import modular Realtime Database functions

import {
    getDatabase,
    ref,
    push,
    get,
    query,
    orderByChild,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY_PLACEHOLDER", // Changed to a string placeholder
    authDomain: "adsavebank.firebaseapp.com",
    databaseURL:
        "https://adsavebank-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "adsavebank",
    storageBucket: "adsavebank.firebasestorage.app",
    messagingSenderId: "724985791679",
    appId: "1:724985791679:web:97d49e462d6bae98ae320a",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Realtime Database instance using the modular approach
const db = getDatabase(app);

/**
 * Saves the current save file string to the Firebase Realtime Database.
 * @param {HTMLInputElement} saveFileInput The input element containing the save string.
* @param {HTMLElement} statusElement The element to display status messages.
*/
export async function saveSaveFileToDb(saveFileInput, statusElement) {
    const file = saveFileInput.value;
    if (!file || file.length === 0) {
        statusElement.innerHTML = "Please enter a save file string first.";
        return;
    }

    statusElement.innerHTML = "Saving file...";
    try {
        // Use modular push function
        await push(ref(db, "savedata"), {
            saveString: file,
            timestamp: Date.now(),
        });

        statusElement.innerHTML = "Save file successfully saved!";
        saveFileInput.value = ""; // Clear the input after saving
    } catch (err) {
        statusElement.innerHTML = "Error saving file: " + err.message;
        console.error("Error saving file:", err);
    }
}

/**
 * Retrieves all save files from the database, sorted by timestamp (newest first).
 * @param {HTMLElement} statusElement The element to display status messages for errors.
* @returns {Promise < Array < { id: string, saveString: string, timestamp: number } >>}
*          A promise that resolves to a list of save file objects.
*/
async function getSaveFilesFromDb(statusElement) {
    try {
        // Create a reference to the 'savedata' path
        const savedataRef = ref(db, "savedata");

        // Create a query to order by timestamp
        const q = query(savedataRef, orderByChild("timestamp"));

        // Get the snapshot using the modular get function
        const snapshot = await get(q);
        const files = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                files.push({
                    id: child.key, // Firebase's unique key
                    ...child.val(), // The actual data (saveString and timestamp)
                });
            });
        }

        // Reverse to get newest first (orderByChild sorts ascending by default)
        return files.reverse();
    } catch (err) {
        statusElement.innerHTML = "Error retrieving files: " + err.message;
        console.error("Error getting save files:", err);
        throw err; // Re-throw to propagate the error
    }
}

/**
 * Copies text to the clipboard.
 * @param {string} text The text to copy.
*/
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    } catch (err) {
        alert("Failed to copy: " + (err.message || err));
        console.error("Failed to copy to clipboard:", err);
    }
}

/**
 * Fetches all save files and displays them as clickable buttons.
 * @param {HTMLElement} statusElement The element to display status messages.
* @param {HTMLElement} copyBtnsElement The container element for the save file buttons.
*/
export async function getAllSaveFiles(statusElement, copyBtnsElement) {
    statusElement.innerHTML = "Getting save files...";
    try {
        const saveFiles = await getSaveFilesFromDb(statusElement);

        // Clear existing buttons before adding new ones
        copyBtnsElement.innerHTML = "";
        if (saveFiles.length === 0) {
            statusElement.innerHTML = "No save files found.";
            return;
        }

        saveFiles.forEach((file) => {
            const btn = createBtnElement(file);
            copyBtnsElement.appendChild(btn); // Append the button to the DOM
        });
        statusElement.innerHTML = "Done.";
    } catch (err) {
        // Error already handled by getSaveFilesFromDb, or a new one here.
        statusElement.innerHTML = "Error loading or displaying files.";
        console.error("Error in getAllSaveFiles:", err);
    }
}

/**
 * Creates a button element for a given save file.
 * @param {object} savefile The save file object.
* @returns {HTMLButtonElement} The created button element.
*/
function createBtnElement(savefile) {
    const btn = document.createElement("button");
    const saveDate = new Date(savefile.timestamp);

    // Correct date formatting
    const dateString = 
    String(saveDate.getHours()).padStart(2, "0") + ":" + String(saveDate.getMinutes()).padStart(2, "0") + " | " + [
        String(saveDate.getDate()).padStart(2, "0"),
        String(saveDate.getMonth() + 1).padStart(2, "0"), // Month is 0-indexed
        saveDate.getFullYear(),
    ].join("-");

    // Display a truncated Firebase ID and the date
    btn.innerText = `Save from ${dateString}`;

    // Ensure savefile.saveString is copied
    btn.onclick = () => {
        copyToClipboard(savefile.saveString);
    };
    return btn;
}
