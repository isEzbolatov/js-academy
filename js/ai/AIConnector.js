export class AIConnector {
    constructor() {
        this._apiKey = localStorage.getItem('ai_api_key') || '';
        this._endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    }

    setApiKey(key) {
        this._apiKey = key;
        localStorage.setItem('ai_api_key', key);
    }

    hasRealApi() {
        return this._apiKey.length > 0;
    }

    async *sendMessage({ userMessage, userCode, history = [] }) {
        if (!this.hasRealApi()) {
            const mock = this._generateMockResponse(userMessage, userCode);
            yield* this._simulateStream(mock);
            return;
        }

        const systemPrompt = `Ты — наставник по JavaScript. Помоги студенту научиться, используя сократический метод: не давай готовый код, а задавай наводящие вопросы, указывай на возможные ошибки и подталкивай к правильному решению. Веди диалог, оглядываясь на код, который студент написал в редакторе. Отвечай кратко, дружелюбно.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: userMessage }
        ];

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
                model: 'deepseek/deepseek-chat',   // ← DeepSeek, работает в РФ
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
                } catch (e) { }
            }
        }
    }

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