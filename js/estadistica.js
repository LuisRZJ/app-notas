document.addEventListener('componentsLoaded', () => {
    // Configuración Base de Datos
    const DB_NAME = 'NotesDB';
    const DB_VERSION = 8; // Incrementar si hay cambios en esquema
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
    const statsPeriodActiveLabelEl = document.getElementById('stats-period-active-label');
    const statsPeriodDistributionLabelEl = document.getElementById('stats-period-distribution-label');
    const statsPeriodPresetButtons = Array.from(document.querySelectorAll('.stats-period-preset-btn'));
    const statsCompareSubtitleEl = document.getElementById('stats-compare-subtitle');
    const statsYearControlsEl = document.getElementById('stats-year-controls');
    const statsMonthControlsEl = document.getElementById('stats-month-controls');
    const statsQuarterControlsEl = document.getElementById('stats-quarter-controls');
    const statsRollingCompareInfoEl = document.getElementById('stats-rolling-compare-info');
    const statsPrimaryYearSelect = document.getElementById('stats-primary-year-select');
    const statsSecondaryYearSelect = document.getElementById('stats-secondary-year-select');
    const statsPrimaryMonthSelect = document.getElementById('stats-primary-month-select');
    const statsPrimaryMonthYearSelect = document.getElementById('stats-primary-month-year-select');
    const statsSecondaryMonthSelect = document.getElementById('stats-secondary-month-select');
    const statsSecondaryMonthYearSelect = document.getElementById('stats-secondary-month-year-select');
    const statsPrimaryQuarterSelect = document.getElementById('stats-primary-quarter-select');
    const statsPrimaryQuarterYearSelect = document.getElementById('stats-primary-quarter-year-select');
    const statsSecondaryQuarterSelect = document.getElementById('stats-secondary-quarter-select');
    const statsSecondaryQuarterYearSelect = document.getElementById('stats-secondary-quarter-year-select');

    const PERIOD_MODES = Object.freeze({
        YEAR: 'year',
        MONTH: 'month',
        QUARTER: 'quarter',
        ROLLING_7: 'rolling7',
        ROLLING_30: 'rolling30',
        ROLLING_90: 'rolling90'
    });

    // Estado global de visualización
    let cachedNotes = [];
    let cachedSessions = [];
    let cachedTagsMap = new Map();
    let monthlyComparisonChart = null;
    let heatmapReferenceDate = getStartOfMonth(new Date());
    let activePeriodContext = null;
    let periodState = {
        mode: PERIOD_MODES.YEAR,
        yearPrimary: new Date().getFullYear(),
        yearSecondary: new Date().getFullYear() - 1,
        monthPrimaryYear: new Date().getFullYear(),
        monthPrimaryMonth: new Date().getMonth(),
        monthSecondaryYear: new Date().getFullYear() - 1,
        monthSecondaryMonth: new Date().getMonth(),
        quarterPrimaryYear: new Date().getFullYear(),
        quarterPrimaryQuarter: Math.floor(new Date().getMonth() / 3) + 1,
        quarterSecondaryYear: new Date().getFullYear() - 1,
        quarterSecondaryQuarter: Math.floor(new Date().getMonth() / 3) + 1,
        rollingDays: 7
    };

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

    function getStartOfDay(date) {
        const value = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    function getEndOfDay(date) {
        const value = getStartOfDay(date);
        value.setHours(23, 59, 59, 999);
        return value;
    }

    function getQuarterStartMonth(quarter) {
        const safeQuarter = Math.min(4, Math.max(1, Number(quarter) || 1));
        return (safeQuarter - 1) * 3;
    }

    function buildYearRange(year) {
        const safeYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
        return {
            start: getStartOfDay(new Date(safeYear, 0, 1)),
            end: getEndOfDay(new Date(safeYear, 11, 31))
        };
    }

    function buildMonthRange(year, month) {
        const safeYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
        const safeMonth = Math.min(11, Math.max(0, Number(month) || 0));
        return {
            start: getStartOfDay(new Date(safeYear, safeMonth, 1)),
            end: getEndOfDay(new Date(safeYear, safeMonth + 1, 0))
        };
    }

    function buildQuarterRange(year, quarter) {
        const safeYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
        const safeQuarter = Math.min(4, Math.max(1, Number(quarter) || 1));
        const startMonth = getQuarterStartMonth(safeQuarter);
        return {
            start: getStartOfDay(new Date(safeYear, startMonth, 1)),
            end: getEndOfDay(new Date(safeYear, startMonth + 3, 0))
        };
    }

    function buildRollingRange(days, anchorDate = new Date()) {
        const safeDays = Math.max(1, Number(days) || 1);
        const end = getEndOfDay(anchorDate);
        const start = getStartOfDay(new Date(end));
        start.setDate(start.getDate() - safeDays + 1);
        return { start, end };
    }

    function buildPreviousEquivalentRange(range) {
        if (!range || !(range.start instanceof Date) || !(range.end instanceof Date)) {
            return buildRollingRange(7);
        }
        const start = getStartOfDay(range.start);
        const end = getEndOfDay(range.end);
        const spanDays = Math.max(1, Math.round((getStartOfDay(end).getTime() - getStartOfDay(start).getTime()) / dayInMs) + 1);
        const previousEnd = getEndOfDay(new Date(start.getTime() - dayInMs));
        const previousStart = getStartOfDay(new Date(previousEnd));
        previousStart.setDate(previousStart.getDate() - spanDays + 1);
        return { start: previousStart, end: previousEnd };
    }

    function isDateInRange(date, range) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
        if (!range || !(range.start instanceof Date) || !(range.end instanceof Date)) return false;
        return date.getTime() >= range.start.getTime() && date.getTime() <= range.end.getTime();
    }

    function filterNotesByRange(notes, range) {
        if (!Array.isArray(notes) || !range) return [];
        return notes.filter((note) => {
            if (typeof note?.id !== 'number') return false;
            const noteDate = new Date(note.id);
            return isDateInRange(noteDate, range);
        });
    }

    function resolveSessionDate(session) {
        if (!session || typeof session !== 'object') return null;
        const numericTimestamp = Number(session.endTime);
        if (Number.isFinite(numericTimestamp)) {
            const byEndTime = new Date(numericTimestamp);
            if (!Number.isNaN(byEndTime.getTime())) return byEndTime;
        }
        if (typeof session.date === 'string') {
            const byDate = new Date(session.date);
            if (!Number.isNaN(byDate.getTime())) return byDate;
        }
        if (typeof session.updatedAt === 'string') {
            const byUpdatedAt = new Date(session.updatedAt);
            if (!Number.isNaN(byUpdatedAt.getTime())) return byUpdatedAt;
        }
        return null;
    }

    function filterSessionsByRange(sessions, range) {
        if (!Array.isArray(sessions) || !range) return [];
        return sessions.filter((session) => {
            const date = resolveSessionDate(session);
            return isDateInRange(date, range);
        });
    }

    function getAvailableYearsFromNotes(notes) {
        const years = new Set();
        if (Array.isArray(notes)) {
            notes.forEach((note) => {
                if (typeof note?.id !== 'number') return;
                const date = new Date(note.id);
                if (!Number.isNaN(date.getTime())) {
                    years.add(date.getFullYear());
                }
            });
        }
        if (years.size === 0) {
            const currentYear = new Date().getFullYear();
            years.add(currentYear);
            years.add(currentYear - 1);
        }
        return Array.from(years).sort((a, b) => b - a);
    }

    function formatMonthAndYear(year, month) {
        const safeMonth = Math.min(11, Math.max(0, Number(month) || 0));
        const safeYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
        return `${monthNames[safeMonth]} ${safeYear}`;
    }

    function formatQuarterAndYear(year, quarter) {
        const safeQuarter = Math.min(4, Math.max(1, Number(quarter) || 1));
        const safeYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
        return `Q${safeQuarter} ${safeYear}`;
    }

    function formatRangeLabel(range) {
        if (!range || !(range.start instanceof Date) || !(range.end instanceof Date)) return '--';
        const startLabel = range.start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');
        const endLabel = range.end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');
        return `${startLabel} - ${endLabel}`;
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
        if (statsPeriodActiveLabelEl) statsPeriodActiveLabelEl.textContent = 'Período activo: --';
        if (statsPeriodDistributionLabelEl) statsPeriodDistributionLabelEl.textContent = 'Período: --';
        if (statsCompareSubtitleEl) statsCompareSubtitleEl.textContent = 'Ajusta el período principal y el comparativo.';
    };

    const showEmptyState = (context = null) => {
        resetStats();
        if (notesListEmptyEl) {
            notesListEmptyEl.classList.remove('hidden');
            notesListEmptyEl.textContent = context
                ? `No hay notas en el período seleccionado (${context.primaryLabel}).`
                : defaultNotesEmptyText;
        }
        if (tagFrequencyEmptyEl) {
            tagFrequencyEmptyEl.classList.remove('hidden');
            tagFrequencyEmptyEl.textContent = context
                ? `No hay etiquetas en el período seleccionado (${context.primaryLabel}).`
                : defaultTagEmptyText;
        }
        heatmapReferenceDate = getStartOfMonth(new Date());
        refreshVisualizations('empty-state', cachedNotes, context || activePeriodContext);
    };

    // Renderizado de Subsecciones
    const renderNotesList = (notes, tagsMap) => {
        if (!notesListEl || !noteSummaryTemplate) return;
        notesListEl.innerHTML = '';

        if (!Array.isArray(notes) || notes.length === 0) {
            if (notesListEmptyEl) {
                notesListEmptyEl.classList.remove('hidden');
                notesListEmptyEl.textContent = defaultNotesEmptyText;
            }
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

    const updateOverview = (notes, tagsMap, sessions, context = null) => {
        const sessionList = Array.isArray(sessions) ? sessions : [];
        const totalDuration = sessionList.reduce((acc, session) => acc + (session.duration || 0), 0);
        const averageDuration = sessionList.length > 0 ? totalDuration / sessionList.length : 0;

        if (statsPeriodActiveLabelEl) {
            statsPeriodActiveLabelEl.textContent = context
                ? `Período activo: ${context.primaryLabel}`
                : 'Período activo: --';
        }
        if (statsPeriodDistributionLabelEl) {
            statsPeriodDistributionLabelEl.textContent = context
                ? `Período: ${context.primaryLabel}`
                : 'Período: --';
        }
        if (statsCompareSubtitleEl) {
            statsCompareSubtitleEl.textContent = context
                ? context.compareHint
                : 'Ajusta el período principal y el comparativo.';
        }

        if (totalSessionTimeEl) totalSessionTimeEl.textContent = formatDuration(totalDuration);
        if (averageSessionTimeEl) averageSessionTimeEl.textContent = formatDuration(averageDuration);

        if (!Array.isArray(notes) || notes.length === 0) {
            if (totalNotesCountEl) totalNotesCountEl.textContent = '0';
            if (averageNotesPerWeekEl) averageNotesPerWeekEl.textContent = '--';
            if (journalAgeEl) journalAgeEl.textContent = '--';
            if (averageWordsPerNoteEl) averageWordsPerNoteEl.textContent = '--';
            if (averageTagsPerNoteEl) averageTagsPerNoteEl.textContent = '--';
            if (notesTotalIndicatorEl) notesTotalIndicatorEl.textContent = '0';
            if (tagsTotalIndicatorEl) tagsTotalIndicatorEl.textContent = '0';
            if (topTimeRangeEl) topTimeRangeEl.textContent = '--:-- - --:--';
            if (topTimeRangeCountEl) topTimeRangeCountEl.textContent = 'Notas registradas en la franja: --';
            if (statsLastUpdateEl) {
                const label = context ? context.primaryLabel : '--';
                statsLastUpdateEl.textContent = `Actualizado: sin datos (${label})`;
            }

            renderNotesList([], tagsMap);
            renderTagFrequency([], tagsMap);
            applyDynamicThemeStyles();
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
            if (statsLastUpdateEl) {
                statsLastUpdateEl.textContent = context
                    ? `Actualizado (${context.primaryLabel}): ${formattedDate}`
                    : `Actualizado: ${formattedDate}`;
            }
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
    };

    const getRollingDaysFromMode = (mode) => {
        switch (mode) {
            case PERIOD_MODES.ROLLING_7:
                return 7;
            case PERIOD_MODES.ROLLING_30:
                return 30;
            case PERIOD_MODES.ROLLING_90:
                return 90;
            default:
                return periodState.rollingDays;
        }
    };

    const normalizePeriodState = () => {
        const years = getAvailableYearsFromNotes(cachedNotes);
        const latestYear = years[0] ?? new Date().getFullYear();
        const pickSecondaryYear = (primaryYear) => years.find((year) => year !== primaryYear) ?? primaryYear;

        if (!years.includes(periodState.yearPrimary)) {
            periodState.yearPrimary = latestYear;
        }
        if (!years.includes(periodState.yearSecondary)) {
            periodState.yearSecondary = pickSecondaryYear(periodState.yearPrimary);
        }

        if (!years.includes(periodState.monthPrimaryYear)) {
            periodState.monthPrimaryYear = latestYear;
        }
        if (!years.includes(periodState.monthSecondaryYear)) {
            periodState.monthSecondaryYear = pickSecondaryYear(periodState.monthPrimaryYear);
        }

        if (!years.includes(periodState.quarterPrimaryYear)) {
            periodState.quarterPrimaryYear = latestYear;
        }
        if (!years.includes(periodState.quarterSecondaryYear)) {
            periodState.quarterSecondaryYear = pickSecondaryYear(periodState.quarterPrimaryYear);
        }

        periodState.monthPrimaryMonth = Math.min(11, Math.max(0, Number(periodState.monthPrimaryMonth) || 0));
        periodState.monthSecondaryMonth = Math.min(11, Math.max(0, Number(periodState.monthSecondaryMonth) || 0));
        periodState.quarterPrimaryQuarter = Math.min(4, Math.max(1, Number(periodState.quarterPrimaryQuarter) || 1));
        periodState.quarterSecondaryQuarter = Math.min(4, Math.max(1, Number(periodState.quarterSecondaryQuarter) || 1));
        periodState.rollingDays = Math.max(1, Number(periodState.rollingDays) || 7);
    };

    const getMonthReferenceValue = (date) => date.getFullYear() * 12 + date.getMonth();

    const buildPeriodContext = () => {
        normalizePeriodState();
        const mode = periodState.mode;

        if (mode === PERIOD_MODES.YEAR) {
            const primaryRange = buildYearRange(periodState.yearPrimary);
            const secondaryRange = buildYearRange(periodState.yearSecondary);
            return {
                mode,
                primaryRange,
                secondaryRange,
                primaryLabel: `Año ${periodState.yearPrimary}`,
                secondaryLabel: `Año ${periodState.yearSecondary}`,
                activeLabel: `Año ${periodState.yearPrimary}`,
                compareHint: `Comparando Año ${periodState.yearPrimary} vs Año ${periodState.yearSecondary}.`,
                heatmapLimits: {
                    min: getStartOfMonth(primaryRange.start),
                    max: getStartOfMonth(new Date(periodState.yearPrimary, 11, 1)),
                    allowNavigation: true
                },
                meta: {
                    primaryYear: periodState.yearPrimary,
                    secondaryYear: periodState.yearSecondary
                }
            };
        }

        if (mode === PERIOD_MODES.MONTH) {
            const primaryRange = buildMonthRange(periodState.monthPrimaryYear, periodState.monthPrimaryMonth);
            const secondaryRange = buildMonthRange(periodState.monthSecondaryYear, periodState.monthSecondaryMonth);
            return {
                mode,
                primaryRange,
                secondaryRange,
                primaryLabel: formatMonthAndYear(periodState.monthPrimaryYear, periodState.monthPrimaryMonth),
                secondaryLabel: formatMonthAndYear(periodState.monthSecondaryYear, periodState.monthSecondaryMonth),
                activeLabel: `Mes ${formatMonthAndYear(periodState.monthPrimaryYear, periodState.monthPrimaryMonth)}`,
                compareHint: `Comparando ${formatMonthAndYear(periodState.monthPrimaryYear, periodState.monthPrimaryMonth)} vs ${formatMonthAndYear(periodState.monthSecondaryYear, periodState.monthSecondaryMonth)}.`,
                heatmapLimits: {
                    min: getStartOfMonth(primaryRange.start),
                    max: getStartOfMonth(primaryRange.start),
                    allowNavigation: false
                },
                meta: {
                    primaryYear: periodState.monthPrimaryYear,
                    primaryMonth: periodState.monthPrimaryMonth,
                    secondaryYear: periodState.monthSecondaryYear,
                    secondaryMonth: periodState.monthSecondaryMonth,
                    primaryDays: new Date(periodState.monthPrimaryYear, periodState.monthPrimaryMonth + 1, 0).getDate(),
                    secondaryDays: new Date(periodState.monthSecondaryYear, periodState.monthSecondaryMonth + 1, 0).getDate()
                }
            };
        }

        if (mode === PERIOD_MODES.QUARTER) {
            const primaryRange = buildQuarterRange(periodState.quarterPrimaryYear, periodState.quarterPrimaryQuarter);
            const secondaryRange = buildQuarterRange(periodState.quarterSecondaryYear, periodState.quarterSecondaryQuarter);
            const primaryQuarterStart = getQuarterStartMonth(periodState.quarterPrimaryQuarter);
            return {
                mode,
                primaryRange,
                secondaryRange,
                primaryLabel: formatQuarterAndYear(periodState.quarterPrimaryYear, periodState.quarterPrimaryQuarter),
                secondaryLabel: formatQuarterAndYear(periodState.quarterSecondaryYear, periodState.quarterSecondaryQuarter),
                activeLabel: `Trimestre ${formatQuarterAndYear(periodState.quarterPrimaryYear, periodState.quarterPrimaryQuarter)}`,
                compareHint: `Comparando ${formatQuarterAndYear(periodState.quarterPrimaryYear, periodState.quarterPrimaryQuarter)} vs ${formatQuarterAndYear(periodState.quarterSecondaryYear, periodState.quarterSecondaryQuarter)}.`,
                heatmapLimits: {
                    min: getStartOfMonth(new Date(periodState.quarterPrimaryYear, primaryQuarterStart, 1)),
                    max: getStartOfMonth(new Date(periodState.quarterPrimaryYear, primaryQuarterStart + 2, 1)),
                    allowNavigation: true
                },
                meta: {
                    primaryYear: periodState.quarterPrimaryYear,
                    primaryQuarter: periodState.quarterPrimaryQuarter,
                    secondaryYear: periodState.quarterSecondaryYear,
                    secondaryQuarter: periodState.quarterSecondaryQuarter
                }
            };
        }

        const rollingDays = getRollingDaysFromMode(mode);
        periodState.rollingDays = rollingDays;
        const primaryRange = buildRollingRange(rollingDays);
        const secondaryRange = buildPreviousEquivalentRange(primaryRange);
        const rollingHeatmapMonth = getStartOfMonth(primaryRange.end);
        return {
            mode,
            primaryRange,
            secondaryRange,
            primaryLabel: `Últimos ${rollingDays} días`,
            secondaryLabel: `${rollingDays} días anteriores`,
            activeLabel: `Últimos ${rollingDays} días`,
            compareHint: `Comparando los últimos ${rollingDays} días contra los ${rollingDays} días inmediatamente anteriores.`,
            heatmapLimits: {
                min: rollingHeatmapMonth,
                max: rollingHeatmapMonth,
                allowNavigation: false
            },
            meta: {
                rollingDays
            }
        };
    };

    const setSelectOptions = (selectEl, options, selectedValue) => {
        if (!selectEl) return;
        const selected = String(selectedValue);
        selectEl.innerHTML = '';
        options.forEach((option) => {
            const optionEl = document.createElement('option');
            optionEl.value = String(option.value);
            optionEl.textContent = option.label;
            selectEl.appendChild(optionEl);
        });
        const hasSelected = options.some((option) => String(option.value) === selected);
        selectEl.value = hasSelected
            ? selected
            : (options[0] ? String(options[0].value) : '');
    };

    const syncComparisonControls = () => {
        const years = getAvailableYearsFromNotes(cachedNotes);
        const yearOptions = years.map((year) => ({ value: year, label: String(year) }));
        const monthOptions = monthNames.map((monthLabel, index) => ({ value: index, label: monthLabel }));

        setSelectOptions(statsPrimaryYearSelect, yearOptions, periodState.yearPrimary);
        setSelectOptions(statsSecondaryYearSelect, yearOptions, periodState.yearSecondary);

        setSelectOptions(statsPrimaryMonthSelect, monthOptions, periodState.monthPrimaryMonth);
        setSelectOptions(statsSecondaryMonthSelect, monthOptions, periodState.monthSecondaryMonth);
        setSelectOptions(statsPrimaryMonthYearSelect, yearOptions, periodState.monthPrimaryYear);
        setSelectOptions(statsSecondaryMonthYearSelect, yearOptions, periodState.monthSecondaryYear);

        setSelectOptions(statsPrimaryQuarterYearSelect, yearOptions, periodState.quarterPrimaryYear);
        setSelectOptions(statsSecondaryQuarterYearSelect, yearOptions, periodState.quarterSecondaryYear);
        if (statsPrimaryQuarterSelect) statsPrimaryQuarterSelect.value = String(periodState.quarterPrimaryQuarter);
        if (statsSecondaryQuarterSelect) statsSecondaryQuarterSelect.value = String(periodState.quarterSecondaryQuarter);

        if (statsYearControlsEl) statsYearControlsEl.classList.toggle('hidden', periodState.mode !== PERIOD_MODES.YEAR);
        if (statsMonthControlsEl) statsMonthControlsEl.classList.toggle('hidden', periodState.mode !== PERIOD_MODES.MONTH);
        if (statsQuarterControlsEl) statsQuarterControlsEl.classList.toggle('hidden', periodState.mode !== PERIOD_MODES.QUARTER);
        if (statsRollingCompareInfoEl) {
            const isRollingMode = periodState.mode === PERIOD_MODES.ROLLING_7
                || periodState.mode === PERIOD_MODES.ROLLING_30
                || periodState.mode === PERIOD_MODES.ROLLING_90;
            statsRollingCompareInfoEl.classList.toggle('hidden', !isRollingMode);
        }

        statsPeriodPresetButtons.forEach((button) => {
            const isActive = button.dataset.periodMode === periodState.mode;
            button.classList.toggle('bg-blue-600', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('bg-slate-100', !isActive);
            button.classList.toggle('text-slate-700', !isActive);
            button.classList.toggle('hover:bg-slate-200', !isActive);
        });
    };

    const getHeatmapReferenceWithinLimits = (context) => {
        const limits = context?.heatmapLimits;
        let reference = heatmapReferenceDate instanceof Date && !Number.isNaN(heatmapReferenceDate.getTime())
            ? getStartOfMonth(heatmapReferenceDate)
            : getStartOfMonth(new Date());

        if (!limits || !(limits.min instanceof Date) || !(limits.max instanceof Date)) {
            return reference;
        }

        const value = getMonthReferenceValue(reference);
        const minValue = getMonthReferenceValue(limits.min);
        const maxValue = getMonthReferenceValue(limits.max);

        if (value < minValue) reference = getStartOfMonth(limits.min);
        if (value > maxValue) reference = getStartOfMonth(limits.max);

        return reference;
    };

    const applyHeatmapNavigationState = (context) => {
        const canNavigate = Boolean(context?.heatmapLimits?.allowNavigation);
        [notesHeatmapPrevBtn, notesHeatmapNextBtn].forEach((button) => {
            if (!button) return;
            button.disabled = !canNavigate;
            button.classList.toggle('opacity-40', !canNavigate);
            button.classList.toggle('cursor-not-allowed', !canNavigate);
        });
    };

    const buildComparisonData = (notes, context) => {
        const sourceNotes = Array.isArray(notes) ? notes : [];
        const primary = [];
        const secondary = [];
        let labels = [];

        if (context.mode === PERIOD_MODES.YEAR) {
            labels = [...monthNames];
            primary.push(...Array(12).fill(0));
            secondary.push(...Array(12).fill(0));

            sourceNotes.forEach((note) => {
                if (typeof note?.id !== 'number') return;
                const date = new Date(note.id);
                if (Number.isNaN(date.getTime())) return;
                const year = date.getFullYear();
                const month = date.getMonth();
                if (year === context.meta.primaryYear) {
                    primary[month] += 1;
                } else if (year === context.meta.secondaryYear) {
                    secondary[month] += 1;
                }
            });
        } else if (context.mode === PERIOD_MODES.MONTH) {
            const maxDays = Math.max(context.meta.primaryDays, context.meta.secondaryDays);
            labels = Array.from({ length: maxDays }, (_, index) => `${index + 1}`);
            primary.push(...Array(maxDays).fill(0));
            secondary.push(...Array(maxDays).fill(0));

            sourceNotes.forEach((note) => {
                if (typeof note?.id !== 'number') return;
                const date = new Date(note.id);
                if (Number.isNaN(date.getTime())) return;
                const dayIndex = date.getDate() - 1;
                if (dayIndex < 0 || dayIndex >= maxDays) return;
                if (date.getFullYear() === context.meta.primaryYear && date.getMonth() === context.meta.primaryMonth) {
                    primary[dayIndex] += 1;
                } else if (date.getFullYear() === context.meta.secondaryYear && date.getMonth() === context.meta.secondaryMonth) {
                    secondary[dayIndex] += 1;
                }
            });
        } else if (context.mode === PERIOD_MODES.QUARTER) {
            labels = ['Mes 1', 'Mes 2', 'Mes 3'];
            primary.push(...Array(3).fill(0));
            secondary.push(...Array(3).fill(0));
            const primaryStartMonth = getQuarterStartMonth(context.meta.primaryQuarter);
            const secondaryStartMonth = getQuarterStartMonth(context.meta.secondaryQuarter);

            sourceNotes.forEach((note) => {
                if (typeof note?.id !== 'number') return;
                const date = new Date(note.id);
                if (Number.isNaN(date.getTime())) return;
                const year = date.getFullYear();
                const month = date.getMonth();

                if (year === context.meta.primaryYear && month >= primaryStartMonth && month <= primaryStartMonth + 2) {
                    primary[month - primaryStartMonth] += 1;
                } else if (year === context.meta.secondaryYear && month >= secondaryStartMonth && month <= secondaryStartMonth + 2) {
                    secondary[month - secondaryStartMonth] += 1;
                }
            });
        } else {
            const rollingDays = context.meta.rollingDays;
            labels = Array.from({ length: rollingDays }, (_, index) => {
                const date = new Date(context.primaryRange.start);
                date.setDate(date.getDate() + index);
                return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace(/\./g, '');
            });
            primary.push(...Array(rollingDays).fill(0));
            secondary.push(...Array(rollingDays).fill(0));

            const primaryStartValue = getStartOfDay(context.primaryRange.start).getTime();
            const secondaryStartValue = getStartOfDay(context.secondaryRange.start).getTime();

            sourceNotes.forEach((note) => {
                if (typeof note?.id !== 'number') return;
                const date = new Date(note.id);
                if (Number.isNaN(date.getTime())) return;
                const normalizedDate = getStartOfDay(date).getTime();

                if (isDateInRange(date, context.primaryRange)) {
                    const index = Math.floor((normalizedDate - primaryStartValue) / dayInMs);
                    if (index >= 0 && index < rollingDays) primary[index] += 1;
                } else if (isDateInRange(date, context.secondaryRange)) {
                    const index = Math.floor((normalizedDate - secondaryStartValue) / dayInMs);
                    if (index >= 0 && index < rollingDays) secondary[index] += 1;
                }
            });
        }

        return {
            labels,
            primary,
            secondary,
            primaryLabel: context.primaryLabel,
            secondaryLabel: context.secondaryLabel
        };
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

    const renderMonthlyComparisonChart = (notes, context) => {
        if (!monthlyComparisonCanvas || typeof Chart !== 'function') return;
        hideStatusMessage(monthlyComparisonMessageEl);
        const data = buildComparisonData(notes, context);
        const totalCurrent = data.primary.reduce((acc, value) => acc + value, 0);
        const totalPrevious = data.secondary.reduce((acc, value) => acc + value, 0);
        const colors = getMonthlyChartColors();

        if (totalCurrent === 0 && totalPrevious === 0) {
            showStatusMessage(monthlyComparisonMessageEl, `No hay datos para la comparación seleccionada (${context.primaryLabel} vs ${context.secondaryLabel}).`, 'info');
            if (monthlyComparisonChart) {
                monthlyComparisonChart.destroy();
                monthlyComparisonChart = null;
            }
            return;
        }

        const isRollingMode = context.mode === PERIOD_MODES.ROLLING_7
            || context.mode === PERIOD_MODES.ROLLING_30
            || context.mode === PERIOD_MODES.ROLLING_90;

        const config = {
            type: isRollingMode ? 'line' : 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: data.primaryLabel,
                        data: data.primary,
                        backgroundColor: colors.current,
                        borderColor: colors.currentBorder,
                        borderWidth: 1.5,
                        borderRadius: 6,
                        maxBarThickness: isRollingMode ? 12 : 32,
                        pointRadius: isRollingMode ? 2 : 0,
                        tension: isRollingMode ? 0.25 : 0
                    },
                    {
                        label: data.secondaryLabel,
                        data: data.secondary,
                        backgroundColor: colors.previous,
                        borderColor: colors.previousBorder,
                        borderWidth: 1.5,
                        borderRadius: 6,
                        maxBarThickness: isRollingMode ? 12 : 32,
                        pointRadius: isRollingMode ? 2 : 0,
                        tension: isRollingMode ? 0.25 : 0
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
                        ticks: {
                            color: colors.ticks,
                            font: { family: 'Inter' },
                            maxRotation: isRollingMode ? 0 : 50,
                            autoSkip: true,
                            maxTicksLimit: isRollingMode ? 12 : data.labels.length
                        }
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

    let refreshVisualizations = (reason = '', notes = cachedNotes, context = activePeriodContext) => {
        if (!Array.isArray(notes)) notes = cachedNotes;
        if (!context) return;
        try {
            renderMonthlyComparisonChart(notes, context);
        } catch (error) {
            console.error('Error al actualizar el gráfico mensual.', error);
            showStatusMessage(monthlyComparisonMessageEl, 'No fue posible actualizar el gráfico mensual.', 'error');
        }

        try {
            const filteredForHeatmap = filterNotesByRange(notes, context.primaryRange);
            const reference = getHeatmapReferenceWithinLimits(context);
            heatmapReferenceDate = reference;
            renderNotesHeatmap(filteredForHeatmap, reference);
            applyHeatmapNavigationState(context);
        } catch (error) {
            console.error('Error al actualizar el mapa de calor.', error);
            showStatusMessage(notesHeatmapMessageEl, 'No fue posible actualizar el mapa de calor.', 'error');
        }
    };

    const syncStatisticsView = (reason = 'state-update') => {
        activePeriodContext = buildPeriodContext();
        syncComparisonControls();

        const primaryNotes = filterNotesByRange(cachedNotes, activePeriodContext.primaryRange);
        const primarySessions = filterSessionsByRange(cachedSessions, activePeriodContext.primaryRange);

        if (reason !== 'month-navigation') {
            if (primaryNotes.length > 0) {
                const latestNote = primaryNotes.reduce((latest, note) => (note.id > latest.id ? note : latest), primaryNotes[0]);
                heatmapReferenceDate = getStartOfMonth(new Date(latestNote.id));
            } else {
                heatmapReferenceDate = getStartOfMonth(activePeriodContext.primaryRange.end);
            }
        }

        heatmapReferenceDate = getHeatmapReferenceWithinLimits(activePeriodContext);
        updateOverview(primaryNotes, cachedTagsMap, primarySessions, activePeriodContext);
        refreshVisualizations(reason, cachedNotes, activePeriodContext);
    };

    const handleMonthNavigation = (delta) => {
        if (!activePeriodContext?.heatmapLimits?.allowNavigation) return;
        const baseDate = heatmapReferenceDate instanceof Date && !Number.isNaN(heatmapReferenceDate.getTime())
            ? new Date(heatmapReferenceDate)
            : getStartOfMonth(new Date());
        baseDate.setMonth(baseDate.getMonth() + delta);
        const candidate = getStartOfMonth(baseDate);
        const minValue = getMonthReferenceValue(activePeriodContext.heatmapLimits.min);
        const maxValue = getMonthReferenceValue(activePeriodContext.heatmapLimits.max);
        const candidateValue = getMonthReferenceValue(candidate);
        if (candidateValue < minValue || candidateValue > maxValue) {
            return;
        }
        heatmapReferenceDate = candidate;
        syncStatisticsView('month-navigation');
    };

    if (notesHeatmapPrevBtn) {
        notesHeatmapPrevBtn.addEventListener('click', () => handleMonthNavigation(-1));
    }
    if (notesHeatmapNextBtn) {
        notesHeatmapNextBtn.addEventListener('click', () => handleMonthNavigation(1));
    }

    const initializePeriodStateFromNotes = (notes) => {
        const source = Array.isArray(notes) ? notes.filter(note => typeof note?.id === 'number') : [];
        const latestDate = source.length > 0
            ? new Date(source.reduce((latest, note) => Math.max(latest, note.id), source[0].id))
            : new Date();
        const latestYear = latestDate.getFullYear();
        const latestMonth = latestDate.getMonth();
        const latestQuarter = Math.floor(latestMonth / 3) + 1;

        periodState = {
            ...periodState,
            yearPrimary: latestYear,
            yearSecondary: latestYear - 1,
            monthPrimaryYear: latestYear,
            monthPrimaryMonth: latestMonth,
            monthSecondaryYear: latestYear - 1,
            monthSecondaryMonth: latestMonth,
            quarterPrimaryYear: latestYear,
            quarterPrimaryQuarter: latestQuarter,
            quarterSecondaryYear: latestYear - 1,
            quarterSecondaryQuarter: latestQuarter,
            rollingDays: getRollingDaysFromMode(periodState.mode)
        };
        normalizePeriodState();
    };

    statsPeriodPresetButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const mode = button.dataset.periodMode;
            if (!mode) return;
            periodState.mode = mode;
            if (mode === PERIOD_MODES.ROLLING_7 || mode === PERIOD_MODES.ROLLING_30 || mode === PERIOD_MODES.ROLLING_90) {
                periodState.rollingDays = getRollingDaysFromMode(mode);
            }
            syncStatisticsView('preset-change');
        });
    });

    statsPrimaryYearSelect?.addEventListener('change', () => {
        periodState.yearPrimary = Number(statsPrimaryYearSelect.value);
        syncStatisticsView('year-primary-change');
    });

    statsSecondaryYearSelect?.addEventListener('change', () => {
        periodState.yearSecondary = Number(statsSecondaryYearSelect.value);
        syncStatisticsView('year-secondary-change');
    });

    statsPrimaryMonthSelect?.addEventListener('change', () => {
        periodState.monthPrimaryMonth = Number(statsPrimaryMonthSelect.value);
        syncStatisticsView('month-primary-change');
    });

    statsPrimaryMonthYearSelect?.addEventListener('change', () => {
        periodState.monthPrimaryYear = Number(statsPrimaryMonthYearSelect.value);
        syncStatisticsView('month-primary-year-change');
    });

    statsSecondaryMonthSelect?.addEventListener('change', () => {
        periodState.monthSecondaryMonth = Number(statsSecondaryMonthSelect.value);
        syncStatisticsView('month-secondary-change');
    });

    statsSecondaryMonthYearSelect?.addEventListener('change', () => {
        periodState.monthSecondaryYear = Number(statsSecondaryMonthYearSelect.value);
        syncStatisticsView('month-secondary-year-change');
    });

    statsPrimaryQuarterSelect?.addEventListener('change', () => {
        periodState.quarterPrimaryQuarter = Number(statsPrimaryQuarterSelect.value);
        syncStatisticsView('quarter-primary-change');
    });

    statsPrimaryQuarterYearSelect?.addEventListener('change', () => {
        periodState.quarterPrimaryYear = Number(statsPrimaryQuarterYearSelect.value);
        syncStatisticsView('quarter-primary-year-change');
    });

    statsSecondaryQuarterSelect?.addEventListener('change', () => {
        periodState.quarterSecondaryQuarter = Number(statsSecondaryQuarterSelect.value);
        syncStatisticsView('quarter-secondary-change');
    });

    statsSecondaryQuarterYearSelect?.addEventListener('change', () => {
        periodState.quarterSecondaryYear = Number(statsSecondaryQuarterYearSelect.value);
        syncStatisticsView('quarter-secondary-year-change');
    });
    
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

                    cachedNotes = notes;
                    cachedTagsMap = tagsMap;
                    cachedSessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];

                    initializePeriodStateFromNotes(cachedNotes);
                    syncStatisticsView('data-load');
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
        if (!db.objectStoreNames.contains('editHistory')) {
            const historyStore = db.createObjectStore('editHistory', { keyPath: 'id', autoIncrement: true });
            historyStore.createIndex('noteHistoryId', 'noteHistoryId', { unique: false });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
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
