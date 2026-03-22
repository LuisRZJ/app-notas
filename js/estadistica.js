document.addEventListener('componentsLoaded', () => {
    // Configuración Base de Datos
    const DB_NAME = 'NotesDB';
    const DB_VERSION = 7; // Incrementar si hay cambios en esquema
    const NOTES_STORE = 'notes';
    const TAGS_STORE = 'tags';
    const SESSIONS_STORE = 'sessions';

    // Constantes de tiempo
    const dayInMs = 24 * 60 * 60 * 1000;
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    // Franjas horarias
    const timeRanges = [
        { label: 'Mañana', rangeLabel: '06:00 - 11:59', predicate: (h) => h >= 6 && h < 12 },
        { label: 'Tarde', rangeLabel: '12:00 - 17:59', predicate: (h) => h >= 12 && h < 18 },
        { label: 'Noche', rangeLabel: '18:00 - 23:59', predicate: (h) => h >= 18 && h <= 23 },
        { label: 'Madrugada', rangeLabel: '00:00 - 05:59', predicate: (h) => h >= 0 && h < 6 }
    ];

    // Elementos del DOM (Overview)
    const statsLastUpdateEl = document.getElementById('stats-last-update');
    const totalNotesCountEl = document.getElementById('total-notes-count');
    const averageNotesPerWeekEl = document.getElementById('average-notes-per-week');
    const journalAgeEl = document.getElementById('journal-age');
    const averageWordsPerNoteEl = document.getElementById('average-words-per-note');
    const averageTagsPerNoteEl = document.getElementById('average-tags-per-note');
    const topTimeRangeEl = document.getElementById('top-time-range');
    const topTimeRangeCountEl = document.getElementById('top-time-range-count');
    const totalSessionTimeEl = document.getElementById('total-session-time');
    const averageSessionTimeEl = document.getElementById('average-session-time');

    // Elementos del DOM (Listas & Distribución)
    const notesListEl = document.getElementById('notes-list');
    const notesListEmptyEl = document.getElementById('notes-list-empty');
    const notesTotalIndicatorEl = document.getElementById('notes-total-indicator');
    const tagFrequencyListEl = document.getElementById('tag-frequency-list');
    const tagFrequencyEmptyEl = document.getElementById('tag-frequency-empty');
    const tagsTotalIndicatorEl = document.getElementById('tags-total-indicator');
    
    // Plantillas (Templates)
    const noteSummaryTemplate = document.getElementById('note-summary-template');
    const tagFrequencyTemplate = document.getElementById('tag-frequency-template');
    const noteTagTemplate = document.getElementById('note-tag-template');

    // Mensajes default estado vacío
    const defaultNotesEmptyText = "Todavía no has creado ninguna nota en tu diario.";
    const defaultTagEmptyText = "Tus notas aún no tienen etiquetas asociadas.";
    const defaultMonthlyMessage = "Aún no hay suficientes datos para el gráfico anual.";
    const defaultHeatmapMessage = "No hay registros en el mes seleccionado.";

    // Elementos del DOM (Gráficos)
    const monthlyComparisonCanvas = document.getElementById('monthly-comparison-chart');
    const monthlyComparisonMessageEl = document.getElementById('monthly-comparison-message');
    const notesHeatmapGridEl = document.getElementById('notes-heatmap-grid');
    const notesHeatmapWeekdaysEl = document.getElementById('notes-heatmap-weekdays');
    const notesHeatmapMonthLabelEl = document.getElementById('notes-heatmap-month-label');
    const notesHeatmapMessageEl = document.getElementById('notes-heatmap-message');
    const notesHeatmapPrevBtn = document.getElementById('notes-heatmap-prev');
    const notesHeatmapNextBtn = document.getElementById('notes-heatmap-next');

    // Estado global de visualización
    let cachedNotes = [];
    let monthlyComparisonChart = null;
    let heatmapReferenceDate = getStartOfMonth(new Date());

    // Funciones de control de la UI de Mensajes (A11y/Color)
    const showStatusMessage = (element, message, type = 'info') => {
        if (!element) return;
        element.textContent = message;
        element.classList.remove('hidden');
        if (type === 'error') {
            element.classList.add('text-red-500');
            element.classList.remove('text-slate-500');
        } else {
            element.classList.remove('text-red-500');
            element.classList.add('text-slate-500');
        }
    };

    const hideStatusMessage = (element) => {
        if (!element) return;
        element.classList.add('hidden');
        element.classList.remove('text-red-500');
        element.classList.add('text-slate-500');
        element.textContent = '';
    };

    const getCurrentTheme = () => {
        return document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    };

    // Funciones utilitarias para coloreado
    const hexToRgb = (hex) => {
        if (!hex || typeof hex !== 'string') return null;
        let c = hex.replace(/^#/, '');
        if (c.length === 3) {
            c = c.split('').map(char => char + char).join('');
        }
        if (c.length !== 6) return null;
        const num = parseInt(c, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    };

    // Estilos dinámicos y Tema Responsive
    const applyDynamicCardTextColor = (cardEl) => {
        if (!cardEl) return;
        const theme = getCurrentTheme();
        const titleEl = cardEl.querySelector('[data-note-title], [data-tag-frequency-name]');
        if (theme === 'dark') {
            cardEl.classList.remove('bg-slate-50', 'border-slate-100');
            cardEl.classList.add('bg-slate-800', 'border-slate-700');
            if (titleEl) {
                titleEl.classList.remove('text-slate-800', 'text-slate-700');
                titleEl.classList.add('text-slate-200');
            }
        } else {
            cardEl.classList.remove('bg-slate-800', 'border-slate-700');
            cardEl.classList.add('bg-slate-50', 'border-slate-100');
            if (titleEl) {
                titleEl.classList.remove('text-slate-200');
                if (titleEl.hasAttribute('data-note-title')) titleEl.classList.add('text-slate-800');
                if (titleEl.hasAttribute('data-tag-frequency-name')) titleEl.classList.add('text-slate-700');
            }
        }
    };

    const applyTagPillStyles = (element, colorString) => {
        if (!element) return;
        const theme = getCurrentTheme();
        const rgb = hexToRgb(colorString);
        
        if (rgb) {
            if (theme === 'dark') {
                element.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
                element.style.color = `rgba(${Math.min(255, rgb.r + 80)}, ${Math.min(255, rgb.g + 80)}, ${Math.min(255, rgb.b + 80)}, 1)`;
            } else {
                element.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
                element.style.color = `rgba(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)}, 1)`;
            }
        } else {
            element.style.backgroundColor = '';
            element.style.color = '';
        }
    };

    const applyTagAccentStyles = (element, colorString) => {
        if (!element || !colorString) return;
        const theme = getCurrentTheme();
        const rgb = hexToRgb(colorString);
        if (rgb) {
            if (theme === 'dark') {
                element.style.color = `rgba(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)}, 1)`;
            } else {
                element.style.color = `rgba(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)}, 1)`;
            }
        } else {
            element.style.color = '';
        }
    };

    const applyTagBarStyles = (element, colorString) => {
        if (!element || !colorString) return;
        const theme = getCurrentTheme();
        const rgb = hexToRgb(colorString);
        if (rgb) {
            if (theme === 'dark') {
                element.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
            } else {
                element.style.backgroundColor = colorString;
            }
        } else {
            element.style.backgroundColor = '';
        }
    };

    const applyDynamicThemeStyles = () => {
        if (notesListEl) {
            Array.from(notesListEl.children).forEach(applyDynamicCardTextColor);
            const tagPills = notesListEl.querySelectorAll('[data-tag-name]');
            tagPills.forEach(pill => {
                const color = pill.dataset.baseColor;
                if (color) applyTagPillStyles(pill, color);
            });
        }
        if (tagFrequencyListEl) {
            Array.from(tagFrequencyListEl.children).forEach(child => {
                applyDynamicCardTextColor(child.firstElementChild);
                const nameEl = child.querySelector('[data-tag-frequency-name]');
                const barEl = child.querySelector('[data-tag-frequency-bar]');
                const color = nameEl?.dataset.baseColor;
                if (color) {
                    applyTagAccentStyles(nameEl, color);
                    applyTagBarStyles(barEl, color);
                }
            });
        }
    };

    // Observer para Tema (si la App.js lo cambia en tiempo de ejecución)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                applyDynamicThemeStyles();
                refreshVisualizations('theme-change');
            }
        });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // Funciones Utilitarias (Fechas, Conteo, Formateo)
    function getStartOfMonth(date) {
        const reference = date instanceof Date && !Number.isNaN(date.getTime()) ? new Date(date) : new Date();
        return new Date(reference.getFullYear(), reference.getMonth(), 1);
    }

    function formatMonthYearLabel(date) {
        const reference = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
        return `${monthNames[reference.getMonth()]} ${reference.getFullYear()}`;
    }

    function ensureHeatmapWeekdayHeader() {
        if (!notesHeatmapWeekdaysEl || !Array.isArray(weekdayLabels)) return;
        if (notesHeatmapWeekdaysEl.dataset.rendered === 'true') return;
        notesHeatmapWeekdaysEl.innerHTML = '';
        weekdayLabels.forEach((label) => {
            const span = document.createElement('span');
            span.textContent = label;
            notesHeatmapWeekdaysEl.appendChild(span);
        });
        notesHeatmapWeekdaysEl.dataset.rendered = 'true';
    }

    function describeNotesCount(count) {
        if (!Number.isFinite(count)) return '0 notas';
        const rounded = Math.max(0, Math.trunc(count));
        return `${rounded.toLocaleString('es-ES')} ${rounded === 1 ? 'nota' : 'notas'}`;
    }

    function getHeatmapIntensityColor(count, maxCount) {
        const theme = getCurrentTheme();
        if (!Number.isFinite(maxCount) || maxCount <= 0 || !Number.isFinite(count) || count <= 0) {
            return theme === 'dark' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(148, 163, 184, 0.12)';
        }
        const normalizedCount = Math.min(1, Math.max(0, count / maxCount));
        const baseHex = theme === 'dark' ? '#60a5fa' : '#2563eb';
        const baseRgb = hexToRgb(baseHex);
        if (!baseRgb) {
            return theme === 'dark' ? 'rgba(59, 130, 246, 0.45)' : 'rgba(37, 99, 235, 0.35)';
        }
        const minAlpha = theme === 'dark' ? 0.28 : 0.2;
        const maxAlpha = theme === 'dark' ? 0.82 : 0.72;
        const alpha = minAlpha + (maxAlpha - minAlpha) * normalizedCount;
        return `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${alpha.toFixed(3)})`;
    }

    function getHeatmapTextColor(count, maxCount) {
        const theme = getCurrentTheme();
        if (!Number.isFinite(maxCount) || maxCount <= 0 || !Number.isFinite(count) || count <= 0) {
            return theme === 'dark' ? '#94a3b8' : '#475569';
        }
        const normalizedCount = Math.min(1, Math.max(0, count / maxCount));
        if (normalizedCount >= 0.7) {
            return '#f8fafc';
        }
        if (normalizedCount >= 0.4) {
            return theme === 'dark' ? '#f1f5f9' : '#0f172a';
        }
        return theme === 'dark' ? '#cbd5f5' : '#1e293b';
    }

    function formatNumber(value, options = {}) {
        if (!Number.isFinite(value)) return '--';
        const defaults = value >= 100 ? { maximumFractionDigits: 0 } : { maximumFractionDigits: 1 };
        return value.toLocaleString('es-ES', { ...defaults, ...options });
    }

    function countWords(text) {
        if (typeof text !== 'string') return 0;
        const trimmed = text.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).filter(Boolean).length;
    }

    function formatDuration(ms) {
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
    }

    function formatJournalAge(firstDate) {
        if (!(firstDate instanceof Date) || Number.isNaN(firstDate.getTime())) return '--';
        const now = new Date();
        
        let diffMs = now.getTime() - firstDate.getTime();
        if (diffMs < 0) diffMs = 0;

        if (diffMs < 24 * 60 * 60 * 1000) {
            const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));
            return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        }

        let years = now.getFullYear() - firstDate.getFullYear();
        let months = now.getMonth() - firstDate.getMonth();
        let days = now.getDate() - firstDate.getDate();

        if (days < 0) {
            months--;
            const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonthLastDay.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
        if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
        if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);

        if (parts.length === 0) return '1 día';
        if (parts.length === 1) return parts[0];
        return parts.slice(0, -1).join(', ') + ' y ' + parts.slice(-1);
    }

    const requestToPromise = (request) => new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    // Resetear UI
    const resetStats = () => {
        if (statsLastUpdateEl) statsLastUpdateEl.textContent = 'Actualizado: --';
        if (totalNotesCountEl) totalNotesCountEl.textContent = '0';
        if (averageNotesPerWeekEl) averageNotesPerWeekEl.textContent = '--';
        if (journalAgeEl) journalAgeEl.textContent = '--';
        if (averageWordsPerNoteEl) averageWordsPerNoteEl.textContent = '--';
        if (averageTagsPerNoteEl) averageTagsPerNoteEl.textContent = '--';
        if (totalSessionTimeEl) totalSessionTimeEl.textContent = '--';
        if (averageSessionTimeEl) averageSessionTimeEl.textContent = '--';
        if (topTimeRangeEl) topTimeRangeEl.textContent = '--:-- - --:--';
        if (topTimeRangeCountEl) topTimeRangeCountEl.textContent = 'Notas registradas en la franja: --';
        if (notesTotalIndicatorEl) notesTotalIndicatorEl.textContent = '0';
        if (tagsTotalIndicatorEl) tagsTotalIndicatorEl.textContent = '0';
        if (notesListEl) notesListEl.innerHTML = '';
        if (tagFrequencyListEl) tagFrequencyListEl.innerHTML = '';
    };

    const showEmptyState = () => {
        resetStats();
        if (notesListEmptyEl) {
            notesListEmptyEl.classList.remove('hidden');
            notesListEmptyEl.textContent = defaultNotesEmptyText;
        }
        if (tagFrequencyEmptyEl) {
            tagFrequencyEmptyEl.classList.remove('hidden');
            tagFrequencyEmptyEl.textContent = defaultTagEmptyText;
        }
        cachedNotes = [];
        heatmapReferenceDate = getStartOfMonth(new Date());
        refreshVisualizations('empty-state', []);
    };

    // Renderizado de Subsecciones
    const renderNotesList = (notes, tagsMap) => {
        if (!notesListEl || !noteSummaryTemplate) return;
        notesListEl.innerHTML = '';

        if (!Array.isArray(notes) || notes.length === 0) {
            showEmptyState();
            return;
        }

        const sortedNotes = [...notes].sort((a, b) => b.id - a.id);
        sortedNotes.forEach((note) => {
            const fragment = noteSummaryTemplate.content.cloneNode(true);
            const titleEl = fragment.querySelector('[data-note-title]');
            const dateEl = fragment.querySelector('[data-note-date]');
            const wordCountEl = fragment.querySelector('[data-note-word-count]');
            const tagsContainerEl = fragment.querySelector('[data-note-tags]');

            const rawTitle = typeof note.title === 'string' ? note.title.trim() : '';
            const title = rawTitle || 'Nota sin título';
            const noteDate = new Date(note.id);
            const dateLabel = Number.isNaN(noteDate.getTime())
                ? 'Fecha desconocida'
                : noteDate.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
            const wordCount = countWords(note.content);

            if (titleEl) titleEl.textContent = title;
            if (dateEl) dateEl.textContent = dateLabel;
            if (wordCountEl) wordCountEl.textContent = `${wordCount.toLocaleString('es-ES')} ${wordCount === 1 ? 'palabra' : 'palabras'}`;

            if (tagsContainerEl) {
                tagsContainerEl.innerHTML = '';
                const uniqueTags = Array.from(new Set(Array.isArray(note.tags) ? note.tags : []));
                if (uniqueTags.length === 0) {
                    tagsContainerEl.classList.add('hidden');
                } else {
                    tagsContainerEl.classList.remove('hidden');
                    uniqueTags.forEach((tagName) => {
                        const tagInfo = tagsMap instanceof Map ? tagsMap.get(tagName) : undefined;
                        const tagColor = typeof tagInfo?.color === 'string' ? tagInfo.color : '';
                        if (noteTagTemplate) {
                            const tagFragment = noteTagTemplate.content.cloneNode(true);
                            const pillEl = tagFragment.querySelector('[data-tag-name]');
                            if (pillEl) {
                                pillEl.textContent = `#${tagName}`;
                                pillEl.dataset.baseColor = tagColor;
                                applyTagPillStyles(pillEl, tagColor);
                            }
                            tagsContainerEl.appendChild(tagFragment);
                        } else {
                            const span = document.createElement('span');
                            span.className = 'text-xs font-semibold tag-pill px-3 py-1';
                            span.textContent = `#${tagName}`;
                            span.dataset.baseColor = tagColor;
                            applyTagPillStyles(span, tagColor);
                            tagsContainerEl.appendChild(span);
                        }
                    });
                }
            }

            const noteCardEl = fragment.querySelector('.note-summary');
            applyDynamicCardTextColor(noteCardEl);
            notesListEl.appendChild(fragment);
        });

        if (notesListEmptyEl) {
            notesListEmptyEl.classList.add('hidden');
            notesListEmptyEl.textContent = defaultNotesEmptyText;
        }
    };

    const renderTagFrequency = (notes, tagsMap) => {
        if (!tagFrequencyListEl || !tagFrequencyTemplate) return;
        tagFrequencyListEl.innerHTML = '';

        if (!Array.isArray(notes) || notes.length === 0) {
            if (tagFrequencyEmptyEl) {
                tagFrequencyEmptyEl.classList.remove('hidden');
                tagFrequencyEmptyEl.textContent = defaultTagEmptyText;
            }
            return;
        }

        const tagPresence = new Map();
        notes.forEach((note) => {
            const uniqueTags = Array.from(new Set(Array.isArray(note.tags) ? note.tags : []));
            uniqueTags.forEach((tag) => {
                tagPresence.set(tag, (tagPresence.get(tag) || 0) + 1);
            });
        });

        if (tagPresence.size === 0) {
            if (tagFrequencyEmptyEl) {
                tagFrequencyEmptyEl.classList.remove('hidden');
                tagFrequencyEmptyEl.textContent = defaultTagEmptyText;
            }
            return;
        }

        const totalNotes = notes.length;
        [...tagPresence.entries()]
            .sort((a, b) => b[1] - a[1])
            .forEach(([tagName, count]) => {
                const fragment = tagFrequencyTemplate.content.cloneNode(true);
                const nameEl = fragment.querySelector('[data-tag-frequency-name]');
                const countEl = fragment.querySelector('[data-tag-frequency-count]');
                const percentageEl = fragment.querySelector('[data-tag-frequency-percentage]');
                const barEl = fragment.querySelector('[data-tag-frequency-bar]');

                const percentage = (count / totalNotes) * 100;
                if (nameEl) nameEl.textContent = `#${tagName}`;
                if (countEl) countEl.textContent = `${count.toLocaleString('es-ES')} ${count === 1 ? 'nota' : 'notas'}`;
                if (percentageEl) percentageEl.textContent = `${percentage.toFixed(1)}%`;
                if (barEl) barEl.style.width = `${Math.min(100, percentage)}%`;

                const tagInfo = tagsMap.get(tagName);
                const tagColor = typeof tagInfo?.color === 'string' ? tagInfo.color : '';
                if (nameEl) {
                    nameEl.dataset.baseColor = tagColor;
                    applyTagAccentStyles(nameEl, tagColor);
                }
                if (barEl) {
                    barEl.dataset.baseColor = tagColor;
                    applyTagBarStyles(barEl, tagColor);
                }

                applyDynamicCardTextColor(fragment.firstElementChild);
                tagFrequencyListEl.appendChild(fragment);
            });

        if (tagFrequencyEmptyEl) {
            tagFrequencyEmptyEl.classList.add('hidden');
            tagFrequencyEmptyEl.textContent = defaultTagEmptyText;
        }
    };

    const updateOverview = (notes, tagsMap, sessions) => {
        const sessionList = Array.isArray(sessions) ? sessions : [];
        const totalDuration = sessionList.reduce((acc, session) => acc + (session.duration || 0), 0);
        const averageDuration = sessionList.length > 0 ? totalDuration / sessionList.length : 0;

        if (totalSessionTimeEl) totalSessionTimeEl.textContent = formatDuration(totalDuration);
        if (averageSessionTimeEl) averageSessionTimeEl.textContent = formatDuration(averageDuration);

        if (!Array.isArray(notes) || notes.length === 0) {
            showEmptyState();
            if (totalSessionTimeEl) totalSessionTimeEl.textContent = formatDuration(totalDuration);
            if (averageSessionTimeEl) averageSessionTimeEl.textContent = formatDuration(averageDuration);
            return;
        }

        const sortedByDate = [...notes].sort((a, b) => a.id - b.id);
        const firstNoteDate = new Date(sortedByDate[0].id);
        const lastNoteDate = new Date(sortedByDate[sortedByDate.length - 1].id);
        const totalNotes = notes.length;
        const uniqueTags = new Set();
        let totalWords = 0;
        let totalNoteTags = 0;

        const rangeCounters = timeRanges.map(() => 0);

        notes.forEach((note) => {
            totalWords += countWords(note.content);
            const noteTags = Array.isArray(note.tags) ? note.tags : [];
            totalNoteTags += noteTags.length;
            noteTags.forEach((tag) => uniqueTags.add(tag));

            const noteDate = new Date(note.id);
            if (!Number.isNaN(noteDate.getTime())) {
                const hour = noteDate.getHours();
                timeRanges.forEach((item, index) => {
                    if (item.predicate(hour)) {
                        rangeCounters[index] += 1;
                    }
                });
            }
        });

        const spanMs = Math.max(1, lastNoteDate.getTime() - firstNoteDate.getTime());
        const spanWeeks = Math.max(1, spanMs / (7 * dayInMs));
        const averagePerWeek = totalNotes / spanWeeks;
        const averageWords = totalWords / totalNotes;
        const averageTags = totalNoteTags / totalNotes;

        const bestRangeIndex = rangeCounters.reduce((bestIndex, value, index) => {
            if (value > rangeCounters[bestIndex]) return index;
            return bestIndex;
        }, 0);
        const bestRangeCount = rangeCounters[bestRangeIndex];

        if (totalNotesCountEl) totalNotesCountEl.textContent = totalNotes.toLocaleString('es-ES');
        if (averageNotesPerWeekEl) averageNotesPerWeekEl.textContent = formatNumber(averagePerWeek);
        if (journalAgeEl) journalAgeEl.textContent = formatJournalAge(firstNoteDate);
        if (averageWordsPerNoteEl) averageWordsPerNoteEl.textContent = formatNumber(averageWords);
        if (averageTagsPerNoteEl) averageTagsPerNoteEl.textContent = formatNumber(averageTags);
        if (notesTotalIndicatorEl) notesTotalIndicatorEl.textContent = totalNotes.toLocaleString('es-ES');
        if (tagsTotalIndicatorEl) tagsTotalIndicatorEl.textContent = uniqueTags.size.toLocaleString('es-ES');

        if (bestRangeCount > 0) {
            const bestRange = timeRanges[bestRangeIndex];
            if (topTimeRangeEl) topTimeRangeEl.textContent = bestRange.rangeLabel;
            if (topTimeRangeCountEl) topTimeRangeCountEl.textContent = `Notas registradas en la franja: ${bestRangeCount.toLocaleString('es-ES')}`;
        } else {
            if (topTimeRangeEl) topTimeRangeEl.textContent = '--:-- - --:--';
            if (topTimeRangeCountEl) topTimeRangeCountEl.textContent = 'Notas registradas en la franja: --';
        }

        if (!Number.isNaN(lastNoteDate.getTime())) {
            const formattedDate = lastNoteDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
            if (statsLastUpdateEl) statsLastUpdateEl.textContent = `Actualizado: ${formattedDate}`;
        } else {
            if (statsLastUpdateEl) statsLastUpdateEl.textContent = 'Actualizado: --';
        }

        if (notesListEmptyEl) {
            notesListEmptyEl.classList.add('hidden');
            notesListEmptyEl.textContent = defaultNotesEmptyText;
        }
        if (tagFrequencyEmptyEl) {
            tagFrequencyEmptyEl.classList.add('hidden');
            tagFrequencyEmptyEl.textContent = defaultTagEmptyText;
        }

        renderNotesList(notes, tagsMap);
        renderTagFrequency(notes, tagsMap);
        applyDynamicThemeStyles();
        
        cachedNotes = Array.isArray(notes) ? notes : [];
        const latestNoteDate = new Date(sortedByDate[sortedByDate.length - 1].id);
        heatmapReferenceDate = Number.isNaN(latestNoteDate.getTime()) ? getStartOfMonth(new Date()) : getStartOfMonth(latestNoteDate);
        refreshVisualizations('data-update', cachedNotes);
    };

    // Funciones Gráficas
    const computeMonthlyCounts = (notes) => {
        const result = {
            currentYear: Array(12).fill(0),
            previousYear: Array(12).fill(0),
            currentYearValue: new Date().getFullYear(),
            previousYearValue: new Date().getFullYear() - 1
        };
        if (!Array.isArray(notes)) return result;
        notes.forEach((note) => {
            if (typeof note?.id !== 'number') return;
            const date = new Date(note.id);
            if (Number.isNaN(date.getTime())) return;
            const year = date.getFullYear();
            const month = date.getMonth();
            if (year === result.currentYearValue) {
                result.currentYear[month] += 1;
            } else if (year === result.previousYearValue) {
                result.previousYear[month] += 1;
            }
        });
        return result;
    };

    const getMonthlyChartColors = () => {
        const theme = getCurrentTheme();
        return theme === 'dark'
            ? {
                current: 'rgba(96, 165, 250, 0.75)',
                currentBorder: 'rgba(96, 165, 250, 1)',
                previous: 'rgba(147, 197, 253, 0.4)',
                previousBorder: 'rgba(147, 197, 253, 1)',
                grid: 'rgba(148, 163, 184, 0.35)',
                ticks: '#cbd5f5'
            }
            : {
                current: 'rgba(37, 99, 235, 0.75)',
                currentBorder: 'rgba(37, 99, 235, 1)',
                previous: 'rgba(148, 163, 184, 0.35)',
                previousBorder: 'rgba(148, 163, 184, 1)',
                grid: 'rgba(148, 163, 184, 0.35)',
                ticks: '#475569'
            };
    };

    const renderMonthlyComparisonChart = (notes) => {
        if (!monthlyComparisonCanvas || typeof Chart !== 'function') return;
        hideStatusMessage(monthlyComparisonMessageEl);
        const data = computeMonthlyCounts(notes);
        const totalCurrent = data.currentYear.reduce((acc, value) => acc + value, 0);
        const totalPrevious = data.previousYear.reduce((acc, value) => acc + value, 0);
        const colors = getMonthlyChartColors();

        if (totalCurrent === 0 && totalPrevious === 0) {
            showStatusMessage(monthlyComparisonMessageEl, defaultMonthlyMessage, 'info');
            if (monthlyComparisonChart) {
                monthlyComparisonChart.destroy();
                monthlyComparisonChart = null;
            }
            return;
        }

        const config = {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: `${data.currentYearValue}`,
                        data: data.currentYear,
                        backgroundColor: colors.current,
                        borderColor: colors.currentBorder,
                        borderWidth: 1.5,
                        borderRadius: 6,
                        maxBarThickness: 32
                    },
                    {
                        label: `${data.previousYearValue}`,
                        data: data.previousYear,
                        backgroundColor: colors.previous,
                        borderColor: colors.previousBorder,
                        borderWidth: 1.5,
                        borderRadius: 6,
                        maxBarThickness: 32
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: { display: false },
                        ticks: { color: colors.ticks, font: { family: 'Inter' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.grid, drawBorder: false },
                        ticks: { color: colors.ticks, precision: 0, font: { family: 'Inter' } }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: colors.ticks, font: { family: 'Inter', weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${value.toLocaleString('es-ES')} ${value === 1 ? 'nota' : 'notas'}`;
                            }
                        }
                    }
                }
            }
        };

        try {
            if (monthlyComparisonChart) {
                monthlyComparisonChart.destroy();
            }
            monthlyComparisonChart = new Chart(monthlyComparisonCanvas.getContext('2d'), config);
        } catch (error) {
            console.error('No fue posible renderizar el gráfico mensual.', error);
            showStatusMessage(monthlyComparisonMessageEl, 'Ocurrió un error al crear el gráfico mensual.', 'error');
        }
    };

    const computeHeatmapData = (notes, referenceDate) => {
        const startDate = getStartOfMonth(referenceDate);
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const countsPerDay = Array(daysInMonth).fill(0);
        if (Array.isArray(notes)) {
            notes.forEach((note) => {
                if (typeof note?.id !== 'number') return;
                const date = new Date(note.id);
                if (Number.isNaN(date.getTime())) return;
                if (date.getFullYear() === year && date.getMonth() === month) {
                    const dayIndex = date.getDate() - 1;
                    if (dayIndex >= 0 && dayIndex < countsPerDay.length) {
                        countsPerDay[dayIndex] += 1;
                    }
                }
            });
        }
        return {
            startDate,
            year,
            month,
            daysInMonth,
            countsPerDay,
            maxCount: Math.max(...countsPerDay, 0)
        };
    };

    const renderNotesHeatmap = (notes, referenceDate) => {
        if (!notesHeatmapGridEl) return;
        hideStatusMessage(notesHeatmapMessageEl);
        ensureHeatmapWeekdayHeader();
        const heatmapData = computeHeatmapData(notes, referenceDate);
        if (!Array.isArray(heatmapData.countsPerDay) || heatmapData.countsPerDay.length === 0) {
            showStatusMessage(notesHeatmapMessageEl, defaultHeatmapMessage, 'info');
            notesHeatmapGridEl.innerHTML = '';
            if (notesHeatmapMonthLabelEl) notesHeatmapMonthLabelEl.textContent = formatMonthYearLabel(heatmapData.startDate);
            return;
        }

        const { daysInMonth, countsPerDay, maxCount, startDate } = heatmapData;
        notesHeatmapGridEl.innerHTML = '';
        if (notesHeatmapMonthLabelEl) notesHeatmapMonthLabelEl.textContent = formatMonthYearLabel(startDate);
        const firstDayIndex = (startDate.getDay() + 6) % 7; 

        for (let i = 0; i < firstDayIndex; i += 1) {
            const placeholder = document.createElement('div');
            placeholder.className = 'heatmap-cell heatmap-cell__blank';
            notesHeatmapGridEl.appendChild(placeholder);
        }

        countsPerDay.forEach((count, index) => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            const dayNumber = index + 1;
            const intensity = getHeatmapIntensityColor(count, maxCount);
            const textColor = getHeatmapTextColor(count, maxCount);
            cell.style.backgroundColor = intensity;
            cell.style.color = textColor;

            const dateLabel = document.createElement('span');
            dateLabel.className = 'heatmap-cell__date';
            dateLabel.textContent = dayNumber.toString();

            const countLabel = document.createElement('span');
            countLabel.className = 'heatmap-cell__count';
            if (count <= 0) {
                countLabel.textContent = '-';
                countLabel.classList.add('heatmap-cell__empty');
            } else {
                countLabel.textContent = count.toLocaleString('es-ES');
            }

            cell.appendChild(dateLabel);
            cell.appendChild(countLabel);
            cell.title = `${dayNumber} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()} · ${describeNotesCount(count)}`;
            notesHeatmapGridEl.appendChild(cell);
        });

        if (maxCount <= 0) {
            showStatusMessage(notesHeatmapMessageEl, 'No hay notas registradas en este mes.', 'info');
        }
    };

    let refreshVisualizations = (reason = '', notes = cachedNotes) => {
        if (!Array.isArray(notes)) notes = cachedNotes;
        try {
            renderMonthlyComparisonChart(notes);
        } catch (error) {
            console.error('Error al actualizar el gráfico mensual.', error);
            showStatusMessage(monthlyComparisonMessageEl, 'No fue posible actualizar el gráfico mensual.', 'error');
        }

        try {
            const reference = heatmapReferenceDate instanceof Date ? heatmapReferenceDate : new Date();
            renderNotesHeatmap(notes, reference);
        } catch (error) {
            console.error('Error al actualizar el mapa de calor.', error);
            showStatusMessage(notesHeatmapMessageEl, 'No fue posible actualizar el mapa de calor.', 'error');
        }
    };

    const handleMonthNavigation = (delta) => {
        const baseDate = heatmapReferenceDate instanceof Date && !Number.isNaN(heatmapReferenceDate.getTime())
            ? new Date(heatmapReferenceDate)
            : getStartOfMonth(new Date());
        baseDate.setMonth(baseDate.getMonth() + delta);
        heatmapReferenceDate = getStartOfMonth(baseDate);
        refreshVisualizations('month-navigation');
    };

    if (notesHeatmapPrevBtn) {
        notesHeatmapPrevBtn.addEventListener('click', () => handleMonthNavigation(-1));
    }
    if (notesHeatmapNextBtn) {
        notesHeatmapNextBtn.addEventListener('click', () => handleMonthNavigation(1));
    }
    
    // Carga inicial 
    const loadStats = (db) => {
        try {
            const hasSessionsStore = db.objectStoreNames.contains(SESSIONS_STORE);
            const stores = [NOTES_STORE, TAGS_STORE];
            if (hasSessionsStore) stores.push(SESSIONS_STORE);

            const transaction = db.transaction(stores, 'readonly');
            const notesRequest = transaction.objectStore(NOTES_STORE).getAll();
            const tagsRequest = transaction.objectStore(TAGS_STORE).getAll();
            
            const getSessions = () => hasSessionsStore ? requestToPromise(transaction.objectStore(SESSIONS_STORE).getAll()) : Promise.resolve([]);

            Promise.all([
                requestToPromise(notesRequest), 
                requestToPromise(tagsRequest),
                getSessions()
            ])
                .then(([notesRaw, tagsRaw, sessionsRaw]) => {
                    const notes = Array.isArray(notesRaw) ? notesRaw.filter((note) => typeof note?.id === 'number') : [];
                    const tagsMap = new Map();
                    if (Array.isArray(tagsRaw)) {
                        tagsRaw.forEach((tag) => {
                            if (tag?.name) {
                                tagsMap.set(tag.name, tag);
                            }
                        });
                    }

                    if (notes.length === 0) {
                        showEmptyState();
                        return;
                    }

                    updateOverview(notes, tagsMap, sessionsRaw);
                })
                .catch((error) => {
                    console.error('No se pudieron obtener los datos de estadísticas del usuario.', error);
                    showEmptyState();
                });
        } catch (error) {
            console.error('Error al iniciar la transacción de estadísticas.', error);
            showEmptyState();
        }
    };

    resetStats();

    if (!window.indexedDB) {
        console.warn('IndexedDB no está disponible en este navegador.');
        showEmptyState();
        return;
    }

    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
    
    openRequest.onupgradeneeded = (event) => {
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
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
            db.createObjectStore(SESSIONS_STORE, { keyPath: 'id', autoIncrement: true });
        }
    };

    openRequest.onsuccess = (event) => {
        const db = event.target.result;
        loadStats(db);
    };
    openRequest.onerror = () => {
        console.error('No se pudo abrir la base de datos NotesDB para estadísticas.');
        showEmptyState();
    };
    openRequest.onblocked = () => {
        console.warn('La base de datos está en uso por otra pestaña.');
    };
});
