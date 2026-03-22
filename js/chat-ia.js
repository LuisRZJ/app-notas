'use strict';

/**
 * OpenRouterChatApp — Lógica exclusiva de la página chat-ia.html
 * El manejo del tema oscuro lo realiza app.js (raíz) de manera global.
 */
class OpenRouterChatApp {
    constructor() {
        this.conversations = this.loadConversations();
        this.settings = this.loadSettings();
        this.apiKey = this.settings.apiKey || '';
        this.currentConversationId = null;
        this.conversationIdToDelete = null;
        this.initializeElements();
        this.setupEventListeners();

        // Redirigir a ajustes si no hay API Key
        if (!this.apiKey) {
            this.showScreen('settings');
            alert('Por favor, configura tu API Key de Gemini para comenzar.');
        } else {
            this.showScreen('home');
        }
    }

    // --- Inicialización y Manejo de DOM ---
    initializeElements() {
        this.homeScreen = document.getElementById('home-screen');
        this.chatScreen = document.getElementById('chat-screen');
        this.settingsScreen = document.getElementById('settings-screen');

        this.conversationsList = document.getElementById('conversations-list');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.backToHomeBtn = document.getElementById('back-to-home-btn');
        this.goToSettingsBtn = document.getElementById('go-to-settings-btn');
        this.backFromSettingsBtn = document.getElementById('back-from-settings-btn');
        this.deleteDataBtn = document.getElementById('delete-data-btn');

        // Elementos de ajustes
        this.settingsModelSelector = document.getElementById('settings-model-selector');
        this.settingsApiKeyInput = document.getElementById('settings-api-key');
        this.convoCountSpan = document.getElementById('convo-count');
        this.storageSizeSpan = document.getElementById('storage-size');

        // Elementos del Modal
        this.confirmModal = document.getElementById('confirm-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalText = document.getElementById('modal-text');
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');

        // Elementos del chat
        this.chatContainer = this.chatScreen ? this.chatScreen.querySelector('.chat-container') : null;
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicatorTemplate = document.getElementById('typing-indicator-template');
        this.status = document.getElementById('status');
    }

    setupEventListeners() {
        if (this.newChatBtn) this.newChatBtn.addEventListener('click', () => this.startNewChat());
        if (this.backToHomeBtn) this.backToHomeBtn.addEventListener('click', () => this.showScreen('home'));
        if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.sendMessage());
        if (this.userInput) {
            this.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.userInput.addEventListener('input', () => this.updateSendButtonState());
        }
        if (this.goToSettingsBtn) this.goToSettingsBtn.addEventListener('click', () => this.showScreen('settings'));
        if (this.backFromSettingsBtn) {
            this.backFromSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
                this.showScreen('home');
            });
        }
        if (this.deleteDataBtn) this.deleteDataBtn.addEventListener('click', () => this.showDeleteConfirmation(null));
        if (this.cancelDeleteBtn) this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmation());
        if (this.confirmDeleteBtn) this.confirmDeleteBtn.addEventListener('click', () => this.handleDelete());
    }

    updateSendButtonState() {
        if (this.sendBtn && this.userInput) {
            this.sendBtn.disabled = this.userInput.value.trim() === '';
        }
    }

    // --- Manejo de Pantallas ---
    showScreen(screenName) {
        if (this.homeScreen) this.homeScreen.classList.add('hidden');
        if (this.chatScreen) this.chatScreen.classList.add('hidden');
        if (this.settingsScreen) this.settingsScreen.classList.add('hidden');

        if (screenName === 'home') {
            if (this.homeScreen) this.homeScreen.classList.remove('hidden');
            this.renderConversationsList();
        } else if (screenName === 'chat') {
            if (this.chatScreen) this.chatScreen.classList.remove('hidden');
        } else if (screenName === 'settings') {
            if (this.settingsModelSelector) this.settingsModelSelector.value = this.settings.defaultModel;
            if (this.settingsApiKeyInput) this.settingsApiKeyInput.value = this.settings.apiKey || '';
            this.updateStorageSummary();
            if (this.settingsScreen) this.settingsScreen.classList.remove('hidden');
        }
    }

    // --- Lógica del Historial ---
    renderConversationsList() {
        if (!this.conversationsList) return;
        this.conversationsList.innerHTML = '';
        if (this.conversations.length === 0) {
            this.conversationsList.innerHTML = `<div class="text-center text-gray-500 mt-8">
                <p>No hay conversaciones guardadas.</p>
                <p>Haz clic en "Nuevo Chat" para comenzar.</p>
            </div>`;
            return;
        }

        const sortedConversations = this.conversations.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        sortedConversations.forEach(convo => {
            const convoElement = document.createElement('div');
            convoElement.className = 'bg-white p-4 rounded-lg shadow-sm border border-orange-200 cursor-pointer hover:shadow-md hover:border-orange-400 transition-all flex justify-between items-center';
            convoElement.dataset.id = convo.id;
            convoElement.innerHTML = `
                <div>
                    <h3 class="font-bold text-orange-800">${convo.title}</h3>
                    <p class="text-sm text-gray-500">${convo.history.length} mensajes</p>
                    <p class="text-xs text-gray-400">Última vez: ${new Date(convo.lastUpdated).toLocaleString()}</p>
                </div>
                <button class="delete-btn text-gray-400 hover:text-red-500 p-2 rounded-full" data-id="${convo.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            convoElement.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    this.openConversation(convo.id);
                }
            });
            convoElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteConfirmation(convo.id);
            });
            this.conversationsList.appendChild(convoElement);
        });
    }

    startNewChat() {
        if (!this.apiKey) {
            alert('Debes configurar tu API Key antes de iniciar un chat.');
            this.showScreen('settings');
            return;
        }
        this.currentConversationId = null;
        if (this.chatContainer) this.chatContainer.innerHTML = '<div class="space-y-4"></div>';
        const modelName = this.settingsModelSelector
            ? this.settingsModelSelector.options[this.settingsModelSelector.selectedIndex].text
            : this.settings.defaultModel;

        const headingEl = document.getElementById('chat-screen-heading');
        if (headingEl) headingEl.textContent = 'Nuevo Chat';

        if (this.status) this.status.textContent = `Nuevo chat con ${modelName}`;
        this.addMessageToChat(`¡Hola! Soy ${modelName}. ¿En qué puedo ayudarte hoy?`, 'ai');
        this.showScreen('chat');
        if (this.userInput) this.userInput.focus();
        this.updateSendButtonState();
    }

    openConversation(id) {
        const conversation = this.conversations.find(c => c.id === id);
        if (!conversation) return;

        this.currentConversationId = id;
        if (this.chatContainer) this.chatContainer.innerHTML = '<div class="space-y-4"></div>';
        conversation.history.forEach(turn => this.addMessageToChat(turn.message, turn.sender, true));

        const modelOption = this.settingsModelSelector
            ? Array.from(this.settingsModelSelector.options).find(opt => opt.value === conversation.model)
            : null;
        const modelName = modelOption ? modelOption.text : conversation.model;

        const headingEl = document.getElementById('chat-screen-heading');
        if (headingEl) headingEl.textContent = conversation.title || 'Chat con Gemini';

        if (this.status) this.status.textContent = `Continuando chat con ${modelName}`;
        this.showScreen('chat');
        this.updateSendButtonState();
    }

    // --- Lógica de Eliminación ---
    showDeleteConfirmation(id = null) {
        this.conversationIdToDelete = id;
        if (id) {
            if (this.modalTitle) this.modalTitle.textContent = '¿Eliminar Conversación?';
            if (this.modalText) this.modalText.textContent = 'Esta acción es irreversible y eliminará esta conversación permanentemente.';
        } else {
            if (this.modalTitle) this.modalTitle.textContent = '¿Eliminar Todos los Datos?';
            if (this.modalText) this.modalText.textContent = 'Esta acción es irreversible y eliminará TODAS tus conversaciones y ajustes.';
        }
        if (this.confirmModal) this.confirmModal.classList.remove('hidden');
    }

    hideDeleteConfirmation() {
        this.conversationIdToDelete = null;
        if (this.confirmModal) this.confirmModal.classList.add('hidden');
    }

    handleDelete() {
        if (this.conversationIdToDelete) {
            this.conversations = this.conversations.filter(c => c.id !== this.conversationIdToDelete);
            this.saveConversations();
            this.renderConversationsList();
        } else {
            localStorage.removeItem('openrouter-chat-conversations');
            localStorage.removeItem('openrouter-chat-settings');
            this.conversations = [];
            this.settings = this.loadSettings();
            this.currentConversationId = null;
            this.showScreen('home');
        }
        this.hideDeleteConfirmation();
    }

    // --- Lógica del Chat ---
    async sendMessage() {
        if (!this.userInput) return;
        const message = this.userInput.value.trim();
        if (!message) return;

        this.toggleInput(true);
        this.addMessageToChat(message, 'user');
        this.userInput.value = '';
        this.updateSendButtonState();
        this.showTypingIndicator();

        let currentConvo;
        if (this.currentConversationId === null) {
            this.currentConversationId = `convo_${Date.now()}`;
            currentConvo = {
                id: this.currentConversationId,
                title: 'Nueva Conversación...',
                model: this.settings.defaultModel,
                history: [{ sender: 'user', message }],
                lastUpdated: new Date().toISOString()
            };
            this.conversations.push(currentConvo);
        } else {
            currentConvo = this.conversations.find(c => c.id === this.currentConversationId);
            currentConvo.history.push({ sender: 'user', message });
            currentConvo.lastUpdated = new Date().toISOString();
        }

        try {
            const responseText = await this.callOpenRouterAPI(currentConvo.history, currentConvo.model);
            this.hideTypingIndicator();
            this.addMessageToChat(responseText, 'ai');
            currentConvo.history.push({ sender: 'ai', message: responseText });

            if (currentConvo.history.length === 2) {
                try {
                    const newTitle = await this.generateConversationTitle(message, responseText, currentConvo.model);
                    if (newTitle && newTitle.length > 3) {
                        currentConvo.title = newTitle;
                        const headingEl = document.getElementById('chat-screen-heading');
                        if (headingEl) headingEl.textContent = newTitle;
                    } else {
                        const words = message.split(' ').slice(0, 5).join(' ');
                        currentConvo.title = words + (message.split(' ').length > 5 ? '...' : '');
                    }
                } catch (titleError) {
                    console.error('Fallo al generar título:', titleError);
                    const words = message.split(' ').slice(0, 5).join(' ');
                    currentConvo.title = words + (message.split(' ').length > 5 ? '...' : '');
                }
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat(`Lo siento, ocurrió un error: ${error.message}.`, 'ai');
            console.error('Error:', error);
        } finally {
            this.toggleInput(false);
            this.saveConversations();
            
            // Restablecer el estado "Procesando resultados..." u "Buscando en el diario..."
            if (this.status && currentConvo && currentConvo.model) {
                const modelOption = this.settingsModelSelector
                    ? Array.from(this.settingsModelSelector.options).find(opt => opt.value === currentConvo.model)
                    : null;
                const modelName = modelOption ? modelOption.text : currentConvo.model;
                this.status.textContent = `Chat con ${modelName}`;
            }
        }
    }

    async generateConversationTitle(userMessage, aiResponse, model = 'mistralai/mistral-small-24b-instruct-2501') {
        const titleModel = 'mistralai/mistral-small-24b-instruct-2501';
        const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
        const systemPrompt = `Actúa como un sintetizador de títulos. 
Analiza este intercambio y crea un título ÚNICO, creativo y breve (máximo 4 palabras) que resuma el TEMA, NO repitas la pregunta del usuario.
Responde solo con el texto del título, sin comillas ni puntos finales.`;

        const requestBody = {
            model: titleModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Usuario: "${userMessage.substring(0, 500)}"\nIA: "${aiResponse.substring(0, 500)}"` }
            ],
            temperature: 0.7,
            max_tokens: 20
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-OpenRouter-Title': 'App Notas Diario'
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) return null;
            const data = await response.json();
            let title = data.choices?.[0]?.message?.content?.trim();
            if (!title) return null;
            return title.replace(/["'*#]/g, '').replace(/\.$/, '').substring(0, 50);
        } catch (e) {
            console.error('Error en generateConversationTitle:', e);
            return null;
        }
    }

    async fetchContextData() {
        const DB_NAME = 'NotesDB';
        const DB_VERSION = 7;
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => resolve({ notes: [], sessions: [] });
            request.onsuccess = (event) => {
                const db = event.target.result;
                const context = { notes: [], sessions: [] };
                const getAllFromStore = (storeName) => new Promise((res) => {
                    if (!db.objectStoreNames.contains(storeName)) { res([]); return; }
                    const tx = db.transaction(storeName, 'readonly');
                    const req = tx.objectStore(storeName).getAll();
                    req.onsuccess = () => res(req.result);
                    req.onerror = () => res([]);
                });
                Promise.all([getAllFromStore('notes'), getAllFromStore('sessions')])
                    .then(([notes, sessions]) => {
                        context.notes = notes;
                        context.sessions = sessions;
                        db.close();
                        resolve(context);
                    })
                    .catch(() => { db.close(); resolve(context); });
            };
        });
    }

    async executeToolSearchByKeyWord(query, contextData) {
        console.log(`Herramienta invocada: buscar por palabra clave "${query}"`);
        const { notes } = contextData;
        if (!notes || notes.length === 0) return "No hay notas guardadas.";
        
        const q = query.toLowerCase();
        const matches = notes.filter(n => 
            (n.title && n.title.toLowerCase().includes(q)) || 
            (n.content && n.content.toLowerCase().includes(q))
        );
        
        if (matches.length === 0) return `No se encontraron notas con la palabra clave: ${query}`;
        
        // Limitar a las 10 mejores coincidencias para no exceder tokens
        const topMatches = matches.slice(0, 10);
        let resultString = `Se encontraron ${matches.length} notas (mostrando las ${topMatches.length} más relevantes):\n`;
        topMatches.forEach((note, i) => {
            const date = new Date(note.id).toLocaleString('es-ES');
            resultString += `\n[Nota ${i+1}]\nFecha: ${date}\nTítulo: ${note.title || 'Sin título'}\nContenido:\n${note.content.substring(0, 500)}...\n`;
        });
        return resultString;
    }

    async executeToolFilterByTag(tag, contextData) {
        console.log(`Herramienta invocada: filtrar por etiqueta "${tag}"`);
        const { notes } = contextData;
        if (!notes || notes.length === 0) return "No hay notas guardadas.";
        
        const t = tag.toLowerCase().replace('#', '');
        const matches = notes.filter(n => n.tags && n.tags.some(tg => tg.toLowerCase() === t));
        
        if (matches.length === 0) return `No se encontraron notas con la etiqueta: ${tag}`;
        
        const topMatches = matches.slice(0, 10);
        let resultString = `Se encontraron ${matches.length} notas con etiqueta '${tag}' (mostrando ${topMatches.length}):\n`;
        topMatches.forEach((note, i) => {
            const date = new Date(note.id).toLocaleString('es-ES');
            resultString += `\n[Nota ${i+1}]\nFecha: ${date}\nTítulo: ${note.title || 'Sin título'}\nContenido:\n${note.content.substring(0, 500)}...\n`;
        });
        return resultString;
    }

    async executeToolGetRecent(limit, contextData) {
        console.log(`Herramienta invocada: obtener ${limit} notas recientes`);
        const { notes } = contextData;
        if (!notes || notes.length === 0) return "No hay notas guardadas.";
        
        const sorted = [...notes].sort((a, b) => b.id - a.id);
        const topMatches = sorted.slice(0, Math.min(limit, 10));
        
        let resultString = `Las ${topMatches.length} notas más recientes son:\n`;
        topMatches.forEach((note, i) => {
            const date = new Date(note.id).toLocaleString('es-ES');
            const tags = note.tags ? note.tags.join(', ') : 'Ninguna';
            resultString += `\n[Nota ${i+1}]\nFecha: ${date}\nTítulo: ${note.title || 'Sin título'}\nEtiquetas: ${tags}\nContenido:\n${note.content.substring(0, 1000)}...\n`;
        });
        return resultString;
    }

    formatContextForAI(context) {
        const { notes, sessions } = context;
        let contextString = "Eres un asistente de IA integrado en 'App Notas', el diario personal del usuario. El usuario puede preguntarte cosas sobre su diario, pensamientos pasados o simplemente charlar. NO TIENES LAS NOTAS EN TU CONTEXTO BASE.\n\n";
        
        contextString += "[USO DE HERRAMIENTAS]\nSi la pregunta del usuario requiere consultar su diario (buscar recuerdos, temas, etiquetas, o notas recientes), DEBES usar las 'tools' provistas. No respondas diciendo que no puedes o que no tienes acceso; usa la herramienta apropiada, espera los resultados (se te entregarán como tool_response) y luego genera tu respuesta final analizando lo que el sistema te devuelve.\n\n";

        if (sessions && sessions.length > 0) {
            const totalTime = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
            const hours = Math.floor(totalTime / 3600000);
            const minutes = Math.floor((totalTime % 3600000) / 60000);
            contextString += `[Métricas Básicas del Usuario]\nTotal Sesiones: ${sessions.length}\nTiempo Total en App: ${hours}h ${minutes}m\nNotas totales en la DB: ${notes.length}\n\n`;
        }

        return contextString;
    }

    async callOpenRouterAPI(history, model) {
        const contextData = await this.fetchContextData();
        const systemInstructionText = this.formatContextForAI(contextData);
        const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
        
        let messages = [];
        messages.push({ role: 'system', content: systemInstructionText });
        
        // LIMITAR HISTORIAL: Mantener solo los últimos 20 mensajes (+ el system prompt) para ahorrar tokens base
        const maxHistoryToKeep = 20;
        const currentHistory = history.slice(-maxHistoryToKeep);

        currentHistory.forEach(turn => {
            messages.push({
                role: turn.sender === 'user' ? 'user' : 'assistant',
                content: turn.message
            });
        });

        // Definición de Herramientas para la IA (Function Calling)
        const tools = [
            {
                type: "function",
                function: {
                    name: "search_notes_by_keyword",
                    description: "Busca en el diario del usuario notas que contengan una palabra o frase específica.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "La palabra o frase a buscar" }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "filter_notes_by_tag",
                    description: "Obtiene las notas del diario que tienen una etiqueta (tag) específica.",
                    parameters: {
                        type: "object",
                        properties: {
                            tag: { type: "string", description: "El nombre de la etiqueta sin el símbolo #" }
                        },
                        required: ["tag"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_recent_notes",
                    description: "Obtiene las notas más recientemente escritas en el diario.",
                    parameters: {
                        type: "object",
                        properties: {
                            limit: { type: "integer", description: "Número de notas a recuperar, sugerido entre 3 y 10" }
                        },
                        required: ["limit"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_chat_history",
                    description: "Si el contexto actual (< 20 mensajes) no es suficiente, recupera mensajes antiguos de esta misma conversación. Útil si el usuario hace referencia a algo discutido hace mucho tiempo.",
                    parameters: {
                        type: "object",
                        properties: {
                            offset: { type: "integer", description: "Índice de los mensajes en la historia. Ingresa 20 para obtener desde el 20 hasta atras." },
                            count: { type: "integer", description: "Cantidad de mensajes que quieres recuperar." }
                        },
                        required: ["offset", "count"]
                    }
                }
            }
        ];

        let makeRequest = async (currentMessages) => {
            const requestBody = {
                model: model,
                messages: currentMessages,
                tools: tools,
                tool_choice: "auto"
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-OpenRouter-Title': 'App Notas Diario'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
            }
            return await response.json();
        };

        let responseData = await makeRequest(messages);
        let choice = responseData.choices?.[0]?.message;

        if (!choice) throw new Error('Respuesta no válida de la API de OpenRouter.');

        // FIX para modelos de DeepSeek que mandan las peticiones de herramientas como texto bruto "raw"
        if ((!choice.tool_calls || choice.tool_calls.length === 0) && choice.content && choice.content.includes('<｜tool▁call▁begin｜>')) {
            console.log("Detectado formato crudo de herramientas de DeepSeek. Parseando...");
            choice.tool_calls = [];
            
            // Regex para atrapar la llamada de DeepSeek que nos diste de ejemplo
            const toolRegex = /<｜tool▁call▁begin｜>function<｜tool▁sep｜>([a-zA-Z0-9_]+)[\s\S]*?({[\s\S]*?})\n*```/g;
            let match;
            while ((match = toolRegex.exec(choice.content)) !== null) {
                choice.tool_calls.push({
                    id: "call_" + Math.random().toString(36).substring(7),
                    type: "function",
                    function: {
                        name: match[1].trim(),
                        arguments: match[2].trim()
                    }
                });
            }
            
            // Limpiamos la basura técnica del texto visible de la IA, si había texto normal combinado.
            choice.content = choice.content.replace(/<｜tool▁calls▁begin｜>[\s\S]*?<｜tool▁calls▁end｜>/g, '');
            if (choice.content.trim() === '') choice.content = null;
        }

        // Si la IA decide usar una herramienta (Function Calling)
        if (choice.tool_calls && choice.tool_calls.length > 0) {
            if (this.status) this.status.textContent = `🕵️ Buscando en el diario...`;
            
            // Añadir el mensaje de la IA con la llamada a la herramienta al historial
            messages.push(choice);

            // Procesar todas las herramientas llamadas
            for (const toolCall of choice.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let toolResult = "";

                try {
                    if (functionName === "search_notes_by_keyword") {
                        toolResult = await this.executeToolSearchByKeyWord(args.query, contextData);
                    } else if (functionName === "filter_notes_by_tag") {
                        toolResult = await this.executeToolFilterByTag(args.tag, contextData);
                    } else if (functionName === "get_recent_notes") {
                        toolResult = await this.executeToolGetRecent(args.limit, contextData);
                    } else if (functionName === "get_chat_history") {
                        const offset = args.offset || 20;
                        const count = args.count || 10;
                        toolResult = `==== HISTORIAL SOLICITADO ====\n`;
                        const start = Math.max(0, history.length - offset - count);
                        const end = Math.max(0, history.length - offset);
                        if (start >= end || start < 0) {
                             toolResult += "No hay más mensajes anteriores o el índice es inválido.";
                        } else {
                             const pastHistory = history.slice(start, end);
                             pastHistory.forEach((turn, idx) => {
                                 toolResult += `[Mensaje antiguo] ${turn.sender}: ${turn.message}\n`;
                             });
                        }
                    } else {
                        toolResult = "Error: Herramienta desconocida.";
                    }
                } catch (e) {
                    console.error("Error ejecutando herramienta local:", e);
                    toolResult = "Error ejecutando la búsqueda en el lado del cliente.";
                }

                // Añadir la respuesta de la herramienta
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            }

            // Segunda llamada a la API con los resultados de las herramientas
            if (this.status) this.status.textContent = `Procesando resultados...`;
            let secondResponseData = await makeRequest(messages);
            choice = secondResponseData.choices?.[0]?.message;
            if (!choice) throw new Error('Error en el segundo paso de la API.');
        }

        return choice.content;
    }

    addMessageToChat(message, sender, fromHistory = false) {
        if (!this.chatContainer) return;
        const contentWrapper = this.chatContainer.querySelector('.space-y-4');
        if (!contentWrapper) return;

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper flex flex-col w-full ${sender === 'user' ? 'items-end' : 'items-start'}`;

        const bubble = document.createElement('div');
        bubble.className = `message-bubble p-4 rounded-2xl max-w-lg shadow-md ${
            sender === 'user'
            ? 'bg-orange-500 text-white rounded-br-lg'
            : 'bg-orange-100 text-orange-900 rounded-bl-lg markdown-content'
        }`;

        if (sender === 'ai') {
            bubble.innerHTML = marked.parse(message);
            bubble.querySelectorAll('pre').forEach(pre => {
                const codeContent = pre.querySelector('code').textContent;
                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'absolute top-2 right-2 p-1 bg-orange-200/50 hover:bg-orange-300/50 rounded-md text-orange-700';
                const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                const checkIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                copyCodeBtn.innerHTML = copyIconSVG;
                copyCodeBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(codeContent).catch(() => {
                        const ta = document.createElement('textarea');
                        ta.value = codeContent;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    });
                    copyCodeBtn.innerHTML = checkIconSVG;
                    setTimeout(() => { copyCodeBtn.innerHTML = copyIconSVG; }, 2000);
                });
                pre.appendChild(copyCodeBtn);
            });
        } else {
            bubble.textContent = message;
        }

        messageWrapper.appendChild(bubble);

        const copyButton = document.createElement('button');
        const buttonColorClass = sender === 'user' ? 'text-orange-300 hover:text-white' : 'text-orange-400 hover:text-orange-600';
        copyButton.className = `copy-btn mt-1.5 p-1 rounded-md ${buttonColorClass} transition-colors`;
        const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        const checkIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        copyButton.innerHTML = copyIconSVG;
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(message).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = message;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            });
            copyButton.innerHTML = checkIconSVG;
            setTimeout(() => { copyButton.innerHTML = copyIconSVG; }, 2000);
        });

        messageWrapper.appendChild(copyButton);

        if (!fromHistory) {
            messageWrapper.classList.add('transform', 'scale-95', 'opacity-50');
            setTimeout(() => messageWrapper.classList.remove('scale-95', 'opacity-50'), 50);
        }

        contentWrapper.appendChild(messageWrapper);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.hideTypingIndicator();
        if (!this.typingIndicatorTemplate || !this.chatContainer) return;
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator-instance';
        indicator.innerHTML = this.typingIndicatorTemplate.innerHTML;
        const contentWrapper = this.chatContainer.querySelector('.space-y-4');
        if (contentWrapper) contentWrapper.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator-instance');
        if (indicator) indicator.remove();
    }

    // --- Utilidades ---
    loadSettings() {
        const stored = localStorage.getItem('openrouter-chat-settings');
        const defaults = { defaultModel: 'mistralai/mistral-small-24b-instruct-2501', apiKey: '' };
        try {
            const settings = stored ? JSON.parse(stored) : defaults;
            return settings;
        } catch (e) {
            return defaults;
        }
    }

    saveSettings() {
        if (this.settingsModelSelector) this.settings.defaultModel = this.settingsModelSelector.value;
        if (this.settingsApiKeyInput) this.settings.apiKey = this.settingsApiKeyInput.value.trim();
        this.apiKey = this.settings.apiKey;
        localStorage.setItem('openrouter-chat-settings', JSON.stringify(this.settings));
    }

    loadConversations() {
        try {
            const stored = localStorage.getItem('openrouter-chat-conversations');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error al cargar conversaciones:', e);
            return [];
        }
    }

    saveConversations() {
        try {
            localStorage.setItem('openrouter-chat-conversations', JSON.stringify(this.conversations));
        } catch (e) {
            console.error('Error al guardar conversaciones:', e);
        }
    }

    updateStorageSummary() {
        const convoString = localStorage.getItem('openrouter-chat-conversations') || '';
        const settingsString = localStorage.getItem('openrouter-chat-settings') || '';
        const totalBytes = convoString.length + settingsString.length;
        if (this.convoCountSpan) this.convoCountSpan.textContent = this.conversations.length;
        if (this.storageSizeSpan) this.storageSizeSpan.textContent = this.formatBytes(totalBytes);
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    toggleInput(disabled) {
        if (this.userInput) this.userInput.disabled = disabled;
        if (disabled) {
            if (this.sendBtn) this.sendBtn.disabled = true;
        } else {
            if (this.userInput) this.userInput.focus();
            this.updateSendButtonState();
        }
    }

    scrollToBottom() {
        if (this.chatContainer) this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}

// Inicializar la app cuando los componentes estén listos
document.addEventListener('componentsLoaded', () => {
    new OpenRouterChatApp();
});
