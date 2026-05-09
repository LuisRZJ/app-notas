/**
 * NoteMarkdown - Renderizado Markdown seguro para contenido de notas.
 * Requiere marked + DOMPurify; si no estan disponibles, usa fallback de texto escapado.
 */
(function () {
    const hasMarked = () => Boolean(window.marked && typeof window.marked.parse === 'function');
    const hasPurify = () => Boolean(window.DOMPurify && typeof window.DOMPurify.sanitize === 'function');

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const fallbackRender = (rawText) => escapeHtml(rawText).replace(/\n/g, '<br>');

    const MARKDOWN_ALLOWED_TAGS = [
        'p', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
        'ul', 'ol', 'li',
        'code', 'pre',
        'a',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ];

    const MARKDOWN_ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

    const ALLOWED_URI_REGEXP = /^(?:(?:(?:https?|mailto|tel|sms):)|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;

    const render = (value) => {
        const rawText = String(value ?? '');

        if (!hasMarked() || !hasPurify()) {
            return fallbackRender(rawText);
        }

        let parsed = '';
        try {
            parsed = window.marked.parse(rawText, {
                gfm: true,
                breaks: true,
                mangle: false,
                headerIds: false
            });
        } catch (error) {
            console.warn('[NoteMarkdown] Error parseando markdown:', error);
            return fallbackRender(rawText);
        }

        try {
            return window.DOMPurify.sanitize(parsed, {
                ALLOWED_TAGS: MARKDOWN_ALLOWED_TAGS,
                ALLOWED_ATTR: MARKDOWN_ALLOWED_ATTR,
                ALLOW_DATA_ATTR: false,
                ALLOWED_URI_REGEXP: ALLOWED_URI_REGEXP,
                FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
                FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload']
            });
        } catch (error) {
            console.warn('[NoteMarkdown] Error sanitizando markdown:', error);
            return fallbackRender(rawText);
        }
    };

    const renderInto = (element, value) => {
        if (!element) return;
        element.innerHTML = render(value);
    };

    window.NoteMarkdown = Object.freeze({
        render,
        renderInto,
        escapeHtml,
        hasEngine: () => hasMarked() && hasPurify()
    });
})();
