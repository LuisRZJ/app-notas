/**
 * Vercel Serverless Function: /api/backup
 *
 * GET  /api/backup  → Lee los 4 archivos JSON desde el repositorio privado de GitHub
 * PUT  /api/backup  → Escribe el snapshot completo en el repositorio privado de GitHub
 *
 * Requiere las siguientes variables de entorno en Vercel:
 *   GITHUB_TOKEN      → Personal Access Token con permisos de lectura/escritura en el repo
 *   GITHUB_OWNER_REPO → "LuisRZJ/Base-de-datos-app-notas"
 *   API_SECRET        → Cadena aleatoria larga que el usuario introduce una vez en la app
 */

const GITHUB_OWNER = 'LuisRZJ';
const GITHUB_REPO = 'Base-de-datos-app-notas';
const DATA_PATH = 'data';
const FILES = ['notes', 'tags', 'settings', 'sessions'];

/**
 * Cabeceras comunes para la GitHub Contents API
 */
function githubHeaders(token) {
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'notes-app-backup'
    };
}

/**
 * Lee un archivo JSON desde GitHub.
 * Devuelve { content, sha } o { content: null, sha: null } si no existe.
 */
async function readFile(name, token) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}/${name}.json`;
    const res = await fetch(url, { headers: githubHeaders(token) });

    if (res.status === 404) return { content: null, sha: null };
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`GitHub read error for ${name}.json: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    const decoded = Buffer.from(data.content, 'base64').toString('utf8');
    return { content: JSON.parse(decoded), sha: data.sha };
}

/**
 * Escribe (crea o actualiza) un archivo JSON en GitHub.
 * Gestiona automáticamente el SHA para actualizaciones.
 */
async function writeFile(name, payload, sha, token) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}/${name}.json`;
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
    const body = {
        message: `backup: update ${name}.json [${new Date().toISOString()}]`,
        content,
        ...(sha ? { sha } : {})
    };

    const res = await fetch(url, {
        method: 'PUT',
        headers: githubHeaders(token),
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`GitHub write error for ${name}.json: ${err.message || res.statusText}`);
    }
}

module.exports = async function handler(req, res) {
    // CORS para que el navegador pueda llamar desde el dominio de Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verificar API_SECRET
    const authHeader = req.headers['authorization'];
    const expectedSecret = process.env.API_SECRET;

    if (!expectedSecret) {
        return res.status(500).json({ error: 'API_SECRET no configurado en las variables de entorno de Vercel.' });
    }
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ error: 'No autorizado. Verifica tu API Secret en Ajustes.' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'GITHUB_TOKEN no configurado en las variables de entorno de Vercel.' });
    }

    // ─── GET: Leer datos desde GitHub ────────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            // Modo ligero: solo devuelve el timestamp del último respaldo
            if (req.query.meta === '1') {
                const { content } = await readFile('settings', GITHUB_TOKEN);
                return res.status(200).json({ backedUpAt: content?.__backedUpAt ?? null });
            }

            const result = {};
            for (const name of FILES) {
                const { content } = await readFile(name, GITHUB_TOKEN);
                // Si el archivo no existe aún, devolvemos valor vacío por defecto
                result[name] = content ?? (name === 'settings' ? {} : []);
            }
            // Extraer __backedUpAt de settings antes de devolverlo al cliente
            const { __backedUpAt, ...cleanSettings } = result.settings || {};
            result.settings = cleanSettings;
            result.backedUpAt = __backedUpAt ?? null;
            return res.status(200).json(result);
        } catch (error) {
            console.error('[backup:GET]', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ─── PUT: Escribir datos en GitHub ───────────────────────────────────────────
    if (req.method === 'PUT') {
        try {
            const { notes = [], tags = [], settings = {}, sessions = [] } = req.body;
            const timestamp = new Date().toISOString();
            // Inyectar __backedUpAt en settings para que otros dispositivos puedan
            // detectar si la nube tiene datos más recientes que los locales.
            const payload = { notes, tags, settings: { __backedUpAt: timestamp, ...settings }, sessions };

            // Escribir archivos de forma secuencial: cada PUT espera
            // a que el anterior termine, evitando conflictos de SHA.
            for (const name of FILES) {
                const { sha } = await readFile(name, GITHUB_TOKEN);
                await writeFile(name, payload[name], sha, GITHUB_TOKEN);
            }

            return res.status(200).json({ success: true, timestamp });
        } catch (error) {
            console.error('[backup:PUT]', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Método no permitido.' });
};
