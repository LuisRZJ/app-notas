if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body.dataset.page || 'notes';
    // Elementos UI
    const saveNoteBtn = document.getElementById('save-note-btn');
    const notesContainer = document.getElementById('notes-container');
    const noNotesMessage = document.getElementById('no-notes-message');
    const noteCountEl = document.getElementById('note-count');
    const tagCountEl = document.getElementById('tag-count');
    const storageUsageEl = document.getElementById('storage-usage');
    const storageQuotaEl = document.getElementById('storage-quota');
    const exportNotesBtn = document.getElementById('export-notes-btn');
    const clearAllDataBtn = document.getElementById('clear-all-data-btn');
    const newTagInput = document.getElementById('new-tag-input');
    const newTagColorInput = document.getElementById('new-tag-color');
    const newTagColorWrapper = document.getElementById('new-tag-color-wrapper');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsList = document.getElementById('tags-list');
    const deleteOneModal = document.getElementById('delete-one-modal');
    const deleteAllModal = document.getElementById('delete-all-modal');

    const showNoteFormBtn = document.getElementById('show-note-form-btn');
    const currentDateDisplay = document.getElementById('current-date-display');
    const totalNoteCountDisplay = document.getElementById('total-note-count-display');

    const historyContainer = document.getElementById('history-container');
    const noHistoryMessage = document.getElementById('no-history-message');

    const noteFormModal = document.getElementById('note-form-modal');
    const noteFormModalContent = document.getElementById('note-form-modal-content');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');
    const formTitle = document.getElementById('form-title');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const toggleDateTimeBtn = document.getElementById('toggle-datetime-btn');
    const customDateTimeContainer = document.getElementById('custom-datetime-container');
    const customDateInput = document.getElementById('custom-date');
    const customTimeInput = document.getElementById('custom-time');
    const multiSelectWrapper = document.getElementById('multi-select-wrapper');
    const multiSelectContainer = document.getElementById('multi-select-container');
    const selectedTagsPills = document.getElementById('selected-tags-pills');
    const tagsDropdown = document.getElementById('tags-dropdown');
    const multiSelectPlaceholder = document.getElementById('multi-select-placeholder');


    let db;
    let noteIdToEdit = null;
    let noteIdToDelete = null;
    let draggedTag = null;

    const request = indexedDB.open('NotesDB', 5);
    request.onerror = (e) => console.error('Error DB:', e);
    request.onupgradeneeded = (e) => {
        db = e.target.result;
        const tx = e.target.transaction;
        if (!db.objectStoreNames.contains('notes')) {
            db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tags')) {
            db.createObjectStore('tags', { keyPath: 'name' });
        }
        if (e.oldVersion < 5 && tx.objectStoreNames.contains('notes')) {
            const noteStore = tx.objectStore('notes');
            noteStore.getAll().onsuccess = (event) => {
                event.target.result.forEach(note => {
                    if (note.tag && typeof note.tag === 'string') {
                        note.tags = [note.tag];
                        delete note.tag;
                        noteStore.put(note);
                    }
                });
            };
        }
    };
    request.onsuccess = (e) => {
        db = e.target.result;
        if (typeof populateMultiSelectDropdown === 'function') {
            populateMultiSelectDropdown();
        }
        renderTags();
        refreshActiveView();
    };

    const refreshActiveView = () => {
        switch (pageType) {
            case 'notes':
                renderNotes();
                break;
            case 'history':
                renderHistory();
                break;
            case 'settings':
                updateStorageInfo();
                renderTags();
                break;
            default:
                renderNotes();
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const updateStorageInfo = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const { usage, quota } = await navigator.storage.estimate();
            storageUsageEl.textContent = formatBytes(usage);
            storageQuotaEl.textContent = formatBytes(quota);
        } else {
            storageUsageEl.textContent = 'No Soportado';
            storageQuotaEl.textContent = 'No Soportado';
        }
        updateTotalNoteCount();
        updateTagCount();
    };

    const updateTotalNoteCount = () => {
        if (!db) return;
        db.transaction('notes', 'readonly').objectStore('notes').count().onsuccess = (e) => {
            const count = e.target.result;
            if (noteCountEl) {
                noteCountEl.textContent = count;
            }
            if (totalNoteCountDisplay) {
                totalNoteCountDisplay.textContent = `#${count}`;
            }
        };
    };

    const updateTagCount = () => {
        if (!db) return;
        db.transaction('tags', 'readonly').objectStore('tags').count().onsuccess = (e) => {
            tagCountEl.textContent = e.target.result;
        };
    };

    const displayCurrentDate = () => {
        if (!currentDateDisplay) return;
        currentDateDisplay.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getContrastingTextColor = (hex) => {
        if (!hex) return '#0f172a';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#0f172a' : '#ffffff';
    };

    const renderTags = () => {
        if (!db || !tagsList) return;
        db.transaction('tags', 'readonly').objectStore('tags').getAll().onsuccess = (e) => {
            const sortedTags = e.target.result.sort((a, b) => a.order - b.order);
            tagsList.innerHTML = '';
            if (sortedTags.length === 0) {
                tagsList.innerHTML = '<p class="text-slate-500 text-sm">No has creado ninguna etiqueta.</p>';
                return;
            }
            sortedTags.forEach(tag => {
                const tagEl = document.createElement('div');
                tagEl.className = 'tag-draggable flex justify-between items-center p-2 bg-slate-100 rounded-lg';
                tagEl.dataset.tagName = tag.name;
                tagEl.draggable = true;
                tagEl.innerHTML = `
                    <div class="flex items-center gap-3">
                        <svg class="grab-handle cursor-move text-slate-400 touch-none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        <div class="w-5 h-5 rounded-full" style="background-color: ${tag.color};"></div>
                        <span class="font-medium text-slate-700">${tag.name}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="edit" class="text-slate-500 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil pointer-events-none"><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"/></svg></button>
                        <button data-action="delete" class="text-slate-500 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle pointer-events-none"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg></button>
                    </div>`;
                tagsList.appendChild(tagEl);
            });
        };
    };

    const addTag = () => {
        const tagName = newTagInput.value.trim();
        const tagColor = newTagColorInput.value;
        if (tagName === '' || !db) return;

        const tx = db.transaction('tags', 'readwrite');
        const tagStore = tx.objectStore('tags');

        tagStore.count().onsuccess = (e) => {
            const newOrder = e.target.result;
            tagStore.add({ name: tagName, color: tagColor, order: newOrder }).onsuccess = () => {
                newTagInput.value = '';
                renderTags();
                populateMultiSelectDropdown();
                updateTagCount();
            };
        };
    };

    const updateTag = (oldName, newName, newColor) => {
        const tx = db.transaction(['tags', 'notes'], 'readwrite');
        const tagStore = tx.objectStore('tags');
        const noteStore = tx.objectStore('notes');

        tagStore.get(oldName).onsuccess = (e) => {
            const oldTag = e.target.result;
            tagStore.delete(oldName);
            tagStore.add({ name: newName, color: newColor, order: oldTag.order });

            if (oldName !== newName) {
                noteStore.openCursor().onsuccess = eCursor => {
                    const cursor = eCursor.target.result;
                    if (cursor) {
                        const note = cursor.value;
                        if (Array.isArray(note.tags) && note.tags.includes(oldName)) {
                            note.tags = note.tags.map(t => (t === oldName ? newName : t));
                            cursor.update(note);
                        }
                        cursor.continue();
                    }
                };
            }
        };

        tx.oncomplete = () => {
            renderTags();
            populateMultiSelectDropdown();
            refreshActiveView();
        };
    };

    const startEditingTag = (tagEl) => {
        tagEl.draggable = false;
        tagEl.classList.remove('tag-draggable');
        const oldName = tagEl.dataset.tagName;
        const tagColorDiv = tagEl.querySelector('div[style^="background-color"]');
        const originalColor = rgbToHex(tagColorDiv.style.backgroundColor);

        tagEl.innerHTML = `
            <div class="flex items-center gap-2 flex-grow">
                <div class="color-picker-wrapper" style="background-color: ${originalColor};">
                    <input type="color" value="${originalColor}">
                </div>
                <input type="text" value="${oldName}" class="w-full p-1 border border-slate-300 rounded-md">
            </div>
            <div class="flex items-center gap-2">
                <button data-action="save" class="text-slate-500 hover:text-green-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check pointer-events-none"><polyline points="20 6 9 17 4 12"/></svg></button>
                <button data-action="cancel" class="text-slate-500 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x pointer-events-none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>`;
        tagEl.querySelector('input[type="color"]').addEventListener('input', (e) => {
            e.target.parentElement.style.backgroundColor = e.target.value;
        });
        tagEl.querySelector('input[type="text"]').focus();
    };

    const rgbToHex = (rgb) => {
        if (!rgb || !rgb.includes('rgb')) return rgb;
        const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (!match) return '#000000';
        const [, r, g, b] = match.map(Number);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    const populateMultiSelectDropdown = () => {
        if (!db || !tagsDropdown) return;
        db.transaction('tags', 'readonly').objectStore('tags').getAll().onsuccess = e => {
            const sortedTags = e.target.result.sort((a, b) => a.order - b.order);
            tagsDropdown.innerHTML = '';
            sortedTags.forEach(tag => {
                const optionEl = document.createElement('div');
                optionEl.className = 'p-2 hover:bg-slate-100 cursor-pointer';
                optionEl.innerHTML = `<input type="checkbox" id="tag-${tag.name}" value="${tag.name}" class="mr-2"> <label for="tag-${tag.name}">${tag.name}</label>`;
                tagsDropdown.appendChild(optionEl);
            });
            updateSelectedTagPills();
        };
    };

    const updateSelectedTagPills = () => {
        if (!db || !tagsDropdown || !selectedTagsPills || !multiSelectPlaceholder) return;
        const selectedCheckboxes = tagsDropdown.querySelectorAll('input[type="checkbox"]:checked');
        selectedTagsPills.innerHTML = '';
        multiSelectPlaceholder.classList.toggle('hidden', selectedCheckboxes.length > 0);

        const tagStore = db.transaction('tags', 'readonly').objectStore('tags');
        selectedCheckboxes.forEach(checkbox => {
            tagStore.get(checkbox.value).onsuccess = e => {
                const tagData = e.target.result;
                if (!tagData) return;
                const pill = document.createElement('span');
                pill.className = 'text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1';
                pill.style.backgroundColor = tagData.color;
                pill.style.color = getContrastingTextColor(tagData.color);
                pill.innerHTML = `${tagData.name} <button data-tag-name="${tagData.name}" class="remove-pill-btn font-bold">&times;</button>`;
                selectedTagsPills.appendChild(pill);
            };
        });
    };

    const renderNotes = () => {
        if (!db || !notesContainer || !noNotesMessage) return;
        displayCurrentDate();
        updateTotalNoteCount();
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const range = IDBKeyRange.lowerBound(startOfToday);

        const tx = db.transaction(['notes', 'tags'], 'readonly');
        tx.objectStore('tags').getAll().onsuccess = (eTags) => {
            const tagsMap = eTags.target.result.reduce((acc, tag) => ({ ...acc, [tag.name]: tag }), {});
            const notesForToday = [];
            tx.objectStore('notes').openCursor(range, 'prev').onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor && new Date(cursor.value.id).toDateString() === today.toDateString()) {
                    notesForToday.push(cursor.value);
                    cursor.continue();
                } else {
                    notesContainer.innerHTML = '';
                    noNotesMessage.classList.toggle('hidden', notesForToday.length > 0);
                    notesForToday.forEach(note => notesContainer.appendChild(createNoteElement(note, tagsMap)));
                }
            };
        };
    };

    const renderHistory = () => {
        if (!db || !historyContainer || !noHistoryMessage) return;
        const tx = db.transaction(['notes', 'tags'], 'readonly');
        tx.objectStore('tags').getAll().onsuccess = (eTags) => {
            const tagsMap = eTags.target.result.reduce((acc, tag) => ({ ...acc, [tag.name]: tag }), {});
            tx.objectStore('notes').getAll().onsuccess = (eNotes) => {
                const allNotes = eNotes.target.result.sort((a, b) => b.id - a.id);
                historyContainer.innerHTML = '';
                noHistoryMessage.classList.toggle('hidden', allNotes.length > 0);
                if (allNotes.length === 0) return;

                let currentDay = null;
                let dayGridContainer = null;
                allNotes.forEach(note => {
                    const noteDay = new Date(note.id).toDateString();
                    if (noteDay !== currentDay) {
                        currentDay = noteDay;
                        const dateSeparator = document.createElement('div');
                        dateSeparator.className = 'pt-4';
                        dateSeparator.innerHTML = `<h3 class="text-lg font-semibold text-slate-600 bg-slate-200/70 inline-block px-3 py-1 rounded-lg">${new Date(note.id).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>`;
                        historyContainer.appendChild(dateSeparator);
                        dayGridContainer = document.createElement('div');
                        dayGridContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4';
                        historyContainer.appendChild(dayGridContainer);
                    }
                    dayGridContainer.appendChild(createNoteElement(note, tagsMap));
                });
            };
        };
    };

    const createNoteElement = (note, tagsMap) => {
        const div = document.createElement('div');
        div.className = 'note-card bg-white p-5 rounded-xl shadow-md flex flex-col justify-between transition-transform transform hover:-translate-y-1';

        let tagsEl = '<div class="flex flex-wrap gap-2">';
        if (Array.isArray(note.tags)) {
            note.tags.forEach(tagName => {
                const tag = tagsMap[tagName];
                if (tag) {
                    tagsEl += `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" style="background-color:${tag.color}; color:${getContrastingTextColor(tag.color)};">${tagName}</span>`;
                }
            });
        }
        tagsEl += '</div>';

        div.innerHTML = `
            <div class="flex-grow">
                <h3 class="text-xl font-bold mb-1 text-slate-800">${note.title}</h3>
                <p class="text-xs text-slate-400 mb-3">${new Date(note.id).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                <p class="text-slate-600" style="white-space: pre-wrap;">${note.content}</p>
            </div>
            <div class="flex justify-between items-center pt-3 mt-4 border-t border-slate-200">
                <div class="flex-grow overflow-hidden pr-2">${tagsEl}</div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button data-id="${note.id}" class="edit-one-btn text-slate-500 hover:text-blue-600 transition"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-pen-line pointer-events-none"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z"/><path d="M8 18h1"/><path d="M18.4 9.6a2 2 0 1 1 3 3L17 17l-4 1 1-4Z"/></svg></button>
                    <button data-id="${note.id}" class="delete-one-btn text-slate-500 hover:text-red-700 transition"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 pointer-events-none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                </div>
            </div>`;
        return div;
    };

    const saveNote = () => {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        const selectedTags = [...tagsDropdown.querySelectorAll('input:checked')].map(cb => cb.value);
        if (content === '') return;

        let noteTimestamp;
        if (noteIdToEdit !== null) {
            const customTs = new Date(`${customDateInput.value}T${customTimeInput.value}`).getTime();
            noteTimestamp = Number.isNaN(customTs) ? noteIdToEdit : customTs;
        } else {
            noteTimestamp = (!customDateTimeContainer.classList.contains('hidden') && customDateInput.value && customTimeInput.value)
                ? new Date(`${customDateInput.value}T${customTimeInput.value}`).getTime()
                : Date.now();
        }

        const tx = db.transaction('notes', 'readwrite');
        const store = tx.objectStore('notes');
        if (noteIdToEdit !== null && noteIdToEdit !== noteTimestamp) {
            store.delete(noteIdToEdit);
        }
        store.put({ id: noteTimestamp, title: title || 'Nota sin título', content, tags: selectedTags });
        tx.oncomplete = () => {
            resetForm();
            refreshActiveView();
        };
    };

    const startEditingNote = (noteId) => {
        db.transaction('notes', 'readonly').objectStore('notes').get(noteId).onsuccess = (e) => {
            const note = e.target.result;
            if (!note) return;
            showNoteFormModal();
            noteIdToEdit = note.id;
            formTitle.textContent = 'Editando Nota';
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            cancelEditBtn.classList.remove('hidden');

            const noteDate = new Date(note.id);
            customDateInput.value = noteDate.toISOString().slice(0, 10);
            customTimeInput.value = noteDate.toTimeString().slice(0, 5);
            customDateTimeContainer.classList.remove('hidden');

            tagsDropdown.querySelectorAll('input').forEach(cb => {
                cb.checked = (note.tags || []).includes(cb.value);
            });
            updateSelectedTagPills();

            saveNoteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Guardar Cambios</span>';
        };
    };

    const resetForm = () => {
        hideNoteFormModal();
        noteIdToEdit = null;
        formTitle.textContent = 'Crear una nota nueva';
        cancelEditBtn.classList.add('hidden');
        noteTitleInput.value = '';
        noteContentInput.value = '';
        tagsDropdown.querySelectorAll('input:checked').forEach(cb => {
            cb.checked = false;
        });
        updateSelectedTagPills();
        customDateTimeContainer.classList.add('hidden');
        customDateInput.value = '';
        customTimeInput.value = '';
        saveNoteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg><span>Añadir Nota</span>';
    };

    const exportData = () => {
        if (!db) return;
        const tx = db.transaction(['notes', 'tags'], 'readonly');
        tx.objectStore('notes').getAll().onsuccess = (eNotes) => {
            tx.objectStore('tags').getAll().onsuccess = (eTags) => {
                const exportObj = { notes: eNotes.target.result, tags: eTags.target.result };
                const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `notas-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
            };
        };
    };

    const clearAllData = () => {
        if (!db) return;
        const tx = db.transaction(['notes', 'tags'], 'readwrite');
        tx.objectStore('notes').clear();
        tx.objectStore('tags').clear();
        tx.oncomplete = () => {
            refreshActiveView();
            renderTags();
            populateMultiSelectDropdown();
            updateStorageInfo();
        };
    };

    const showNoteFormModal = () => {
        noteFormModal.classList.remove('hidden');
        setTimeout(() => {
            noteFormModal.classList.add('opacity-100');
            noteFormModalContent.classList.remove('scale-95');
        }, 10);
    };
    const hideNoteFormModal = () => {
        noteFormModal.classList.remove('opacity-100');
        noteFormModalContent.classList.add('scale-95');
        setTimeout(() => noteFormModal.classList.add('hidden'), 300);
    };
    const showModal = (modal) => {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('opacity-100');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);
    };
    const hideModal = (modal) => {
        modal.classList.remove('opacity-100');
        modal.querySelector('div').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    // --- Event Listeners ---
    if (showNoteFormBtn) showNoteFormBtn.addEventListener('click', showNoteFormModal);
    if (saveNoteBtn) saveNoteBtn.addEventListener('click', saveNote);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetForm);
    if (exportNotesBtn) exportNotesBtn.addEventListener('click', exportData);
    if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', () => showModal(deleteAllModal));
    if (toggleDateTimeBtn) toggleDateTimeBtn.addEventListener('click', () => customDateTimeContainer.classList.toggle('hidden'));
    if (addTagBtn) addTagBtn.addEventListener('click', addTag);
    if (newTagColorInput && newTagColorWrapper) {
        newTagColorInput.addEventListener('input', () => {
            newTagColorWrapper.style.backgroundColor = newTagColorInput.value;
        });
    }
    if (noteFormModal) {
        noteFormModal.addEventListener('click', (e) => {
            if (e.target === noteFormModal) {
                resetForm();
            }
        });
    }
    if (multiSelectContainer && tagsDropdown) {
        multiSelectContainer.addEventListener('click', () => {
            tagsDropdown.classList.toggle('hidden');
        });
    }
    if (tagsDropdown) tagsDropdown.addEventListener('change', updateSelectedTagPills);
    if (selectedTagsPills) {
        selectedTagsPills.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-pill-btn')) {
                const checkbox = tagsDropdown?.querySelector(`input[value="${e.target.dataset.tagName}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
                updateSelectedTagPills();
            }
        });
    }
    if (multiSelectWrapper && tagsDropdown) {
        document.addEventListener('click', (e) => {
            if (!multiSelectWrapper.contains(e.target)) {
                tagsDropdown.classList.add('hidden');
            }
        });
    }

    if (tagsList) {
        tagsList.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            const action = button.dataset.action;
            const tagEl = e.target.closest('div[data-tag-name]');
            if (!action || !tagEl) return;
            const oldName = tagEl.dataset.tagName;
            if (action === 'delete') {
                db.transaction('tags', 'readwrite').objectStore('tags').delete(oldName).onsuccess = () => {
                    renderTags();
                    populateMultiSelectDropdown();
                    updateTagCount();
                };
            } else if (action === 'edit') {
                startEditingTag(tagEl);
            } else if (action === 'save') {
                const newName = tagEl.querySelector('input[type="text"]').value.trim();
                const newColor = tagEl.querySelector('input[type="color"]').value;
                if (newName) {
                    updateTag(oldName, newName, newColor);
                }
            } else if (action === 'cancel') {
                renderTags();
            }
        });
    }

    // Reorder Logic for Desktop (Drag & Drop) & Mobile (Touch)
    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll('.tag-draggable:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };
    const saveTagOrder = () => {
        const tx = db.transaction('tags', 'readwrite');
        [...tagsList.querySelectorAll('.tag-draggable')].forEach((tagEl, index) => {
            tx.objectStore('tags').get(tagEl.dataset.tagName).onsuccess = (e) => {
                const tagData = e.target.result;
                if (tagData) {
                    tagData.order = index;
                    tx.objectStore('tags').put(tagData);
                }
            };
        });
        tx.oncomplete = populateMultiSelectDropdown;
    };

    if (tagsList) {
        tagsList.addEventListener('dragstart', (e) => {
            draggedTag = e.target.closest('.tag-draggable');
            if (draggedTag) draggedTag.classList.add('dragging');
        });
        tagsList.addEventListener('dragend', () => {
            if (draggedTag) {
                draggedTag.classList.remove('dragging');
            }
        });
        tagsList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(tagsList, e.clientY);
            if (draggedTag) {
                tagsList.insertBefore(draggedTag, afterElement || null);
            }
        });
        tagsList.addEventListener('drop', (e) => {
            e.preventDefault();
            saveTagOrder();
        });

        tagsList.addEventListener('touchstart', (e) => {
            if (e.target.closest('.grab-handle')) {
                draggedTag = e.target.closest('.tag-draggable');
                if (draggedTag) draggedTag.classList.add('dragging');
            }
        });
        tagsList.addEventListener('touchmove', (e) => {
            if (!draggedTag) return;
            e.preventDefault();
            const afterElement = getDragAfterElement(tagsList, e.touches[0].clientY);
            tagsList.insertBefore(draggedTag, afterElement || null);
        });
        tagsList.addEventListener('touchend', () => {
            if (!draggedTag) return;
            draggedTag.classList.remove('dragging');
            draggedTag = null;
            saveTagOrder();
        });
    }

    document.body.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-one-btn');
        if (deleteBtn) {
            noteIdToDelete = parseInt(deleteBtn.dataset.id, 10);
            if (deleteOneModal) showModal(deleteOneModal);
            return;
        }
        const editBtn = e.target.closest('.edit-one-btn');
        if (editBtn) {
            startEditingNote(parseInt(editBtn.dataset.id, 10));
        }
    });

    [deleteOneModal, deleteAllModal].filter(Boolean).forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.dataset.action === 'cancel') {
                hideModal(modal);
            }
            if (e.target.dataset.action === 'confirm') {
                if (modal.id === 'delete-one-modal' && noteIdToDelete) {
                    db.transaction('notes', 'readwrite').objectStore('notes').delete(noteIdToDelete).onsuccess = refreshActiveView;
                    noteIdToDelete = null;
                } else if (modal.id === 'delete-all-modal') {
                    clearAllData();
                }
                hideModal(modal);
            }
        });
    });
});
