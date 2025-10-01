const DB_NAME = "notes-db";
const DB_VERSION = 1;
const STORE_NAME = "notes";

let dbInstance = null;
let installPrompt = null;
const state = {
    notes: [],
    filteredNotes: []
};

const noteForm = document.querySelector("#noteForm");
const noteIdInput = document.querySelector("#noteId");
const noteTitleInput = document.querySelector("#noteTitle");
const noteContentInput = document.querySelector("#noteContent");
const formTitleLabel = document.querySelector("#formTitle");
const saveButton = document.querySelector("#saveButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const notesList = document.querySelector("#notesList");
const notesEmptyState = document.querySelector("#notesEmptyState");
const searchInput = document.querySelector("#searchInput");
const syncStatus = document.querySelector("#syncStatus");
const installButton = document.querySelector("#installButton");
const noteTemplate = document.querySelector("#noteItemTemplate");

async function openDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    dbInstance = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true
                });
                store.createIndex("updatedAt", "updatedAt", { unique: false });
                store.createIndex("title", "title", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    dbInstance.onclose = () => {
        dbInstance = null;
    };

    return dbInstance;
}

// Helper to normalize/convert an ID input into a valid numeric key or undefined
function normalizeId(value) {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        if (Number.isFinite(value)) return value;
        return undefined;
    }
    const s = String(value).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}

async function withStore(mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);

        let callbackResult;
        try {
            callbackResult = callback(store);
        } catch (err) {
            transaction.abort();
            return reject(err);
        }

        // If the callback returned an IDBRequest, wire its events to resolve/reject.
        // If it returned a Promise, wait for it. Otherwise resolve on transaction complete.
        const isRequest = callbackResult && typeof callbackResult.addEventListener === 'function' && ('onsuccess' in callbackResult || 'onerror' in callbackResult);
        const isPromise = callbackResult && typeof callbackResult.then === 'function';

        if (isRequest) {
            callbackResult.onsuccess = (e) => {
                // don't resolve here: let transaction.oncomplete report final state,
                // but provide the request.result as an immediate resolution if desired.
                // we resolve with the request.result once the transaction completes.
            };
            callbackResult.onerror = (e) => {
                // if the underlying request errors, reject early
                reject(callbackResult.error || new Error('IDBRequest error'));
            };
        }

        if (isPromise) {
            callbackResult.then((r) => {
                // wait for transaction to complete to guarantee durability
            }).catch((err) => reject(err));
        }

        transaction.oncomplete = () => {
            // Prefer returning a resolved value from a promise request if any,
            // otherwise return the callbackResult (could be undefined) or the result of a request
            if (isRequest) {
                resolve(callbackResult.result);
            } else if (isPromise) {
                callbackResult.then(resolve, reject);
            } else {
                resolve(callbackResult);
            }
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

async function getAllNotes() {
    return withStore("readonly", (store) => {
        const notes = [];
        const index = store.index("updatedAt");
        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, "prev");
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    notes.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(notes);
                }
            };
            request.onerror = (event) => reject(event.target.error);
        });
    });
}

async function saveNote(note) {
    const now = new Date().toISOString();
    
    // Normalize the ID first
    const normalized = normalizeId(note.id);
    
    // Build the sanitized object, only including id if it's valid
    const sanitized = {
        title: note.title,
        content: note.content,
        updatedAt: now
    };
    
    // Only add id if it's a valid number
    if (normalized !== undefined) {
        sanitized.id = normalized;
    }

    return withStore("readwrite", (store) => {
        const req = store.put(sanitized);
        return req;
    });
}

async function deleteNote(id) {
    const nid = normalizeId(id);
    if (nid === undefined) {
        return Promise.reject(new Error('ID inválido para eliminar'));
    }
    return withStore("readwrite", (store) => store.delete(nid));
}

function renderNotes(notes) {
    notesList.innerHTML = "";

    if (!notes.length) {
        notesEmptyState.hidden = false;
        notesList.setAttribute("aria-busy", "false");
        return;
    }

    notesEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();

    for (const note of notes) {
        const noteElement = noteTemplate.content.firstElementChild.cloneNode(true);
        const titleElement = noteElement.querySelector(".note-title");
        const contentElement = noteElement.querySelector(".note-content");
        const timeElement = noteElement.querySelector(".note-updated");
        const editButton = noteElement.querySelector(".edit-note");
        const deleteButton = noteElement.querySelector(".delete-note");

        titleElement.textContent = note.title;
        contentElement.textContent = note.content;

        const updatedDate = new Date(note.updatedAt);
        timeElement.dateTime = updatedDate.toISOString();
        timeElement.textContent = formatUpdatedDate(updatedDate);

        editButton.dataset.noteId = note.id;
        deleteButton.dataset.noteId = note.id;

        fragment.appendChild(noteElement);
    }

    notesList.appendChild(fragment);
}

