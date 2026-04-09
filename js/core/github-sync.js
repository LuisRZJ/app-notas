/**
 * GitHubSync — Módulo cliente para sincronización con el repositorio privado de GitHub
 *
 * Las funciones aquí solo se comunican con el endpoint /api/backup (Vercel Serverless).
 * Nunca acceden directamente a GitHub desde el navegador; el token de GitHub
 * permanece exclusivamente en el servidor.
 *
 * Uso desde app.js:
 *   await window.GitHubSync.backup(data, apiSecret)
 *   const data = await window.GitHubSync.restore(apiSecret)
 */

const GitHubSync = {
    /**
     * Respalda el snapshot completo de datos en GitHub.
     * @param {{ notes: any[], tags: any[], settings: object, sessions: any[] }} data
     * @param {string} apiSecret - API Secret configurado en el panel de Ajustes
     * @returns {Promise<{ success: boolean, timestamp: string }>}
     */
    async backup(data, apiSecret) {
        const response = await fetch('/api/backup', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiSecret}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || `Error ${response.status} al respaldar.`);
        }

        return response.json();
    },

    /**
     * Restaura el snapshot completo de datos desde GitHub.
     * @param {string} apiSecret - API Secret configurado en el panel de Ajustes
     * @returns {Promise<{ notes: any[], tags: any[], settings: object, sessions: any[], backedUpAt: string }>}
     */
    async restore(apiSecret) {
        const response = await fetch('/api/backup', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiSecret}`
            }
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || `Error ${response.status} al restaurar.`);
        }

        return response.json();
    }
};

window.GitHubSync = GitHubSync;
