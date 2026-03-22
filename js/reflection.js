        document.addEventListener('componentsLoaded', () => {
            const DB_NAME = 'NotesDB';
            const DB_VERSION = 7;
            const NOTES_STORE = 'notes';
            const TAGS_STORE = 'tags';
            const SESSIONS_STORE = 'sessions';
            const QUOTE_API_URL = 'https://api.quotable.io/random?maxLength=160';

            const reflectionDateDisplay = document.getElementById('reflection-date-display');
            const refreshButton = document.getElementById('refresh-reflection-btn');

            const dailyNoteTitle = document.getElementById('daily-note-title');
            const dailyNoteContent = document.getElementById('daily-note-content');
            const dailyNoteDateWrapper = document.getElementById('daily-note-date');
            const dailyNoteTagsBadge = document.getElementById('daily-note-tags');
            const dailyNoteTagsList = document.getElementById('daily-note-tags-list');

            const ideaDayQuoteEl = document.getElementById('idea-day-quote');
            const ideaDayAuthorEl = document.getElementById('idea-day-author');
            const ideaDaySourceEl = document.getElementById('idea-day-source');
            const ideaRefreshBtn = document.getElementById('idea-refresh-btn');
            const ideaTranslateBtn = document.getElementById('idea-translate-btn');
            const ideaLoadingEl = document.getElementById('idea-loading');
            const ideaErrorEl = document.getElementById('idea-error');

            const weekNoteTitle = document.getElementById('week-note-title');
            const weekNoteContent = document.getElementById('week-note-content');
            const weekNoteDateBadge = document.getElementById('week-note-date');

            const yearAgoTitle = document.getElementById('year-ago-title');
            const yearAgoContent = document.getElementById('year-ago-content');
            const yearAgoDateEl = document.getElementById('year-ago-date');
            const yearAgoErrorEl = document.getElementById('year-ago-error');

            const currentYearTitle = document.getElementById('current-year-note-title');
            const currentYearContent = document.getElementById('current-year-note-content');
            const currentYearDateBadge = document.getElementById('current-year-note-date');

            let dbInstance = null;
            let isReloading = false;
            let currentQuote = null;
            let isQuoteTranslated = false;

            const SPANISH_FALLBACK_QUOTES = [
                {
                    content: 'El éxito no es la clave de la felicidad. La felicidad es la clave del éxito. Si amas lo que haces, tendrás éxito.',
                    author: 'Albert Schweitzer'
                },
                {
                    content: 'El único modo de hacer un gran trabajo es amar lo que haces.',
                    author: 'Steve Jobs'
                },
                {
                    content: 'No cuentes los días, haz que los días cuenten.',
                    author: 'Muhammad Ali'
                },
                {
                    content: 'La vida es lo que pasa mientras estás ocupado haciendo otros planes.',
                    author: 'John Lennon'
                },
                {
                    content: 'Siempre parece imposible hasta que se hace.',
                    author: 'Nelson Mandela'
                },
                {
                    content: 'La mejor venganza es un éxito masivo.',
                    author: 'Frank Sinatra'
                },
                {
                    content: 'El camino hacia el éxito y el camino hacia el fracaso son casi exactamente los mismos.',
                    author: 'Colin R. Davis'
                },
                {
                    content: 'La lógica te llevará de la A a la Z; la imaginación te llevará a todas partes.',
                    author: 'Albert Einstein'
                }
            ];

            const openDatabase = () => new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(NOTES_STORE)) {
                        db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(TAGS_STORE)) {
                        db.createObjectStore(TAGS_STORE, { keyPath: 'name' });
                    }
                    if (!db.objectStoreNames.contains('settings')) {
                        db.createObjectStore('settings', { keyPath: 'key' });
                    }
                    if (!db.objectStoreNames.contains('sessions')) {
                        db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
                    }
                };

            request.onsuccess = (event) => {
                    const db = event.target.result;
                    db.onversionchange = () => db.close();
                    resolve(db);
                };

                request.onerror = () => {
                    reject(request.error || new Error('No se pudo abrir la base de datos.'));
                };
            });

            const getAllFromStore = (db, storeName) => new Promise((resolve, reject) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    resolve([]);
                    return;
                }
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => {
                    resolve(Array.isArray(request.result) ? request.result : []);
                };
                request.onerror = () => reject(request.error);
            });

            const getContrastingTextColor = (hex) => {
                if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
                    return '#0f172a';
                }
                let formattedHex = hex;
                if (hex.length === 4) {
                    formattedHex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
                }
                const r = parseInt(formattedHex.slice(1, 3), 16);
                const g = parseInt(formattedHex.slice(3, 5), 16);
                const b = parseInt(formattedHex.slice(5, 7), 16);
                const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                return brightness >= 128 ? '#0f172a' : '#ffffff';
            };

            const renderTagChips = (container, tagNames = [], tagsMap = {}) => {
                if (!container) return;
                container.innerHTML = '';
                if (!Array.isArray(tagNames) || tagNames.length === 0) return;

                tagNames.forEach((tagName) => {
                    const chip = document.createElement('span');
                    chip.className = 'text-xs font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-700';
                    const tagData = tagsMap[tagName];
                    if (tagData?.color) {
                        chip.style.backgroundColor = tagData.color;
                        chip.style.color = getContrastingTextColor(tagData.color);
                    }
                    chip.textContent = tagName;
                    container.appendChild(chip);
                });
            };

            const setTextContent = (element, value) => {
                if (!element) return;
                element.textContent = value;
            };

            const toggleBadge = (element, textValue) => {
                if (!element) return;
                if (textValue) {
                    element.textContent = textValue;
                    element.classList.remove('hidden');
                } else {
                    element.textContent = '';
                    element.classList.add('hidden');
                }
            };

            const updateDateLabel = (wrapper, date) => {
                if (!wrapper) return;
                const textSpan = wrapper.querySelector('span:last-child');
                if (!textSpan) return;
                if (date instanceof Date && !Number.isNaN(date.getTime())) {
                    textSpan.textContent = date.toLocaleString('es-ES', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    });
                } else {
                    textSpan.textContent = '--';
                }
            };

            const setButtonDisabled = (button, disabled) => {
                if (!button) return;
                button.disabled = disabled;
                button.classList.toggle('opacity-60', disabled);
                button.classList.toggle('cursor-not-allowed', disabled);
            };

            const showIdeaLoading = (message = 'Cargando cita...') => {
                if (!ideaLoadingEl) return;
                ideaLoadingEl.textContent = message;
                ideaLoadingEl.classList.remove('hidden');
            };

            const hideIdeaLoading = () => {
                if (!ideaLoadingEl) return;
                ideaLoadingEl.classList.add('hidden');
            };

            const showIdeaError = (message) => {
                if (!ideaErrorEl) return;
                ideaErrorEl.textContent = message;
                ideaErrorEl.classList.remove('hidden');
            };

            const clearIdeaError = () => {
                if (!ideaErrorEl) return;
                ideaErrorEl.textContent = '';
                ideaErrorEl.classList.add('hidden');
            };

            const updateTranslateButtonState = () => {
                if (!ideaTranslateBtn) return;
                const shouldDisable = !currentQuote || currentQuote.language === 'es' || isQuoteTranslated;
                setButtonDisabled(ideaTranslateBtn, shouldDisable);
            };

            const renderIdeaQuote = ({ content, author }, languageIndicator, indicatorClass = '') => {
                if (ideaDayQuoteEl) {
                    ideaDayQuoteEl.textContent = `"${content}"`;
                }
                if (ideaDayAuthorEl) {
                    const spanClass = indicatorClass ? ` ${indicatorClass}` : '';
                    ideaDayAuthorEl.innerHTML = author
                        ? `- ${author} <span class="language-indicator${spanClass}">${languageIndicator}</span>`
                        : '';
                }
            };

            const useSpanishQuote = () => {
                const randomIndex = Math.floor(Math.random() * SPANISH_FALLBACK_QUOTES.length);
                currentQuote = { ...SPANISH_FALLBACK_QUOTES[randomIndex], language: 'es' };
                isQuoteTranslated = true;
                renderIdeaQuote(currentQuote, 'Español', 'original');
                setTextContent(ideaDaySourceEl, 'Cita de respaldo en español.');
                updateTranslateButtonState();
            };

            const fetchEnglishQuote = async () => {
                if (!ideaRefreshBtn) return;
                showIdeaLoading('Cargando cita...');
                clearIdeaError();
                setButtonDisabled(ideaRefreshBtn, true);
                setButtonDisabled(ideaTranslateBtn, true);

                try {
                    const response = await fetch('https://api.quotable.io/random', { cache: 'no-store' });
                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    currentQuote = {
                        content: data.content,
                        author: data.author,
                        language: 'en'
                    };
                    isQuoteTranslated = false;
                    renderIdeaQuote(currentQuote, 'Inglés');
                    if (ideaDaySourceEl) {
                        ideaDaySourceEl.innerHTML = 'Cita proporcionada por <a href="https://quotable.io" target="_blank" rel="noopener" class="text-blue-600 hover:underline">Quotable</a>.';
                    }
                } catch (error) {
                    console.error('Error fetching quote from API:', error);
                    useSpanishQuote();
                    showIdeaError('No se pudo obtener una cita en inglés. Mostrando cita en español.');
                } finally {
                    hideIdeaLoading();
                    setButtonDisabled(ideaRefreshBtn, false);
                    updateTranslateButtonState();
                }
            };

            const translateQuote = async () => {
                if (!currentQuote) {
                    showIdeaError('No hay una cita para traducir.');
                    return;
                }
                if (currentQuote.language === 'es' || isQuoteTranslated) {
                    showIdeaError('La cita ya está en español o traducida.');
                    return;
                }

                clearIdeaError();
                showIdeaLoading('Traduciendo cita...');
                setButtonDisabled(ideaTranslateBtn, true);

                try {
                    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(currentQuote.content)}&langpair=en|es`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    if (data.responseStatus !== 200) {
                        throw new Error(data.responseDetails || 'Error en la traducción.');
                    }

                    const translatedText = data.responseData?.translatedText;
                    if (!translatedText) {
                        throw new Error('La respuesta de la API no contenía traducción.');
                    }

                    currentQuote = {
                        ...currentQuote,
                        content: translatedText,
                        language: 'es'
                    };
                    isQuoteTranslated = true;
                    renderIdeaQuote(currentQuote, 'Traducido', 'translated');
                    setTextContent(ideaDaySourceEl, 'Cita traducida automáticamente con MyMemory.');
                } catch (error) {
                    console.error('Error translating quote:', error);
                    showIdeaError('No se pudo traducir la cita en este momento. Intenta obtener una nueva cita.');
                } finally {
                    hideIdeaLoading();
                    updateTranslateButtonState();
                }
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

            const pickRandom = (items = []) => {
                if (!Array.isArray(items) || items.length === 0) return null;
                const index = Math.floor(Math.random() * items.length);
                return items[index];
            };

            const sanitizeNotes = (notes = []) => {
                return notes.filter((note) => note && typeof note.id === 'number');
            };

            const createTagsMap = (tags = []) => {
                return tags.reduce((acc, tag) => {
                    if (tag && typeof tag.name === 'string') {
                        acc[tag.name] = tag;
                    }
                    return acc;
                }, {});
            };

            const renderDailyNote = (notes, tagsMap) => {
                const randomNote = pickRandom(notes);
                if (randomNote) {
                    const noteDate = new Date(randomNote.id);
                    setTextContent(dailyNoteTitle, randomNote.title || 'Nota sin título');
                    setTextContent(dailyNoteContent, randomNote.content || 'Sin contenido registrado.');
                    updateDateLabel(dailyNoteDateWrapper, noteDate);
                    const tagsCount = Array.isArray(randomNote.tags) ? randomNote.tags.length : 0;
                    toggleBadge(dailyNoteTagsBadge, tagsCount > 0 ? `${tagsCount} etiqueta${tagsCount === 1 ? '' : 's'}` : '');
                    renderTagChips(dailyNoteTagsList, randomNote.tags || [], tagsMap);
                } else {
                    setTextContent(dailyNoteTitle, 'Aún no hay nota destacada.');
                    setTextContent(dailyNoteContent, 'Registra notas o pulsa en "Actualizar resumen" más tarde.');
                    updateDateLabel(dailyNoteDateWrapper, null);
                    toggleBadge(dailyNoteTagsBadge, '');
                    renderTagChips(dailyNoteTagsList, [], {});
                }
            };

            const renderWeekNote = (notes) => {
                const startOfWeek = getStartOfWeek();
                const endOfWeek = getEndOfWeek(startOfWeek);
                const notesThisWeek = notes.filter((note) => {
                    const noteDate = new Date(note.id);
                    return noteDate >= startOfWeek && noteDate <= endOfWeek;
                });
                const chosenNote = pickRandom(notesThisWeek);
                if (chosenNote) {
                    const noteDate = new Date(chosenNote.id);
                    setTextContent(weekNoteTitle, chosenNote.title || 'Nota sin título');
                    setTextContent(weekNoteContent, chosenNote.content || 'Sin contenido registrado.');
                    toggleBadge(weekNoteDateBadge, noteDate.toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short'
                    }).replace(/\.$/, ''));
                } else {
                    setTextContent(weekNoteTitle, 'Sin registros semanales.');
                    setTextContent(weekNoteContent, 'Todavía no encontramos notas en la semana en curso.');
                    toggleBadge(weekNoteDateBadge, '');
                }
            };

            const renderYearAgoNote = (notes) => {
                const today = new Date();
                const lastYearDate = new Date(today);
                lastYearDate.setFullYear(today.getFullYear() - 1);
                const targetYear = lastYearDate.getFullYear();
                const targetMonth = lastYearDate.getMonth();
                const targetDay = lastYearDate.getDate();

                const matchingNotes = notes.filter((note) => {
                    const noteDate = new Date(note.id);
                    return noteDate.getFullYear() === targetYear &&
                        noteDate.getMonth() === targetMonth &&
                        noteDate.getDate() === targetDay;
                });

                const note = pickRandom(matchingNotes);
                if (note) {
                    const noteDate = new Date(note.id);
                    setTextContent(yearAgoTitle, note.title || 'Nota sin título');
                    setTextContent(yearAgoContent, note.content || 'Sin contenido registrado.');
                    setTextContent(yearAgoDateEl, noteDate.toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    }));
                    if (yearAgoErrorEl) {
                        yearAgoErrorEl.classList.add('hidden');
                    }
                } else {
                    setTextContent(yearAgoTitle, 'Sin notas almacenadas.');
                    setTextContent(yearAgoContent, 'No encontramos notas registradas en esta fecha del año anterior.');
                    setTextContent(yearAgoDateEl, '');
                    if (yearAgoErrorEl) {
                        yearAgoErrorEl.textContent = 'No hay coincidencias para la fecha de hace un año.';
                        yearAgoErrorEl.classList.remove('hidden');
                    }
                }
            };

            const renderCurrentYearNote = (notes) => {
                const currentYear = new Date().getFullYear();
                const notesThisYear = notes.filter((note) => {
                    const noteDate = new Date(note.id);
                    return noteDate.getFullYear() === currentYear;
                });
                const chosenNote = pickRandom(notesThisYear);
                if (chosenNote) {
                    const noteDate = new Date(chosenNote.id);
                    setTextContent(currentYearTitle, chosenNote.title || 'Nota sin título');
                    setTextContent(currentYearContent, chosenNote.content || 'Sin contenido registrado.');
                    toggleBadge(currentYearDateBadge, noteDate.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long'
                    }));
                } else {
                    setTextContent(currentYearTitle, 'Sin registros anuales.');
                    setTextContent(currentYearContent, 'Necesitas al menos una nota en el año actual para ver resultados.');
                    toggleBadge(currentYearDateBadge, '');
                }
            };

            const toggleRefreshState = (loading) => {
                if (!refreshButton) return;
                isReloading = loading;
                refreshButton.disabled = loading;
                refreshButton.classList.toggle('opacity-60', loading);
                refreshButton.classList.toggle('cursor-not-allowed', loading);
                refreshButton.setAttribute('aria-busy', loading ? 'true' : 'false');
            };

            const loadNotesAndTags = async () => {
                if (!dbInstance) {
                    dbInstance = await openDatabase();
                }
                const [notes, tags] = await Promise.all([
                    getAllFromStore(dbInstance, NOTES_STORE),
                    getAllFromStore(dbInstance, TAGS_STORE)
                ]);
                const sanitized = sanitizeNotes(notes);
                sanitized.sort((a, b) => b.id - a.id);
                return {
                    notes: sanitized,
                    tagsMap: createTagsMap(tags)
                };
            };

            const hydrateReflection = async () => {
                if (isReloading) return;
                toggleRefreshState(true);
                const now = new Date();
                if (reflectionDateDisplay) {
                    reflectionDateDisplay.textContent = now.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
                try {
                    const { notes, tagsMap } = await loadNotesAndTags();
                    renderDailyNote(notes, tagsMap);
                    renderWeekNote(notes);
                    renderYearAgoNote(notes);
                    renderCurrentYearNote(notes);
                } catch (error) {
                    console.error('No se pudieron cargar los datos de reflexión.', error);
                    renderDailyNote([], {});
                    renderWeekNote([]);
                    renderYearAgoNote([]);
                    renderCurrentYearNote([]);
                }
                await fetchEnglishQuote();
                toggleRefreshState(false);
            };

            if (ideaRefreshBtn) {
                ideaRefreshBtn.addEventListener('click', () => {
                    fetchEnglishQuote();
                });
            }

            if (ideaTranslateBtn) {
                ideaTranslateBtn.addEventListener('click', () => {
                    translateQuote();
                });
            }

            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    hydrateReflection();
                });
            }

            hydrateReflection();
        });