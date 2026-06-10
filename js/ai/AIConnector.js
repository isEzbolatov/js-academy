/**
 * @module AIConnector
 * @description Отправляет запросы к API нейросети (OpenRouter или имитация).
 * Поддерживает потоковый вывод (Streaming).
 */
export class AIConnector {
    constructor() {
        this._apiKey = localStorage.getItem('ai_api_key') || '';
        this._endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    }

    /**
     * Устанавливает API-ключ и сохраняет его.
     * @param {string} key
     */
    setApiKey(key) {
        this._apiKey = key;
        localStorage.setItem('ai_api_key', key);
    }

    /** Есть ли заданный ключ */
    hasRealApi() {
        return this._apiKey.length > 0;
    }

    /**
     * Отправляет запрос к нейросети.
     * @param {Object} params
     * @param {string} params.userMessage
     * @param {string} [params.userCode]
     * @param {Array} [params.history]
     * @returns {AsyncGenerator<string>}
     */
    async *sendMessage({ userMessage, userCode, history = [] }) {
        if (!this.hasRealApi()) {
            // Имитация ответа
            const mock = this._generateMockResponse(userMessage, userCode);
            yield* this._simulateStream(mock);
            return;
        }

        // Реальный запрос к OpenRouter
        const systemPrompt = `Ты — наставник по JavaScript. Помоги студенту научиться, используя сократический метод: не давай готовый код, а задавай наводящие вопросы, указывай на возможные ошибки и подталкивай к правильному решению. Веди диалог, оглядываясь на код, который студент написал в редакторе. Отвечай кратко, дружелюбно.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: userMessage }
        ];

        // Если в сообщении пользователя есть код, добавляем его
        if (userCode && !userMessage.includes('[КОД ПОЛЬЗОВАТЕЛЯ]')) {
            messages.push({ role: 'user', content: `Мой текущий код в редакторе:\n\`\`\`js\n${userCode}\n\`\`\`` });
        }

        const response = await fetch(this._endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this._apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'JS Academy'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo', // можно заменить на другую модель
                messages,
                stream: true
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка API: ${response.status} ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') return;
                try {
                    const json = JSON.parse(dataStr);
                    const delta = json.choices[0]?.delta?.content;
                    if (delta) yield delta;
                } catch (e) {
                    // игнорируем ошибки парсинга
                }
            }
        }
    }

    // --- вспомогательные методы ---
    _generateMockResponse(message, code) {
        const msg = message.toLowerCase();
        if (code && code.includes('console.log')) {
            return "Вижу, вы используете `console.log`. Это отличный способ отладки. Но что, если переменная не определена? Какие ошибки могут возникнуть?";
        }
        if (msg.includes('как') || msg.includes('?')) {
            return "Интересный вопрос! Попробуйте сначала сами догадаться: что вы ожидаете от выполнения этого кода? Опишите свои мысли.";
        }
        if (msg.includes('ошибка') || msg.includes('не работает')) {
            return "Понимаю, что что-то идёт не так. Давайте разбираться. Что именно вы видите в консоли? Можете вставить сообщение об ошибке?";
        }
        return "Привет! Я здесь, чтобы помочь вам научиться JavaScript. Я не даю готовых решений, а задаю наводящие вопросы. Расскажите, над чем вы работаете.";
    }

    async *_simulateStream(text) {
        const words = text.split(/(\s+)/).filter(Boolean);
        for (const w of words) {
            await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
            yield w;
        }
    }
}