function formatUpdatedDate(date) {
    const formatter = new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    return `Actualizada ${formatter.format(date)}`;
}

function populateForm(note) {
    noteIdInput.value = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    formTitleLabel.textContent = "Editar nota";
    saveButton.textContent = "Actualizar nota";
    cancelEditButton.hidden = false;
    noteTitleInput.focus();
}

function resetForm() {
    noteForm.reset();
    noteIdInput.value = "";
    formTitleLabel.textContent = "Nueva nota";
    saveButton.textContent = "Guardar nota";
    cancelEditButton.hidden = true;
}

function filterNotes(searchTerm) {
    if (!searchTerm) {
        state.filteredNotes = [...state.notes];
        return;
    }

    const normalizedTerm = searchTerm.toLowerCase();
    state.filteredNotes = state.notes.filter((note) => {
        const title = (note.title || '').toLowerCase();
        const content = (note.content || '').toLowerCase();
        return title.includes(normalizedTerm) || content.includes(normalizedTerm);
    });
}

async function refreshNotes(showMessage = false, message = "") {
    try {
        notesList.setAttribute("aria-busy", "true");
        state.notes = await getAllNotes();
        filterNotes(searchInput.value.trim());
        renderNotes(state.filteredNotes);
        if (showMessage && message) {
            showSyncStatus(message);
        }
    } catch (error) {
        console.error("Error al obtener notas", error);
        showSyncStatus("No se pudieron cargar las notas.", true);
    } finally {
        notesList.setAttribute("aria-busy", "false");
    }
}

function showSyncStatus(message, isError = false) {
    syncStatus.textContent = message;
    syncStatus.classList.toggle("visible", true);
    syncStatus.style.background = isError ? "rgba(211, 47, 47, 0.92)" : "rgba(63, 81, 181, 0.92)";
    clearTimeout(showSyncStatus.timeoutId);
    showSyncStatus.timeoutId = setTimeout(() => {
        syncStatus.classList.toggle("visible", false);
    }, 2500);
}

noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!title || !content) {
        showSyncStatus("Completa el título y el contenido para guardar la nota.", true);
        return;
    }

    const idValue = noteIdInput.value ? noteIdInput.value.trim() : undefined;
    const id = normalizeId(idValue);

    try {
        await saveNote({
            id,
            title,
            content
        });
        resetForm();
        await refreshNotes(true, "Nota guardada");
    } catch (error) {
        console.error("Error al guardar nota", error);
        showSyncStatus("No se pudo guardar la nota.", true);
    }
});

cancelEditButton.addEventListener("click", () => {
    resetForm();
});

notesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    if (target.matches(".edit-note")) {
        const noteId = normalizeId(target.dataset.noteId);
        const note = state.notes.find((item) => item.id === noteId);
        if (note) {
            populateForm(note);
        }
    }

    if (target.matches(".delete-note")) {
        const noteId = normalizeId(target.dataset.noteId);
        const confirmed = window.confirm("¿Eliminar esta nota?");
        if (!confirmed) {
            return;
        }
        try {
            await deleteNote(noteId);
            await refreshNotes(true, "Nota eliminada");
        } catch (error) {
            console.error("Error al eliminar nota", error);
            showSyncStatus("No se pudo eliminar la nota.", true);
        }
    }
});

searchInput.addEventListener("input", () => {
    filterNotes(searchInput.value.trim());
    renderNotes(state.filteredNotes);
});

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
    if (!installPrompt) {
        return;
    }

    installButton.disabled = true;
    const { outcome } = await installPrompt.prompt();
    if (outcome === "accepted") {
        showSyncStatus("Instalación en progreso");
    }
    installPrompt = null;
    installButton.hidden = true;
    installButton.disabled = false;
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("PWA/service-worker.js").catch((error) => {
            console.error("Error al registrar el Service Worker", error);
        });
    });
}

// Inicializar lista de notas
refreshNotes();
