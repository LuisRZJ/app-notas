// El registro del Service Worker se realiza en js/core/pwa.js
// para páginas migradas a la estructura mantenible.
// Este bloque se mantiene solo para compatibilidad con páginas no migradas
// (ajustes.html, estadistica.html, reflexion.html) que aún cargan app.js directamente.
if ('serviceWorker' in navigator && !window.__swRegistered) {
    window.__swRegistered = true;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(() => {
                console.log('Service Worker registrado correctamente');
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

let deferredInstallPrompt = null;
let installBtnEl = null;

const showInstallButton = () => {
    if (installBtnEl) {
        installBtnEl.classList.remove('hidden');
    }
};

const hideInstallButton = () => {
    if (installBtnEl) {
        installBtnEl.classList.add('hidden');
    }
};

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallButton();
});

document.addEventListener('componentsLoaded', () => {
    const pageType = document.body.dataset.page || 'notes';
    // Elementos UI
    const saveNoteBtn = document.getElementById('save-note-btn');
    const notesContainer = document.getElementById('notes-container');
    const noNotesMessage = document.getElementById('no-notes-message');
    const noteCountEl = document.getElementById('note-count');
    const tagCountEl = document.getElementById('tag-count');
    const storageUsageEl = document.getElementById('storage-usage');
    const storageQuotaEl = document.getElementById('storage-quota');
    const indexedDbUsageEl = document.getElementById('indexeddb-usage');
    const localStorageUsageEl = document.getElementById('localstorage-usage');
    const storageChartCanvas = document.getElementById('storage-chart');
    const storageChartMessageEl = document.getElementById('storage-chart-message');
    const birthdayMonthSelect = document.getElementById('birthday-month');
    const birthdayDayInput = document.getElementById('birthday-day');
    const saveBirthdayBtn = document.getElementById('save-birthday-btn');
    const clearBirthdayBtn = document.getElementById('clear-birthday-btn');
    const birthdayStatusEl = document.getElementById('birthday-status');
    const userNameInput = document.getElementById('user-name-input');
    const saveUserNameBtn = document.getElementById('save-user-name-btn');
    const clearUserNameBtn = document.getElementById('clear-user-name-btn');
    const userNameStatusEl = document.getElementById('user-name-status');
    const discordWebhookInput = document.getElementById('discord-webhook-input');
    const saveWebhookBtn = document.getElementById('save-webhook-btn');
    const clearWebhookBtn = document.getElementById('clear-webhook-btn');
    const webhookStatusEl = document.getElementById('webhook-status');
    const themeSelect = document.getElementById('theme-select');
    const metaThemeColorEl = document.querySelector('meta[name="theme-color"]');
    const rootElement = document.documentElement;
    const systemThemeMedia = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const importNotesBtn = document.getElementById('import-notes-btn');
    const importFileInput = document.getElementById('import-file-input');
    const exportNotesBtn = document.getElementById('export-notes-btn');
    const exportDiscordBtn = document.getElementById('export-discord-btn');
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

    const birthdayBannerEl = document.getElementById('birthday-banner');
    const birthdayMessageHeadingEl = document.getElementById('birthday-message-heading');
    const birthdayMessageTextEl = document.getElementById('birthday-message-text');

    const historyContainer = document.getElementById('history-container');
    const noHistoryMessage = document.getElementById('no-history-message');
    const weeklyOverviewSection = document.getElementById('weekly-overview');
    const weeklyActivitySummary = document.getElementById('weekly-activity-summary');
    const weeklyWeekRange = document.getElementById('weekly-week-range');
    const weeklyActivityDaysContainer = document.getElementById('weekly-activity-days');
    const weeklyDayElements = weeklyActivityDaysContainer ? Array.from(weeklyActivityDaysContainer.querySelectorAll('.weekly-day')) : [];
    const historySearchInput = document.getElementById('history-search-input');
    const historySearchClearBtn = document.getElementById('history-search-clear-btn');
    const historySearchEmptyMessage = document.getElementById('history-search-empty');
    const tagFilterToggle = document.getElementById('tag-filter-toggle');
    const tagFilterToggleLabel = document.getElementById('tag-filter-toggle-label');
    const tagFilterDropdown = document.getElementById('tag-filter-dropdown');
    const tagFilterOptions = document.getElementById('tag-filter-options');
    const tagFilterEmpty = document.getElementById('tag-filter-empty');
    const tagFilterSelectedEmpty = document.getElementById('tag-filter-selected-empty');
    const tagFilterClearBtn = document.getElementById('tag-filter-clear');
    const tagFilterApplyBtn = document.getElementById('tag-filter-apply');
    const tagFilterSummary = document.getElementById('tag-filter-summary');

    const noteFormModal = document.getElementById('note-form-modal');
    const noteFormModalContent = document.getElementById('note-form-modal-content');
    const closeNoteModalBtn = document.getElementById('close-note-modal-btn');
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

    installBtnEl = document.getElementById('install-btn');
    if (installBtnEl && deferredInstallPrompt) {
        showInstallButton();
    }
    if (installBtnEl) {
        installBtnEl.addEventListener('click', async () => {
            if (!deferredInstallPrompt) {
                return;
            }
            installBtnEl.disabled = true;
            installBtnEl.classList.add('opacity-60', 'cursor-not-allowed');
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            installBtnEl.disabled = false;
            installBtnEl.classList.remove('opacity-60', 'cursor-not-allowed');
            if (outcome === 'accepted') {
                hideInstallButton();
            }
        });
    }


    const SETTINGS_STORE = 'settings';
    const SESSIONS_STORE = 'sessions';
    const BIRTHDAY_KEY = 'birthday';
    const USER_NAME_KEY = 'userName';
    const WEBHOOK_URL_KEY = 'discordWebhookUrl';
    const THEME_KEY = 'theme';
    const DEFAULT_THEME = 'light';
    const THEME_OPTIONS = new Set(['light', 'dark', 'system']);
    const META_THEME_COLOR_LIGHT = '#2563eb';
    const META_THEME_COLOR_DARK = '#0f172a';

    // Clave IndexedDB para el API Secret de sincronización GitHub
    const API_SECRET_KEY = 'apiSecret';
    const LAST_SYNC_KEY = 'lastGitHubSync';

    let db;
    let noteIdToEdit = null;
    let noteIdToDelete = null;
    let draggedTag = null;
    let storageChart = null;
    let birthdayStatusTimeout = null;
    let userNameStatusTimeout = null;
    let webhookStatusTimeout = null;
    let currentThemePreference = DEFAULT_THEME;
    let pendingThemePreference = null;
    let historySearchTerm = '';
    let availableTags = [];
    let pendingTagSelection = new Set();
    let activeTagFilters = new Set();

    const sanitizeThemePreference = (value) => THEME_OPTIONS.has(value) ? value : DEFAULT_THEME;

    const resolveSystemTheme = () => (systemThemeMedia && systemThemeMedia.matches ? 'dark' : 'light');

    const updateThemeColorMeta = (effectiveTheme) => {
        if (!metaThemeColorEl) return;
        metaThemeColorEl.setAttribute('content', effectiveTheme === 'dark' ? META_THEME_COLOR_DARK : META_THEME_COLOR_LIGHT);
    };

    const applyTheme = (preference, options = {}) => {
        const { skipSelectUpdate = false, skipMetaUpdate = false } = options;
        const sanitizedPreference = sanitizeThemePreference(preference);
        const effectiveTheme = sanitizedPreference === 'system' ? resolveSystemTheme() : sanitizedPreference;
        if (document.body) {
            document.body.dataset.theme = effectiveTheme;
            document.body.dataset.themePreference = sanitizedPreference;
        }
        if (rootElement) {
            rootElement.style.colorScheme = effectiveTheme === 'dark' ? 'dark' : 'light';
        }
        if (!skipMetaUpdate) {
            updateThemeColorMeta(effectiveTheme);
        }
        if (themeSelect && !skipSelectUpdate) {
            themeSelect.value = sanitizedPreference;
        }
        return effectiveTheme;
    };

    const persistThemePreferenceToDb = (preference) => {
        if (!db) return;
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = tx.objectStore(SETTINGS_STORE);
        store.put({ key: THEME_KEY, value: preference });
        tx.onerror = () => {
            console.error('No se pudo guardar la preferencia de tema.', tx.error);
        };
    };

    if (historySearchInput) {
        historySearchInput.addEventListener('input', (event) => {
            historySearchTerm = event.target.value ?? '';
            renderHistory();
        });
    }

    if (tagFilterDropdown) {
        const isInitiallyOpen = tagFilterDropdown.dataset.open === 'true';
        tagFilterDropdown.classList.toggle('hidden', !isInitiallyOpen);
        tagFilterDropdown.style.display = isInitiallyOpen ? 'block' : 'none';
        if (tagFilterToggle) {
            tagFilterToggle.setAttribute('aria-expanded', isInitiallyOpen ? 'true' : 'false');
        }
    }

    if (tagFilterToggle) {
        tagFilterToggle.addEventListener('click', () => {
            toggleTagFilterDropdown();
        });
    }

    if (tagFilterApplyBtn) {
        tagFilterApplyBtn.addEventListener('click', () => {
            applyPendingTagSelection();
        });
    }

    if (tagFilterClearBtn) {
        tagFilterClearBtn.addEventListener('click', () => {
            clearTagFilters({ keepDropdownOpen: true });
        });
    }

    if (tagFilterDropdown) {
        document.addEventListener('click', (event) => {
            if (!tagFilterDropdown || !tagFilterToggle) return;
            if (tagFilterDropdown.dataset.open !== 'true') return;
            const clickTarget = event.target;
            if (!(tagFilterDropdown.contains(clickTarget) || tagFilterToggle.contains(clickTarget))) {
                toggleTagFilterDropdown(false);
            }
        });
    }

    if (historySearchClearBtn) {
        historySearchClearBtn.addEventListener('click', () => {
            if (historySearchTerm.trim().length === 0) return;
            historySearchTerm = '';
            if (historySearchInput) {
                historySearchInput.value = '';
                historySearchInput.focus();
            }
            renderHistory();
        });
    }

    const persistThemePreference = (preference) => {
        const sanitizedPreference = sanitizeThemePreference(preference);
        if (!isSettingsStoreReady()) {
            pendingThemePreference = sanitizedPreference;
            return;
        }
        persistThemePreferenceToDb(sanitizedPreference);
    };

    const flushPendingThemePreference = () => {
        if (!pendingThemePreference || !isSettingsStoreReady()) return;
        const preferenceToPersist = pendingThemePreference;
        pendingThemePreference = null;
        persistThemePreferenceToDb(preferenceToPersist);
    };

    const loadThemePreference = () => {
        if (!isSettingsStoreReady()) {
            applyTheme(currentThemePreference);
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        tx.objectStore(SETTINGS_STORE).get(THEME_KEY).onsuccess = (event) => {
            const storedValue = event.target.result?.value;
            currentThemePreference = sanitizeThemePreference(storedValue);
            applyTheme(currentThemePreference);
        };
        tx.onerror = () => {
            console.error('No se pudo cargar la preferencia de tema.', tx.error);
            applyTheme(currentThemePreference);
        };
    };

    applyTheme(currentThemePreference, { skipMetaUpdate: true });
    loadThemePreference();

    if (themeSelect) {
        themeSelect.addEventListener('change', (event) => {
            const newPreference = sanitizeThemePreference(event.target.value);
            currentThemePreference = newPreference;
            applyTheme(currentThemePreference, { skipSelectUpdate: true });
            persistThemePreference(currentThemePreference);
        });
    }

    const handleSystemThemeChange = () => {
        if (currentThemePreference === 'system') {
            applyTheme(currentThemePreference, { skipSelectUpdate: true });
        }
    };

    if (systemThemeMedia) {
        if (typeof systemThemeMedia.addEventListener === 'function') {
            systemThemeMedia.addEventListener('change', handleSystemThemeChange);
        } else if (typeof systemThemeMedia.addListener === 'function') {
            systemThemeMedia.addListener(handleSystemThemeChange);
        }
    }

    const request = indexedDB.open('NotesDB', 7);
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
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
            db.createObjectStore(SESSIONS_STORE, { keyPath: 'id', autoIncrement: true });
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
    request.onblocked = () => {
        console.warn('Actualiza las demás pestañas de la aplicación para completar la actualización de la base de datos.');
    };

    const formatDuration = (ms) => {
        if (!Number.isFinite(ms) || ms <= 0) return '--';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
        if (minutes > 0) {
            return `${minutes} min`;
        }
        return `${seconds} s`;
    };

    const updateSessionMetrics = () => {
        const totalSessionTimeEl = document.getElementById('total-session-time');
        const averageSessionTimeEl = document.getElementById('average-session-time');

        if (!totalSessionTimeEl && !averageSessionTimeEl) return;
        if (!db) return;

        const hasSessionsStore = db.objectStoreNames.contains(SESSIONS_STORE);
        if (!hasSessionsStore) {
            if (totalSessionTimeEl) totalSessionTimeEl.textContent = '--';
            if (averageSessionTimeEl) averageSessionTimeEl.textContent = '--';
            return;
        }

        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const request = store.getAll();

        request.onsuccess = (e) => {
            const sessions = e.target.result || [];
            const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
            const averageDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

            if (totalSessionTimeEl) totalSessionTimeEl.textContent = formatDuration(totalDuration);
            if (averageSessionTimeEl) averageSessionTimeEl.textContent = formatDuration(averageDuration);
        };
    };

    function finalizeDatabaseInitialization() {
        flushPendingThemePreference();
        loadThemePreference();
        updateSessionMetrics();
        if (typeof populateMultiSelectDropdown === 'function') {
            populateMultiSelectDropdown();
        }
        renderTags();
        refreshActiveView();
        checkCloudSync();
    }

    function ensureSettingsStore() {
        if (!db) {
            return Promise.reject(new Error('Base de datos no disponible.'));
        }
        if (db.objectStoreNames.contains(SETTINGS_STORE)) {
            return Promise.resolve();
        }
        const nextVersion = db.version + 1;
        db.close();
        return new Promise((resolve, reject) => {
            const upgradeRequest = indexedDB.open('NotesDB', nextVersion);
            upgradeRequest.onerror = () => reject(upgradeRequest.error);
            upgradeRequest.onblocked = () => reject(new Error('No se pudo actualizar la base de datos porque existe otra pestaña abierta.'));
            upgradeRequest.onupgradeneeded = (event) => {
                const upgradeDb = event.target.result;
                if (!upgradeDb.objectStoreNames.contains(SETTINGS_STORE)) {
                    upgradeDb.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }
            };
            upgradeRequest.onsuccess = (event) => {
                db = event.target.result;
                db.onversionchange = () => db?.close();
                resolve();
            };
        });
    }

    request.onsuccess = (e) => {
        db = e.target.result;
        db.onversionchange = () => db?.close();
        ensureSettingsStore()
            .catch(error => {
                console.error('No se pudo preparar el almacén de ajustes:', error);
            })
            .finally(() => {
                finalizeDatabaseInitialization();
            });
    };

    const refreshActiveView = () => {
        switch (pageType) {
            case 'notes':
                renderNotes();
                loadUserNameGreeting();
                loadBirthdayGreeting();
                break;
            case 'history':
                renderHistory();
                break;
            case 'settings':
                updateStorageInfo();
                renderTags();
                loadBirthday();
                loadUserName();
                loadWebhookUrl();
                loadUserNameGreeting();
                loadApiSecretStatus();
                loadLastSyncDisplay();
                break;
            default:
                renderNotes();
                loadUserNameGreeting();
                loadBirthdayGreeting();
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

    const requestToPromise = (request) => new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const transactionToPromise = (transaction) => new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transacción abortada.'));
    });

    const getDaysInMonth = (month) => {
        if (!month) return 31;
        const referenceYear = 2024; // Año bisiesto para admitir el 29 de febrero
        return new Date(referenceYear, month, 0).getDate();
    };

    const isValidBirthday = (month, day) => {
        if (!month || !day) return false;
        const limit = getDaysInMonth(month);
        return day >= 1 && day <= limit;
    };

    const showBirthdayStatus = (message, type = 'info') => {
        if (!birthdayStatusEl) return;
        birthdayStatusEl.textContent = message;
        birthdayStatusEl.classList.remove('text-green-600', 'text-red-600');
        if (type === 'success') {
            birthdayStatusEl.classList.add('text-green-600');
        } else if (type === 'error') {
            birthdayStatusEl.classList.add('text-red-600');
        }
        if (birthdayStatusTimeout) {
            clearTimeout(birthdayStatusTimeout);
        }
        birthdayStatusTimeout = setTimeout(() => {
            if (birthdayStatusEl) {
                birthdayStatusEl.textContent = '';
                birthdayStatusEl.classList.remove('text-green-600', 'text-red-600');
            }
        }, 4000);
    };

    const hideBirthdayBanner = () => {
        if (!birthdayBannerEl) return;
        birthdayBannerEl.classList.add('hidden');
        birthdayBannerEl.setAttribute('aria-hidden', 'true');
    };

    const showBirthdayBanner = ({ heading, message }) => {
        if (!birthdayBannerEl) return;
        if (birthdayMessageHeadingEl && typeof heading === 'string') {
            birthdayMessageHeadingEl.textContent = heading;
        }
        if (birthdayMessageTextEl && typeof message === 'string') {
            birthdayMessageTextEl.textContent = message;
        }
        birthdayBannerEl.classList.remove('hidden');
        birthdayBannerEl.setAttribute('aria-hidden', 'false');
    };

    const formatBirthdayHeading = (name) => {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        return trimmedName ? `¡Feliz cumpleaños, ${trimmedName}!` : '¡Feliz cumpleaños!';
    };

    const formatBirthdayMessage = (name) => {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        return trimmedName
            ? `Que hoy sea un día lleno de inspiración y alegría, ${trimmedName}.`
            : 'Que hoy sea un día lleno de inspiración y alegría.';
    };

    const isTodayBirthday = (month, day, referenceDate = new Date()) => {
        if (!month || !day || Number.isNaN(month) || Number.isNaN(day)) return false;
        return referenceDate.getMonth() + 1 === month && referenceDate.getDate() === day;
    };

    const fetchSettingsEntry = async (key) => {
        if (!isSettingsStoreReady()) return undefined;
        try {
            const tx = db.transaction(SETTINGS_STORE, 'readonly');
            const request = tx.objectStore(SETTINGS_STORE).get(key);
            return await requestToPromise(request);
        } catch (error) {
            console.error(`No se pudo obtener el valor '${key}' del almacén de ajustes.`, error);
            return undefined;
        }
    };

    const loadBirthdayGreeting = async () => {
        if (!birthdayBannerEl) return;
        hideBirthdayBanner();
        if (!isSettingsStoreReady()) return;

        try {
            const [birthdayData, userNameData] = await Promise.all([
                fetchSettingsEntry(BIRTHDAY_KEY),
                fetchSettingsEntry(USER_NAME_KEY)
            ]);

            const month = typeof birthdayData?.month === 'number' ? birthdayData.month : undefined;
            const day = typeof birthdayData?.day === 'number' ? birthdayData.day : undefined;

            if (!isTodayBirthday(month, day)) {
                return;
            }

            const userName = typeof userNameData?.value === 'string' ? userNameData.value : undefined;

            showBirthdayBanner({
                heading: formatBirthdayHeading(userName),
                message: formatBirthdayMessage(userName)
            });
        } catch (error) {
            console.error('No se pudo cargar el mensaje de cumpleaños.', error);
        }
    };

    const showUserNameStatus = (message, type = 'info') => {
        if (!userNameStatusEl) return;
        userNameStatusEl.textContent = message;
        userNameStatusEl.classList.remove('text-green-600', 'text-red-600');
        if (type === 'success') {
            userNameStatusEl.classList.add('text-green-600');
        } else if (type === 'error') {
            userNameStatusEl.classList.add('text-red-600');
        }
        if (userNameStatusTimeout) {
            clearTimeout(userNameStatusTimeout);
        }
        userNameStatusTimeout = setTimeout(() => {
            if (userNameStatusEl) {
                userNameStatusEl.textContent = '';
                userNameStatusEl.classList.remove('text-green-600', 'text-red-600');
            }
        }, 4000);
    };

    const applyBirthdayLimits = () => {
        if (!birthdayDayInput || !birthdayMonthSelect) return;
        const month = Number(birthdayMonthSelect.value);
        const maxDay = getDaysInMonth(month);
        birthdayDayInput.max = maxDay;
        if (birthdayDayInput.value) {
            const currentDay = Number(birthdayDayInput.value);
            if (currentDay > maxDay) {
                birthdayDayInput.value = String(maxDay);
            }
        }
    };

    const loadBirthday = () => {
        if (!db || !birthdayMonthSelect || !birthdayDayInput) return;
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) return;
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        tx.objectStore(SETTINGS_STORE).get(BIRTHDAY_KEY).onsuccess = (event) => {
            const data = event.target.result;
            if (data && typeof data.month === 'number' && typeof data.day === 'number') {
                birthdayMonthSelect.value = String(data.month);
                birthdayDayInput.value = String(data.day);
                applyBirthdayLimits();
                showBirthdayStatus('Cumpleaños cargado correctamente.', 'success');
            } else {
                birthdayMonthSelect.value = '';
                birthdayDayInput.value = '';
                applyBirthdayLimits();
            }
        };
    };

    const saveBirthday = () => {
        if (!db || !birthdayMonthSelect || !birthdayDayInput) {
            showBirthdayStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            showBirthdayStatus('El almacén de ajustes no está disponible.', 'error');
            return;
        }
        const month = Number(birthdayMonthSelect.value);
        const day = Number(birthdayDayInput.value);
        if (!month || !day) {
            showBirthdayStatus('Completa el mes y el día.', 'error');
            return;
        }
        if (!isValidBirthday(month, day)) {
            showBirthdayStatus('El día no corresponde con el mes seleccionado.', 'error');
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        tx.objectStore(SETTINGS_STORE).put({ key: BIRTHDAY_KEY, month, day });
        tx.oncomplete = () => {
            showBirthdayStatus('Cumpleaños guardado correctamente.', 'success');
        };
        tx.onerror = () => {
            showBirthdayStatus('No se pudo guardar el cumpleaños.', 'error');
        };
    };

    const clearBirthday = () => {
        if (!db || !birthdayMonthSelect || !birthdayDayInput) {
            showBirthdayStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            showBirthdayStatus('El almacén de ajustes no está disponible.', 'error');
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        tx.objectStore(SETTINGS_STORE).delete(BIRTHDAY_KEY);
        tx.oncomplete = () => {
            birthdayMonthSelect.value = '';
            birthdayDayInput.value = '';
            applyBirthdayLimits();
            showBirthdayStatus('Cumpleaños eliminado.', 'success');
        };
        tx.onerror = () => {
            showBirthdayStatus('No se pudo eliminar el cumpleaños.', 'error');
        };
    };

    const loadUserName = () => {
        if (!db || !userNameInput) return;
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) return;
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        tx.objectStore(SETTINGS_STORE).get(USER_NAME_KEY).onsuccess = (event) => {
            const storedValue = event.target.result?.value;
            if (typeof storedValue === 'string') {
                userNameInput.value = storedValue;
                showUserNameStatus('Nombre cargado correctamente.', 'success');
            } else {
                userNameInput.value = '';
            }
        };
    };

    const loadUserNameGreeting = () => {
        if (!db) {
            updateUserGreeting();
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            updateUserGreeting();
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        tx.objectStore(SETTINGS_STORE).get(USER_NAME_KEY).onsuccess = (event) => {
            updateUserGreeting(event.target.result?.value);
        };
        tx.onerror = () => {
            updateUserGreeting();
        };
    };

    const saveUserName = () => {
        if (!db || !userNameInput) {
            showUserNameStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            showUserNameStatus('El almacén de ajustes no está disponible.', 'error');
            return;
        }
        const name = userNameInput.value.trim();
        if (!name) {
            showUserNameStatus('Escribe un nombre antes de guardarlo.', 'error');
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        tx.objectStore(SETTINGS_STORE).put({ key: USER_NAME_KEY, value: name });
        tx.oncomplete = () => {
            showUserNameStatus('Nombre guardado correctamente.', 'success');
            loadUserNameGreeting();
        };
        tx.onerror = () => {
            showUserNameStatus('No se pudo guardar el nombre.', 'error');
        };
    };

    const clearUserName = () => {
        if (!db || !userNameInput) {
            showUserNameStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            showUserNameStatus('El almacén de ajustes no está disponible.', 'error');
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        tx.objectStore(SETTINGS_STORE).delete(USER_NAME_KEY);
        tx.oncomplete = () => {
            userNameInput.value = '';
            showUserNameStatus('Nombre eliminado.', 'success');
            loadUserNameGreeting();
        };
        tx.onerror = () => {
            showUserNameStatus('No se pudo eliminar el nombre.', 'error');
        };
    };

    const showWebhookStatus = (message, type = 'info') => {
        if (!webhookStatusEl) return;
        webhookStatusEl.textContent = message;
        webhookStatusEl.classList.remove('text-green-600', 'text-red-600');
        if (type === 'success') {
            webhookStatusEl.classList.add('text-green-600');
        } else if (type === 'error') {
            webhookStatusEl.classList.add('text-red-600');
        }
        if (webhookStatusTimeout) {
            clearTimeout(webhookStatusTimeout);
        }
        webhookStatusTimeout = setTimeout(() => {
            if (webhookStatusEl) {
                webhookStatusEl.textContent = '';
                webhookStatusEl.classList.remove('text-green-600', 'text-red-600');
            }
        }, 4000);
    };

    const loadWebhookUrl = () => {
        if (!db || !discordWebhookInput) return;
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) return;
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        tx.objectStore(SETTINGS_STORE).get(WEBHOOK_URL_KEY).onsuccess = (event) => {
            const storedValue = event.target.result?.value;
            if (typeof storedValue === 'string') {
                discordWebhookInput.value = storedValue;
                showWebhookStatus('Webhook cargado correctamente.', 'success');
            } else {
                discordWebhookInput.value = '';
            }
        };
    };

    const saveWebhookUrl = () => {
        if (!db || !discordWebhookInput) {
            showWebhookStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            showWebhookStatus('El almacén de ajustes no está disponible.', 'error');
            return;
        }
        const url = discordWebhookInput.value.trim();
        if (!url) {
            showWebhookStatus('Escribe una URL antes de guardarla.', 'error');
            return;
        }
        if (!url.startsWith('https://discord.com/api/webhooks/')) {
            showWebhookStatus('La URL no parece ser un Webhook de Discord válido.', 'error');
            return;
        }

        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        tx.objectStore(SETTINGS_STORE).put({ key: WEBHOOK_URL_KEY, value: url });
        tx.oncomplete = () => {
            showWebhookStatus('Webhook guardado correctamente.', 'success');
        };
        tx.onerror = () => {
            showWebhookStatus('No se pudo guardar el Webhook.', 'error');
        };
    };

    const clearWebhookUrl = () => {
        if (!db || !discordWebhookInput) {
            showWebhookStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            showWebhookStatus('El almacén de ajustes no está disponible.', 'error');
            return;
        }
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        tx.objectStore(SETTINGS_STORE).delete(WEBHOOK_URL_KEY);
        tx.oncomplete = () => {
            discordWebhookInput.value = '';
            showWebhookStatus('Webhook eliminado.', 'success');
        };
        tx.onerror = () => {
            showWebhookStatus('No se pudo eliminar el Webhook.', 'error');
        };
    };

    // --- Sincronización con GitHub ---

    const showSyncStatus = (message, type = 'info') => {
        const el = document.getElementById('sync-status');
        if (!el) return;
        el.textContent = message;
        el.classList.remove('hidden', 'text-blue-600', 'text-green-600', 'text-red-600');
        if (type === 'success') el.classList.add('text-green-600');
        else if (type === 'error') el.classList.add('text-red-600');
        else el.classList.add('text-blue-600');
        setTimeout(() => el.classList.add('hidden'), 5000);
    };

    /** Lee el API Secret desde IndexedDB */
    const getApiSecret = () => new Promise((resolve) => {
        if (!db || !db.objectStoreNames.contains(SETTINGS_STORE)) return resolve(null);
        const req = db.transaction(SETTINGS_STORE, 'readonly')
            .objectStore(SETTINGS_STORE).get(API_SECRET_KEY);
        req.onsuccess = (e) => resolve(e.target.result?.value ?? null);
        req.onerror = () => resolve(null);
    });

    /** Reúne todos los datos locales listos para respaldar */
    const gatherLocalData = () => new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Base de datos no disponible'));
        const storeNames = ['notes', 'tags', SETTINGS_STORE];
        if (db.objectStoreNames.contains(SESSIONS_STORE)) storeNames.push(SESSIONS_STORE);
        const tx = db.transaction(storeNames, 'readonly');

        const reads = [
            new Promise(res => { tx.objectStore('notes').getAll().onsuccess = e => res(e.target.result || []); }),
            new Promise(res => { tx.objectStore('tags').getAll().onsuccess = e => res(e.target.result || []); }),
            new Promise(res => {
                tx.objectStore(SETTINGS_STORE).getAll().onsuccess = e => {
                    const settings = (e.target.result || []).reduce((acc, item) => {
                        if (item.key === API_SECRET_KEY) return acc; // nunca respaldar el secreto
                        if (item.value !== undefined) {
                            // Registro estándar: { key, value }
                            acc[item.key] = { __type: 'value', v: item.value };
                        } else {
                            // Registro con estructura especial (ej: birthday { key, month, day })
                            const { key, ...rest } = item;
                            acc[key] = { __type: 'raw', ...rest };
                        }
                        return acc;
                    }, {});
                    res(settings);
                };
            }),
            db.objectStoreNames.contains(SESSIONS_STORE)
                ? new Promise(res => { tx.objectStore(SESSIONS_STORE).getAll().onsuccess = e => res(e.target.result || []); })
                : Promise.resolve([])
        ];

        Promise.all(reads)
            .then(([notes, tags, settings, sessions]) => resolve({ notes, tags, settings, sessions }))
            .catch(reject);
    });

    /** Escribe datos restaurados en IndexedDB (reemplaza todo excepto el API Secret) */
    const writeRestoredData = (data) => new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Base de datos no disponible'));
        const { notes = [], tags = [], settings = {}, sessions = [] } = data;
        const storeNames = ['notes', 'tags', SETTINGS_STORE];
        if (db.objectStoreNames.contains(SESSIONS_STORE)) storeNames.push(SESSIONS_STORE);

        const tx = db.transaction(storeNames, 'readwrite');
        storeNames.forEach(name => tx.objectStore(name).clear());
        notes.forEach(n => tx.objectStore('notes').put(n));
        tags.forEach(t => tx.objectStore('tags').put(t));
        Object.entries(settings).forEach(([key, meta]) => {
            if (!meta || typeof meta !== 'object') {
                // Compatibilidad con respaldos antiguos sin __type
                tx.objectStore(SETTINGS_STORE).put({ key, value: meta });
            } else if (meta.__type === 'raw') {
                const { __type, ...rest } = meta;
                tx.objectStore(SETTINGS_STORE).put({ key, ...rest });
            } else {
                // __type === 'value' (formato estándar)
                tx.objectStore(SETTINGS_STORE).put({ key, value: meta.v });
            }
        });
        if (db.objectStoreNames.contains(SESSIONS_STORE)) {
            sessions.forEach(s => {
                const { id: _id, ...rest } = s;
                tx.objectStore(SESSIONS_STORE).add(rest);
            });
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    /** Guarda el timestamp del último respaldo exitoso en IndexedDB */
    const saveLastSyncTimestamp = (timestamp) => {
        if (!db || !db.objectStoreNames.contains(SETTINGS_STORE)) return;
        db.transaction(SETTINGS_STORE, 'readwrite')
            .objectStore(SETTINGS_STORE)
            .put({ key: LAST_SYNC_KEY, value: timestamp });
    };

    /** Actualiza el elemento de UI con el timestamp del último respaldo */
    const updateLastSyncDisplay = (timestamp) => {
        const el = document.getElementById('last-sync-display');
        if (!el || !timestamp) return;
        el.textContent = 'Último respaldo: ' + new Date(timestamp).toLocaleString('es-ES');
    };

    /** Carga y muestra el último timestamp de respaldo desde IndexedDB */
    const loadLastSyncDisplay = () => {
        if (!db || !db.objectStoreNames.contains(SETTINGS_STORE)) return;
        db.transaction(SETTINGS_STORE, 'readonly')
            .objectStore(SETTINGS_STORE).get(LAST_SYNC_KEY).onsuccess = (e) => {
                updateLastSyncDisplay(e.target.result?.value ?? null);
            };
    };

    // --- Indicador visual de respaldo ---
    let _syncIndicatorTimer = null;
    const showSyncIndicator = (state) => {
        const el = document.getElementById('sync-nav-indicator');
        if (!el) return;
        const icon = document.getElementById('sync-indicator-icon');
        const label = document.getElementById('sync-indicator-label');
        const checkPath = el.querySelector('.sync-check-path');
        clearTimeout(_syncIndicatorTimer);
        if (state === 'saving') {
            if (icon) { icon.classList.add('sync-spin'); if (checkPath) checkPath.style.display = 'none'; }
            if (label) label.textContent = 'Guardando…';
            el.classList.remove('sync-indicator--visible');
            el.classList.add('sync-indicator--visible');
        } else if (state === 'saved') {
            if (icon) { icon.classList.remove('sync-spin'); if (checkPath) checkPath.style.display = 'inline'; }
            if (label) label.textContent = 'Guardado';
            // Ocultar automáticamente tras 2.5 s
            _syncIndicatorTimer = setTimeout(() => {
                el.classList.remove('sync-indicator--visible');
            }, 2500);
        }
    };

    /** Respaldo automático silencioso tras guardar o borrar una nota.
     *  Con debounce de 4 s para evitar backups concurrentes que causen
     *  conflictos de SHA en la GitHub Contents API. */
    let _autoBackupTimer = null;
    const triggerAutoBackup = () => {
        clearTimeout(_autoBackupTimer);
        _autoBackupTimer = setTimeout(async () => {
            if (!window.GitHubSync) return;
            const apiSecret = await getApiSecret();
            if (!apiSecret) return;
            showSyncIndicator('saving');
            try {
                const data = await gatherLocalData();
                const result = await window.GitHubSync.backup(data, apiSecret);
                saveLastSyncTimestamp(result.timestamp);
                updateLastSyncDisplay(result.timestamp);
                showSyncIndicator('saved');
            } catch (error) {
                console.warn('Auto-backup fallido (se reintentará en la próxima operación):', error.message);
                // Ocultar silenciosamente sin alarmar al usuario
                const el = document.getElementById('sync-nav-indicator');
                if (el) el.classList.remove('sync-indicator--visible');
            }
        }, 4000); // espera 4 s desde la última operación antes de respaldar
    };

    /** Respaldo manual iniciado desde el botón en Ajustes */
    const handleManualBackup = async () => {
        if (!window.GitHubSync) return;
        const apiSecret = await getApiSecret();
        if (!apiSecret) {
            showSyncStatus('Configura el API Secret primero.', 'error');
            return;
        }
        showSyncStatus('Haciendo respaldo...', 'info');
        try {
            const data = await gatherLocalData();
            const result = await window.GitHubSync.backup(data, apiSecret);
            saveLastSyncTimestamp(result.timestamp);
            updateLastSyncDisplay(result.timestamp);
            showSyncStatus('Respaldo completado correctamente.', 'success');
        } catch (error) {
            showSyncStatus('Error en respaldo: ' + error.message, 'error');
        }
    };

    /** Restauración completa desde el respaldo en GitHub */
    const handleRestore = async () => {
        if (!window.GitHubSync) return;
        const apiSecret = await getApiSecret();
        if (!apiSecret) {
            showSyncStatus('Configura el API Secret primero.', 'error');
            return;
        }
        showSyncStatus('Restaurando datos desde la nube...', 'info');
        try {
            const data = await window.GitHubSync.restore(apiSecret);
            await writeRestoredData(data);
            const ts = data.backedUpAt || new Date().toISOString();
            saveLastSyncTimestamp(ts);
            updateLastSyncDisplay(ts);
            showSyncStatus('Datos restaurados correctamente.', 'success');
            refreshActiveView();
            renderTags();
            populateMultiSelectDropdown();
            updateStorageInfo();
            loadThemePreference();
        } catch (error) {
            showSyncStatus('Error en restauración: ' + error.message, 'error');
        }
    };

    // ─── Detección de sincronización entre dispositivos ───────────────────────────

    /**
     * Crea y muestra un modal no cerrable cuando la nube tiene datos más recientes.
     * El usuario debe elegir entre mantener sus datos locales o restaurar desde la nube.
     */
    const showSyncDetectedModal = (cloudTimestamp, localTimestamp) => {
        if (document.getElementById('sync-detected-overlay')) return;
        const fmtDate = ts => ts ? new Date(ts).toLocaleString('es-ES') : 'Sin datos locales';

        const overlay = document.createElement('div');
        overlay.id = 'sync-detected-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
        overlay.innerHTML = `
            <div class="sync-modal-card" style="background:#ffffff;border-radius:1rem;padding:1.5rem;max-width:22rem;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
                <div style="text-align:center;font-size:2rem;margin-bottom:0.75rem;">☁️</div>
                <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:0.5rem;text-align:center;color:#1e293b;">Datos más recientes en la nube</h3>
                <p style="font-size:0.85rem;color:#475569;margin-bottom:1rem;text-align:center;">Hay una versión más reciente de tus datos guardada desde otro dispositivo.</p>
                <div class="sync-modal-timestamps" style="background:#f1f5f9;border-radius:0.5rem;padding:0.75rem;font-size:0.8rem;color:#64748b;margin-bottom:1.25rem;">
                    <div>☁️&nbsp;<strong>Nube:</strong>&nbsp;${fmtDate(cloudTimestamp)}</div>
                    <div style="margin-top:0.25rem;">📱&nbsp;<strong>Local:</strong>&nbsp;${fmtDate(localTimestamp)}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button id="sync-restore-cloud" style="background:#2563eb;color:#ffffff;border:none;border-radius:0.5rem;padding:0.7rem;font-size:0.875rem;font-weight:600;cursor:pointer;">
                        Actualizar desde la nube
                    </button>
                    <button id="sync-keep-local" style="background:#f1f5f9;color:#475569;border:none;border-radius:0.5rem;padding:0.7rem;font-size:0.875rem;font-weight:600;cursor:pointer;">
                        Continuar con mis datos actuales
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        overlay.querySelector('#sync-keep-local').addEventListener('click', () => {
            // Guardar el timestamp de la nube como local para no volver a preguntar
            saveLastSyncTimestamp(cloudTimestamp);
            updateLastSyncDisplay(cloudTimestamp);
            overlay.remove();
        });

        overlay.querySelector('#sync-restore-cloud').addEventListener('click', async () => {
            const restoreBtn = overlay.querySelector('#sync-restore-cloud');
            const keepBtn = overlay.querySelector('#sync-keep-local');
            restoreBtn.disabled = true;
            keepBtn.disabled = true;
            restoreBtn.textContent = 'Restaurando…';
            await handleRestore();
            overlay.remove();
        });
    };

    /**
     * Compara el timestamp del respaldo en la nube con el local.
     * Si la nube es más reciente (o el local no tiene historial), muestra el modal.
     */
    const checkCloudSync = async () => {
        if (pageType === 'chat') return;
        if (!window.GitHubSync) return;
        const apiSecret = await getApiSecret();
        if (!apiSecret) return;
        try {
            const response = await fetch('/api/backup?meta=1', {
                headers: { 'Authorization': `Bearer ${apiSecret}` }
            });
            if (!response.ok) return;
            const { backedUpAt } = await response.json();
            if (!backedUpAt) return;

            const localTs = await new Promise(resolve => {
                if (!db || !db.objectStoreNames.contains(SETTINGS_STORE)) return resolve(null);
                const req = db.transaction(SETTINGS_STORE, 'readonly')
                    .objectStore(SETTINGS_STORE).get(LAST_SYNC_KEY);
                req.onsuccess = e => resolve(e.target.result?.value ?? null);
                req.onerror = () => resolve(null);
            });

            // La nube es más reciente si: no hay timestamp local, o el de la nube es mayor
            if (localTs && backedUpAt <= localTs) return;

            showSyncDetectedModal(backedUpAt, localTs);
        } catch (e) {
            console.warn('[checkCloudSync]', e.message);
        }
    };

    /** Guarda el API Secret introducido por el usuario en IndexedDB */
    const handleSaveApiSecret = () => {
        const input = document.getElementById('api-secret-input');
        if (!input || !db) return;
        const value = input.value.trim();
        if (!value) {
            showSyncStatus('El API Secret no puede estar vacío.', 'error');
            return;
        }
        db.transaction(SETTINGS_STORE, 'readwrite')
            .objectStore(SETTINGS_STORE).put({ key: API_SECRET_KEY, value });
        input.value = '';
        input.placeholder = '••••••••  (secreto guardado)';
        showSyncStatus('API Secret guardado correctamente.', 'success');
    };

    /** Muestra en el input si ya hay un secreto guardado */
    const loadApiSecretStatus = () => {
        const input = document.getElementById('api-secret-input');
        if (!input || !db || !db.objectStoreNames.contains(SETTINGS_STORE)) return;
        getApiSecret().then(secret => {
            if (secret) input.placeholder = '••••••••  (secreto guardado)';
        });
    };








    function isSettingsStoreReady() {
        return Boolean(db && db.objectStoreNames.contains(SETTINGS_STORE));
    }

    const showStorageChartMessage = (message) => {
        if (!storageChartMessageEl) return;
        storageChartMessageEl.textContent = message;
        storageChartMessageEl.classList.remove('hidden');
    };

    const hideStorageChartMessage = () => {
        if (!storageChartMessageEl) return;
        storageChartMessageEl.classList.add('hidden');
    };

    const destroyStorageChart = () => {
        if (storageChart) {
            storageChart.destroy();
            storageChart = null;
        }
    };

    const calculateIndexedDbUsage = async () => {
        if (!db) return null;
        try {
            const [notes, tags] = await Promise.all([
                requestToPromise(db.transaction('notes', 'readonly').objectStore('notes').getAll()),
                requestToPromise(db.transaction('tags', 'readonly').objectStore('tags').getAll())
            ]);
            const notesBlob = new Blob([JSON.stringify(notes || [])]);
            const tagsBlob = new Blob([JSON.stringify(tags || [])]);
            return notesBlob.size + tagsBlob.size;
        } catch (error) {
            console.error('Error calculando uso de IndexedDB:', error);
            return null;
        }
    };

    const calculateLocalStorageUsage = () => {
        if (typeof localStorage === 'undefined') return null;
        try {
            const entries = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                entries.push(key ?? '');
                entries.push(value ?? '');
            }
            return new Blob(entries).size;
        } catch (error) {
            console.error('Error calculando uso de LocalStorage:', error);
            return null;
        }
    };

    const updateStorageChart = ({ quota, usage, indexedDbUsage, localStorageUsage }) => {
        if (!storageChartCanvas || typeof Chart === 'undefined') {
            showStorageChartMessage('No se pudo cargar el gráfico de almacenamiento.');
            destroyStorageChart();
            return;
        }

        const hasQuota = typeof quota === 'number' && quota > 0;
        const hasUsage = typeof usage === 'number' && usage >= 0;

        if (!hasQuota || !hasUsage) {
            destroyStorageChart();
            showStorageChartMessage('El navegador no proporcionó información suficiente para generar el gráfico.');
            return;
        }

        const indexedUsage = Math.max(indexedDbUsage ?? 0, 0);
        const localUsage = Math.max(localStorageUsage ?? 0, 0);
        const otherUsage = Math.max(usage - (indexedUsage + localUsage), 0);
        const available = Math.max(quota - usage, 0);
        const totalUsage = indexedUsage + localUsage + otherUsage;
        const totalCapacity = (typeof quota === 'number' && quota > 0)
            ? quota
            : totalUsage + available;

        const total = totalUsage + available;

        if (total <= 0) {
            destroyStorageChart();
            showStorageChartMessage('Aún no hay datos almacenados que mostrar.');
            return;
        }

        const data = [indexedUsage, localUsage, otherUsage, available];
        const labels = ['IndexedDB', 'LocalStorage', 'Otros datos', 'Disponible'];
        const backgroundColors = ['#2563eb', '#16a34a', '#fb923c', 'rgba(148, 163, 184, 0.35)'];

        if (!storageChart) {
            storageChart = new Chart(storageChartCanvas, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: backgroundColors,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        hoverOffset: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#0f172a',
                                usePointStyle: true,
                                boxWidth: 10,
                                filter: (item) => item.text !== 'Disponible'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const value = context.raw;
                                    const denominator = totalCapacity > 0 ? totalCapacity : total;
                                    const percentage = denominator > 0 ? ((value / denominator) * 100).toFixed(1) : 0;
                                    return `${context.label}: ${formatBytes(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            storageChart.data.labels = labels;
            storageChart.data.datasets[0].data = data;
            storageChart.data.datasets[0].backgroundColor = backgroundColors;
            storageChart.update();
        }

        if (storageChartMessageEl) {
            const denominator = totalCapacity > 0 ? totalCapacity : total;
            const availablePercent = denominator > 0 ? (available / denominator) * 100 : 0;
            const usedPercent = denominator > 0 ? (totalUsage / denominator) * 100 : 0;
            storageChartMessageEl.textContent = `Uso total: ${formatBytes(totalUsage)} (${usedPercent.toFixed(1)}%) · Disponible: ${formatBytes(available)} (${availablePercent.toFixed(1)}%)`;
            storageChartMessageEl.classList.remove('hidden');
        }
    };

    const updateStorageInfo = async () => {
        let quotaEstimate = null;
        let usageEstimate = null;
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const { usage = 0, quota = 0 } = await navigator.storage.estimate();
                usageEstimate = usage;
                quotaEstimate = quota;
                if (storageUsageEl) storageUsageEl.textContent = formatBytes(usage);
                if (storageQuotaEl) storageQuotaEl.textContent = formatBytes(quota);
            } catch (error) {
                console.error('Error obteniendo estimación de almacenamiento:', error);
                if (storageUsageEl) storageUsageEl.textContent = 'Error';
                if (storageQuotaEl) storageQuotaEl.textContent = 'Error';
            }
        } else {
            if (storageUsageEl) storageUsageEl.textContent = 'No Soportado';
            if (storageQuotaEl) storageQuotaEl.textContent = 'No Soportado';
        }

        const [indexedDbUsage, localStorageUsage] = await Promise.all([
            calculateIndexedDbUsage(),
            Promise.resolve(calculateLocalStorageUsage())
        ]);

        if (indexedDbUsageEl) {
            indexedDbUsageEl.textContent = typeof indexedDbUsage === 'number' ? formatBytes(indexedDbUsage) : 'No Disponible';
        }
        if (localStorageUsageEl) {
            localStorageUsageEl.textContent = typeof localStorageUsage === 'number' ? formatBytes(localStorageUsage) : 'No Disponible';
        }

        updateStorageChart({
            quota: quotaEstimate,
            usage: usageEstimate,
            indexedDbUsage,
            localStorageUsage
        });

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

    const getGreetingPeriod = (date = new Date()) => {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 19) return 'afternoon';
        return 'night';
    };

    const getTimeGreeting = (date = new Date()) => {
        const period = getGreetingPeriod(date);
        if (period === 'morning') return 'Buenos días';
        if (period === 'afternoon') return 'Buenas tardes';
        return 'Buenas noches';
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

    const updateUserGreeting = (userName) => {
        const greetingEl = document.getElementById('user-greeting');
        if (!greetingEl) return;
        const safeName = typeof userName === 'string' && userName.trim() ? userName.trim() : 'Usuario';
        const now = new Date();
        greetingEl.textContent = `${getTimeGreeting(now)}, ${safeName}`;
        greetingEl.classList.remove('greeting-gradient', 'greeting-morning', 'greeting-afternoon', 'greeting-night');
        greetingEl.classList.add('greeting-gradient', `greeting-${getGreetingPeriod(now)}`);
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
            tagStore.add({ name: tagName, color: tagColor, order: newOrder, updatedAt: new Date().toISOString() }).onsuccess = () => {
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
            tagStore.add({ name: newName, color: newColor, order: oldTag.order, updatedAt: new Date().toISOString() });

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

    const getStartOfWeek = (referenceDate = new Date()) => {
        const start = new Date(referenceDate);
        start.setHours(0, 0, 0, 0);
        const diff = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - diff);
        return start;
    };

    const getEndOfWeek = (startOfWeek) => {
        const end = new Date(startOfWeek);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return end;
    };

    const formatWeekRangeLabel = (startOfWeek, endOfWeek) => {
        const startOptions = { day: '2-digit', month: 'short' };
        const endOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        if (startOfWeek.getFullYear() !== endOfWeek.getFullYear()) {
            startOptions.year = 'numeric';
        }
        const startLabel = startOfWeek.toLocaleDateString('es-ES', startOptions).replace(/\./g, '');
        const endLabel = endOfWeek.toLocaleDateString('es-ES', endOptions).replace(/\./g, '');
        return `${startLabel} – ${endLabel}`;
    };

    const updateWeeklyOverview = (notes = []) => {
        if (!weeklyActivityDaysContainer || weeklyDayElements.length === 0) return;
        const weekStart = getStartOfWeek();
        const weekEnd = getEndOfWeek(weekStart);

        const weeklyData = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            date.setHours(0, 0, 0, 0);
            return { index, date, notesCount: 0 };
        });

        notes.forEach((note) => {
            if (!note || typeof note.id === 'undefined') return;
            const noteDate = new Date(note.id);
            if (Number.isNaN(noteDate.getTime())) return;
            if (noteDate < weekStart || noteDate > weekEnd) return;
            const dayIndex = (noteDate.getDay() + 6) % 7;
            const dayData = weeklyData[dayIndex];
            if (dayData) {
                dayData.notesCount += 1;
            }
        });

        const totalNotes = weeklyData.reduce((sum, day) => sum + day.notesCount, 0);
        const daysWithNotes = weeklyData.filter(day => day.notesCount > 0).length;

        if (weeklyWeekRange) {
            weeklyWeekRange.textContent = formatWeekRangeLabel(weekStart, weekEnd);
        }

        if (weeklyActivitySummary) {
            if (totalNotes === 0) {
                weeklyActivitySummary.textContent = 'Sin registros durante la semana actual.';
            } else {
                const notesLabel = totalNotes === 1 ? 'nota' : 'notas';
                const daysLabel = daysWithNotes === 1 ? 'día' : 'días';
                weeklyActivitySummary.textContent = `Registraste ${totalNotes} ${notesLabel} en ${daysWithNotes} ${daysLabel} de esta semana.`;
            }
        }

        weeklyDayElements.forEach((dayEl, index) => {
            const dayData = weeklyData[index];
            if (!dayData) return;
            const hasNotes = dayData.notesCount > 0;
            dayEl.classList.toggle('active', hasNotes);
            dayEl.classList.toggle('inactive', !hasNotes);
            const checkIcon = dayEl.querySelector('[data-role="status-icon-check"]');
            const emptyIcon = dayEl.querySelector('[data-role="status-icon-empty"]');
            const statusText = dayEl.querySelector('[data-role="status-text"]');
            const statusDot = dayEl.querySelector('.status-dot');
            const dayLabel = dayData.date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' }).replace(/\./g, '');
            dayEl.setAttribute('title', hasNotes ? `${dayLabel}: ${dayData.notesCount} ${dayData.notesCount === 1 ? 'nota' : 'notas'}` : `${dayLabel}: sin registros`);
            if (checkIcon) {
                checkIcon.classList.toggle('hidden', !hasNotes);
            }
            if (emptyIcon) {
                emptyIcon.classList.toggle('hidden', hasNotes);
            }
            if (statusText) {
                statusText.textContent = hasNotes
                    ? `${dayData.notesCount} ${dayData.notesCount === 1 ? 'nota' : 'notas'}`
                    : 'Sin registros';
            }
            if (statusDot) {
                statusDot.setAttribute('aria-label', hasNotes ? 'Día con registros' : 'Día sin registros');
            }
        });
    };

    const normalizeSearchText = (text) => {
        if (!text) return '';
        return text
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const updateHistorySearchUI = () => {
        if (!historySearchClearBtn) return;
        const hasTerm = historySearchTerm.trim().length > 0;
        historySearchClearBtn.disabled = !hasTerm;
        historySearchClearBtn.classList.toggle('opacity-40', !hasTerm);
        historySearchClearBtn.classList.toggle('pointer-events-none', !hasTerm);
        historySearchClearBtn.classList.toggle('cursor-not-allowed', !hasTerm);
    };

    const updateTagFilterSummary = () => {
        if (!tagFilterSummary) return;
        tagFilterSummary.innerHTML = '';
        const hasActiveFilters = activeTagFilters.size > 0;
        tagFilterSummary.classList.toggle('hidden', !hasActiveFilters);
        if (!hasActiveFilters) return;

        activeTagFilters.forEach((tagName) => {
            const pill = document.createElement('span');
            pill.className = 'tag-filter-pill inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold border border-slate-200 bg-white text-slate-600';
            pill.innerHTML = `${tagName}<button type="button" data-tag-name="${tagName}" class="remove-tag-filter text-slate-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
            </button>`;
            tagFilterSummary.appendChild(pill);
        });

        tagFilterSummary.querySelectorAll('.remove-tag-filter').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const tag = event.currentTarget.getAttribute('data-tag-name');
                if (!tag) return;
                activeTagFilters.delete(tag);
                pendingTagSelection.delete(tag);
                renderTagFilterOptions();
                renderHistory();
            });
        });
    };

    const renderTagFilterOptions = () => {
        if (!tagFilterOptions || !tagFilterEmpty || !tagFilterSelectedEmpty || !tagFilterToggleLabel) return;
        const validTagNames = new Set((availableTags || []).map(tag => tag.name));
        pendingTagSelection = new Set([...pendingTagSelection].filter(tagName => validTagNames.has(tagName)));
        activeTagFilters = new Set([...activeTagFilters].filter(tagName => validTagNames.has(tagName)));

        const hasTags = validTagNames.size > 0;
        tagFilterEmpty.classList.toggle('hidden', hasTags);
        tagFilterOptions.classList.toggle('hidden', !hasTags);
        const hasPending = pendingTagSelection.size > 0;
        tagFilterSelectedEmpty.classList.toggle('hidden', hasPending || !hasTags);

        if (tagFilterToggleLabel) {
            tagFilterToggleLabel.textContent = activeTagFilters.size > 0
                ? `${activeTagFilters.size} etiqueta${activeTagFilters.size === 1 ? '' : 's'} seleccionada${activeTagFilters.size === 1 ? '' : 's'}`
                : 'Selecciona etiquetas…';
        }

        if (!hasTags) {
            tagFilterOptions.innerHTML = '';
            updateTagFilterSummary();
            return;
        }

        const sortedTags = [...availableTags].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        tagFilterOptions.innerHTML = '';
        sortedTags.forEach((tag) => {
            const option = document.createElement('label');
            option.className = 'flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer';
            const inputId = `tag-filter-${tag.name}`;
            option.innerHTML = `
                <input id="${inputId}" type="checkbox" value="${tag.name}" class="tag-filter-checkbox h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" ${pendingTagSelection.has(tag.name) ? 'checked' : ''}>
                <span class="flex-1">
                    <span class="block text-sm font-semibold text-slate-700">${tag.name}</span>
                    ${tag.color ? `<span class="inline-flex items-center gap-1 text-xs text-slate-500"><span class="h-2.5 w-2.5 rounded-full border border-slate-200" style="background:${tag.color}"></span>${tag.color}</span>` : ''}
                </span>
                ${tag.description ? `<span class="text-xs text-slate-400">${tag.description}</span>` : ''}
            `;
            tagFilterOptions.appendChild(option);
        });

        tagFilterOptions.querySelectorAll('.tag-filter-checkbox').forEach((checkbox) => {
            checkbox.addEventListener('change', (event) => {
                const tagName = event.target.value;
                if (!tagName) return;
                if (event.target.checked) {
                    pendingTagSelection.add(tagName);
                } else {
                    pendingTagSelection.delete(tagName);
                }
                tagFilterSelectedEmpty.classList.toggle('hidden', pendingTagSelection.size > 0 || !hasTags);
            });
        });

        updateTagFilterSummary();
    };

    const toggleTagFilterDropdown = (forceState) => {
        if (!tagFilterDropdown) return;
        const isOpen = tagFilterDropdown.dataset.open === 'true';
        const nextState = typeof forceState === 'boolean' ? forceState : !isOpen;
        tagFilterDropdown.dataset.open = nextState ? 'true' : 'false';
        tagFilterDropdown.classList.toggle('hidden', !nextState);
        tagFilterDropdown.style.display = nextState ? 'block' : 'none';
        if (tagFilterToggle) {
            tagFilterToggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        }
        if (nextState) {
            pendingTagSelection = new Set(activeTagFilters);
            renderTagFilterOptions();
        }
    };

    const applyPendingTagSelection = () => {
        activeTagFilters = new Set(pendingTagSelection);
        updateTagFilterSummary();
        renderTagFilterOptions();
        renderHistory();
        toggleTagFilterDropdown(false);
    };

    const clearTagFilters = ({ keepDropdownOpen = false } = {}) => {
        pendingTagSelection.clear();
        activeTagFilters.clear();
        updateTagFilterSummary();
        renderTagFilterOptions();
        renderHistory();
        if (!keepDropdownOpen) {
            toggleTagFilterDropdown(false);
        }
    };

    const renderHistory = () => {
        if (!db || !historyContainer || !noHistoryMessage) return;
        updateHistorySearchUI();
        const tx = db.transaction(['notes', 'tags'], 'readonly');
        tx.objectStore('tags').getAll().onsuccess = (eTags) => {
            const tagsMap = eTags.target.result.reduce((acc, tag) => ({ ...acc, [tag.name]: tag }), {});
            tx.objectStore('notes').getAll().onsuccess = (eNotes) => {
                const allNotes = eNotes.target.result.sort((a, b) => b.id - a.id);
                availableTags = eTags.target.result || [];
                renderTagFilterOptions();
                updateWeeklyOverview(allNotes);
                historyContainer.innerHTML = '';
                const hasNotes = allNotes.length > 0;
                noHistoryMessage.classList.toggle('hidden', hasNotes);

                if (!hasNotes) {
                    historySearchEmptyMessage?.classList.add('hidden');
                    updateTagFilterSummary();
                    return;
                }

                const normalizedSearch = normalizeSearchText(historySearchTerm);
                const filteredNotes = normalizedSearch
                    ? allNotes.filter((note) => {
                        const noteTitle = typeof note.title === 'string' ? note.title : 'Nota sin título';
                        return normalizeSearchText(noteTitle).includes(normalizedSearch);
                    })
                    : allNotes;

                const activeTagsArray = Array.from(activeTagFilters);
                const notesFilteredByTags = activeTagsArray.length > 0
                    ? filteredNotes.filter((note) => {
                        const noteTags = Array.isArray(note.tags) ? note.tags : [];
                        if (noteTags.length === 0) return false;
                        return activeTagsArray.every(tagName => noteTags.includes(tagName));
                    })
                    : filteredNotes;

                const isSearchActive = normalizedSearch.length > 0;
                const hasTagFilters = activeTagsArray.length > 0;
                const hasResults = notesFilteredByTags.length > 0;

                if (historySearchEmptyMessage) {
                    historySearchEmptyMessage.classList.toggle('hidden', hasResults || (!isSearchActive && !hasTagFilters));
                }

                if (!hasResults) {
                    return;
                }

                let currentDay = null;
                let dayGridContainer = null;
                notesFilteredByTags.forEach(note => {
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
        const noteData = { id: noteTimestamp, title: title || 'Nota sin título', content, tags: selectedTags, updatedAt: new Date().toISOString() };
        store.put(noteData);
        tx.oncomplete = () => {
            resetForm();
            refreshActiveView();
            triggerAutoBackup();
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

    const exportData = async () => {
        if (!db) {
            showUserNameStatus('La base de datos aún no está lista.', 'error');
            return;
        }
        try {
            const hasSettingsStore = db.objectStoreNames.contains(SETTINGS_STORE);
            const hasSessionsStore = db.objectStoreNames.contains(SESSIONS_STORE);

            const stores = ['notes', 'tags'];
            if (hasSettingsStore) stores.push(SETTINGS_STORE);
            if (hasSessionsStore) stores.push(SESSIONS_STORE);

            const tx = db.transaction(stores, 'readonly');
            const notesPromise = requestToPromise(tx.objectStore('notes').getAll());
            const tagsPromise = requestToPromise(tx.objectStore('tags').getAll());
            const sessionsPromise = hasSessionsStore ? requestToPromise(tx.objectStore(SESSIONS_STORE).getAll()) : Promise.resolve([]);

            let themePreference = null;
            let storedUserName = null;
            let storedBirthday = null;
            let storedWebhookUrl = null;

            if (hasSettingsStore) {
                const settingsStore = tx.objectStore(SETTINGS_STORE);
                const [themeEntry, userNameEntry, birthdayEntry, webhookEntry] = await Promise.all([
                    requestToPromise(settingsStore.get(THEME_KEY)),
                    requestToPromise(settingsStore.get(USER_NAME_KEY)),
                    requestToPromise(settingsStore.get(BIRTHDAY_KEY)),
                    requestToPromise(settingsStore.get(WEBHOOK_URL_KEY))
                ]);
                themePreference = typeof themeEntry?.value === 'string' ? sanitizeThemePreference(themeEntry.value) : null;
                storedUserName = typeof userNameEntry?.value === 'string' ? userNameEntry.value : null;
                storedWebhookUrl = typeof webhookEntry?.value === 'string' ? webhookEntry.value : null;
                if (birthdayEntry && typeof birthdayEntry.month === 'number' && typeof birthdayEntry.day === 'number') {
                    storedBirthday = { month: birthdayEntry.month, day: birthdayEntry.day };
                }
            }

            const [notes, tags, sessions] = await Promise.all([notesPromise, tagsPromise, sessionsPromise]);

            const exportObj = {
                meta: {
                    version: 2,
                    exportedAt: new Date().toISOString()
                },
                notes: Array.isArray(notes) ? notes : [],
                tags: Array.isArray(tags) ? tags : [],
                sessions: Array.isArray(sessions) ? sessions : [],
                settings: {
                    theme: themePreference,
                    userName: storedUserName,
                    birthday: storedBirthday,
                    discordWebhookUrl: storedWebhookUrl
                }
            };

            const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `notas-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (error) {
            console.error('No se pudo exportar los datos.', error);
            showUserNameStatus('No se pudo exportar los datos.', 'error');
        }
    };

    const exportDataToDiscord = async () => {
        if (!db) {
            showUserNameStatus('La base de datos aún no está lista.', 'error');
            return;
        }

        // Cambiar texto del botón para feedback visual
        const originalBtnContent = exportDiscordBtn.innerHTML;
        exportDiscordBtn.disabled = true;
        exportDiscordBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Enviando...';

        try {
            const hasSettingsStore = db.objectStoreNames.contains(SETTINGS_STORE);
            const hasSessionsStore = db.objectStoreNames.contains(SESSIONS_STORE);

            const stores = ['notes', 'tags'];
            if (hasSettingsStore) stores.push(SETTINGS_STORE);
            if (hasSessionsStore) stores.push(SESSIONS_STORE);

            const tx = db.transaction(stores, 'readonly');
            const notesPromise = requestToPromise(tx.objectStore('notes').getAll());
            const tagsPromise = requestToPromise(tx.objectStore('tags').getAll());
            const sessionsPromise = hasSessionsStore ? requestToPromise(tx.objectStore(SESSIONS_STORE).getAll()) : Promise.resolve([]);

            let themePreference = null;
            let storedUserName = null;
            let storedBirthday = null;
            let storedWebhookUrl = null;

            if (hasSettingsStore) {
                const settingsStore = tx.objectStore(SETTINGS_STORE);
                const [themeEntry, userNameEntry, birthdayEntry, webhookEntry] = await Promise.all([
                    requestToPromise(settingsStore.get(THEME_KEY)),
                    requestToPromise(settingsStore.get(USER_NAME_KEY)),
                    requestToPromise(settingsStore.get(BIRTHDAY_KEY)),
                    requestToPromise(settingsStore.get(WEBHOOK_URL_KEY))
                ]);
                themePreference = typeof themeEntry?.value === 'string' ? sanitizeThemePreference(themeEntry.value) : null;
                storedUserName = typeof userNameEntry?.value === 'string' ? userNameEntry.value : null;
                storedWebhookUrl = typeof webhookEntry?.value === 'string' ? webhookEntry.value : null;
                if (birthdayEntry && typeof birthdayEntry.month === 'number' && typeof birthdayEntry.day === 'number') {
                    storedBirthday = { month: birthdayEntry.month, day: birthdayEntry.day };
                }
            }

            const [notes, tags, sessions] = await Promise.all([notesPromise, tagsPromise, sessionsPromise]);

            if (!storedWebhookUrl) {
                throw new Error('No se ha configurado una URL de Webhook. Ve a la sección de Integraciones.');
            }

            const exportObj = {
                meta: {
                    version: 2,
                    exportedAt: new Date().toISOString()
                },
                notes: Array.isArray(notes) ? notes : [],
                tags: Array.isArray(tags) ? tags : [],
                sessions: Array.isArray(sessions) ? sessions : [],
                settings: {
                    theme: themePreference,
                    userName: storedUserName,
                    birthday: storedBirthday,
                    discordWebhookUrl: storedWebhookUrl
                }
            };

            const jsonString = JSON.stringify(exportObj, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const file = new File([blob], `notas-backup-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });

            const formData = new FormData();

            // Payload JSON para el mensaje embed
            const payloadJson = {
                username: "Notas App Backup",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/2965/2965358.png",
                embeds: [{
                    title: "📦 Copia de Seguridad de Notas",
                    description: `Se ha generado una nueva copia de seguridad.\n\n**Detalles:**\n📝 Notas: ${notes.length}\n🏷️ Etiquetas: ${tags.length}\n📅 Fecha: ${new Date().toLocaleDateString()}`,
                    color: 5793266, // Verde
                    footer: {
                        text: "Generado automáticamente desde la App de Notas"
                    },
                    timestamp: new Date().toISOString()
                }]
            };

            formData.append('payload_json', JSON.stringify(payloadJson));
            formData.append('file', file);

            const response = await fetch(storedWebhookUrl, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showUserNameStatus('Copia de seguridad enviada a Discord correctamente.', 'success');
            } else {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error('No se pudo enviar a Discord.', error);
            showUserNameStatus(error.message || 'No se pudo enviar a Discord.', 'error');
        } finally {
            exportDiscordBtn.disabled = false;
            exportDiscordBtn.innerHTML = originalBtnContent;
        }
    };

    const importDataFromObject = async (payload) => {
        if (!payload || typeof payload !== 'object') {
            throw new Error('El archivo no tiene el formato esperado.');
        }
        if (!db) {
            throw new Error('La base de datos aún no está lista.');
        }

        const notesArray = Array.isArray(payload.notes) ? payload.notes : [];
        const tagsArray = Array.isArray(payload.tags) ? payload.tags : [];
        const sessionsArray = Array.isArray(payload.sessions) ? payload.sessions : [];
        const rawSettings = payload.settings && typeof payload.settings === 'object' ? payload.settings : {};

        const sanitizedNotes = notesArray.filter(note => note && typeof note === 'object' && typeof note.id === 'number');
        const sanitizedTags = tagsArray.filter(tag => tag && typeof tag === 'object' && typeof tag.name === 'string');
        const sanitizedSessions = sessionsArray.filter(session => session && typeof session === 'object' && typeof session.duration === 'number');

        const sanitizedSettings = {
            theme: typeof rawSettings.theme === 'string' ? sanitizeThemePreference(rawSettings.theme) : null,
            userName: typeof rawSettings.userName === 'string' && rawSettings.userName.trim() ? rawSettings.userName.trim() : null,
            discordWebhookUrl: typeof rawSettings.discordWebhookUrl === 'string' ? rawSettings.discordWebhookUrl : null,
            birthday: null
        };

        if (rawSettings.birthday && typeof rawSettings.birthday === 'object') {
            const month = Number(rawSettings.birthday.month);
            const day = Number(rawSettings.birthday.day);
            if (Number.isInteger(month) && Number.isInteger(day) && isValidBirthday(month, day)) {
                sanitizedSettings.birthday = { month, day };
            }
        }

        try {
            await ensureSettingsStore();
        } catch (error) {
            console.warn('No se pudo garantizar el almacén de ajustes al importar.', error);
        }

        const hasSettingsStore = db.objectStoreNames.contains(SETTINGS_STORE);
        const hasSessionsStore = db.objectStoreNames.contains(SESSIONS_STORE);

        const stores = ['notes', 'tags'];
        if (hasSettingsStore) stores.push(SETTINGS_STORE);
        if (hasSessionsStore) stores.push(SESSIONS_STORE);

        const tx = db.transaction(stores, 'readwrite');
        const notesStore = tx.objectStore('notes');
        const tagsStore = tx.objectStore('tags');
        const settingsStore = hasSettingsStore ? tx.objectStore(SETTINGS_STORE) : null;
        const sessionsStore = hasSessionsStore ? tx.objectStore(SESSIONS_STORE) : null;

        const clearPromises = [
            requestToPromise(notesStore.clear()),
            requestToPromise(tagsStore.clear())
        ];
        if (settingsStore) {
            clearPromises.push(requestToPromise(settingsStore.clear()));
        }
        if (sessionsStore) {
            clearPromises.push(requestToPromise(sessionsStore.clear()));
        }
        await Promise.all(clearPromises);

        const writePromises = [
            ...sanitizedNotes.map(note => requestToPromise(notesStore.put(note))),
            ...sanitizedTags.map(tag => requestToPromise(tagsStore.put(tag)))
        ];

        if (sessionsStore) {
            writePromises.push(...sanitizedSessions.map(session => requestToPromise(sessionsStore.put(session))));
        }

        if (settingsStore) {
            if (sanitizedSettings.theme) {
                writePromises.push(requestToPromise(settingsStore.put({ key: THEME_KEY, value: sanitizedSettings.theme })));
            }
            if (sanitizedSettings.userName) {
                writePromises.push(requestToPromise(settingsStore.put({ key: USER_NAME_KEY, value: sanitizedSettings.userName })));
            }
            if (sanitizedSettings.birthday) {
                writePromises.push(requestToPromise(settingsStore.put({ key: BIRTHDAY_KEY, month: sanitizedSettings.birthday.month, day: sanitizedSettings.birthday.day })));
            }
            if (sanitizedSettings.discordWebhookUrl) {
                writePromises.push(requestToPromise(settingsStore.put({ key: WEBHOOK_URL_KEY, value: sanitizedSettings.discordWebhookUrl })));
            }
        }

        await Promise.all(writePromises);
        await transactionToPromise(tx);

        if (sanitizedSettings.theme) {
            currentThemePreference = sanitizedSettings.theme;
            applyTheme(currentThemePreference);
        } else {
            currentThemePreference = DEFAULT_THEME;
            applyTheme(currentThemePreference);
        }

        refreshActiveView();
        if (typeof populateMultiSelectDropdown === 'function') {
            populateMultiSelectDropdown();
        }
        showUserNameStatus('Datos importados correctamente.', 'success');
    };

    const handleImportFileSelection = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const payload = JSON.parse(text);
            await importDataFromObject(payload);
        } catch (error) {
            console.error('No se pudo importar el archivo proporcionado.', error);
            showUserNameStatus('No se pudo importar los datos. Verifica el archivo JSON.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    const clearAllData = () => {
        if (!db) return Promise.resolve();

        // 1. Identificar almacenes a limpiar
        const stores = ['notes', 'tags'];
        if (db.objectStoreNames.contains(SETTINGS_STORE)) stores.push(SETTINGS_STORE);
        if (db.objectStoreNames.contains(SESSIONS_STORE)) stores.push(SESSIONS_STORE);

        return new Promise((resolve, reject) => {
            // 2. Transacción de limpieza local
            const tx = db.transaction(stores, 'readwrite');
            stores.forEach(storeName => {
                tx.objectStore(storeName).clear();
            });

            tx.oncomplete = () => {
                // 3. Resetear variables en memoria
                currentThemePreference = DEFAULT_THEME;
                applyTheme(currentThemePreference);

                // Limpiar inputs UI
                if (userNameInput) userNameInput.value = '';
                if (birthdayMonthSelect) birthdayMonthSelect.value = '';
                if (birthdayDayInput) birthdayDayInput.value = '';
                if (discordWebhookInput) discordWebhookInput.value = '';
                if (noteCountEl) noteCountEl.textContent = '0';
                if (tagCountEl) tagCountEl.textContent = '0';

                refreshActiveView();
                renderTags();
                populateMultiSelectDropdown();
                updateStorageInfo();
                showUserNameStatus('Todos los datos locales han sido eliminados.', 'success');
                resolve();
            };

            tx.onerror = () => reject(tx.error);
        });
    };

    // Nota: al borrar todos los datos locales NO se borra el respaldo en GitHub.
    // GitHub actúa como fuente de verdad; si se borran datos locales,
    // el usuario puede restaurarlos desde Ajustes → "Restaurar desde la nube".

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
    document.getElementById('save-api-secret-btn')?.addEventListener('click', handleSaveApiSecret);
    document.getElementById('backup-now-btn')?.addEventListener('click', handleManualBackup);
    document.getElementById('restore-from-cloud-btn')?.addEventListener('click', handleRestore);

    if (showNoteFormBtn) showNoteFormBtn.addEventListener('click', showNoteFormModal);
    if (closeNoteModalBtn) closeNoteModalBtn.addEventListener('click', resetForm);
    if (saveNoteBtn) saveNoteBtn.addEventListener('click', saveNote);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetForm);
    if (importNotesBtn && importFileInput) {
        importNotesBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', handleImportFileSelection);
    }
    if (exportNotesBtn) exportNotesBtn.addEventListener('click', exportData);
    // if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', () => showModal(deleteAllModal)); // Movido a lógica personalizada arriba
    if (saveBirthdayBtn) saveBirthdayBtn.addEventListener('click', saveBirthday);
    if (clearBirthdayBtn) clearBirthdayBtn.addEventListener('click', clearBirthday);
    if (saveUserNameBtn) saveUserNameBtn.addEventListener('click', saveUserName);
    if (clearUserNameBtn) clearUserNameBtn.addEventListener('click', clearUserName);
    if (saveWebhookBtn) saveWebhookBtn.addEventListener('click', saveWebhookUrl);
    if (clearWebhookBtn) clearWebhookBtn.addEventListener('click', clearWebhookUrl);
    if (exportDiscordBtn) exportDiscordBtn.addEventListener('click', exportDataToDiscord);
    if (birthdayMonthSelect) birthdayMonthSelect.addEventListener('change', applyBirthdayLimits);
    if (birthdayMonthSelect) applyBirthdayLimits();
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

    // --- Session Tracking System ---
    let sessionStartTime = Date.now();
    let sessionSaved = false;

    const saveSession = () => {
        if (!db || sessionSaved) return;
        const endTime = Date.now();
        const duration = endTime - sessionStartTime;

        // Ignorar sesiones menores a 1 segundo para evitar ruido
        if (duration < 1000) return;

        try {
            if (db.objectStoreNames.contains(SESSIONS_STORE)) {
                const tx = db.transaction(SESSIONS_STORE, 'readwrite');
                const store = tx.objectStore(SESSIONS_STORE);
                store.add({
                    startTime: sessionStartTime,
                    endTime: endTime,
                    duration: duration,
                    date: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                sessionSaved = true;
                // console.log('Sesión guardada:', duration, 'ms');
            }
        } catch (e) {
            console.warn('No se pudo guardar la sesión:', e);
        }
    };

    // Resetear sesión al volver a la pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveSession();
        } else {
            sessionStartTime = Date.now();
            sessionSaved = false;
        }
    });

    // Guardar al cerrar o recargar
    window.addEventListener('pagehide', saveSession);
    window.addEventListener('beforeunload', saveSession);
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
        modal.addEventListener('click', async (e) => {
            if (e.target === modal || e.target.dataset.action === 'cancel') {
                hideModal(modal);
            }
            if (e.target.dataset.action === 'confirm') {
                if (modal.id === 'delete-one-modal' && noteIdToDelete) {
                    db.transaction('notes', 'readwrite').objectStore('notes').delete(noteIdToDelete).onsuccess = () => {
                        refreshActiveView();
                        triggerAutoBackup();
                    };
                    noteIdToDelete = null;
                } else if (modal.id === 'delete-all-modal') {
                    await clearAllData();
                    // El respaldo en GitHub NO se elimina al borrar datos locales.
                    // Si el usuario quiere restaurar, puede hacerlo desde Ajustes.
                }
                hideModal(modal);
            }
        });
    });

    // Mostrar modal con opción de nube condicional
    if (clearAllDataBtn) {
        clearAllDataBtn.addEventListener('click', () => {
            // La opción "borrar de la nube" no aplica con GitHub como backup:
            // el respaldo se conserva para poder restaurar después.
            const cloudOption = document.getElementById('cloud-delete-option');
            if (cloudOption) cloudOption.classList.add('hidden');
            showModal(deleteAllModal);
        });
    }

    // Inicializar estado de sincronización GitHub
    // (loadApiSecretStatus y loadLastSyncDisplay se invocan desde refreshActiveView
    //  una vez que los componentes del DOM están cargados)
});
