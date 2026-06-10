export class ChatUI {
    constructor({ messagesContainer, inputEl, sendBtn, onSend, aiConnector }) {
        this._container = messagesContainer;
        this._input = inputEl;
        this._sendBtn = sendBtn;
        this._onSend = onSend;
        this._ai = aiConnector;
        this._typingEl = null;
        this._isStreaming = false;

        this._sendBtn.addEventListener('click', () => this._handleSend());
        this._input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSend();
            }
        });

        this._initApiKeyUI();
    }

    _initApiKeyUI() {
        const header = document.querySelector('.c-chat__header');
        if (!header) return;

        const container = document.createElement('div');
        container.className = 'c-chat__api-key';

        const input = document.createElement('input');
        input.type = 'password';
        input.placeholder = 'API ключ (OpenRouter)';
        input.value = this._ai._apiKey || '';
        input.className = 'c-chat__api-input';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾';
        saveBtn.title = 'Сохранить ключ';
        saveBtn.addEventListener('click', () => {
            this._ai.setApiKey(input.value.trim());
            this.addMessage('Ключ сохранён. Теперь используется реальный ИИ.', 'assistant');
        });

        container.appendChild(input);
        container.appendChild(saveBtn);
        header.appendChild(container);
    }

    addMessage(text, role) {
        const msgEl = document.createElement('div');
        msgEl.className = `c-chat__message c-chat__message--${role}`;
        msgEl.textContent = text;
        this._container.appendChild(msgEl);
        this._scrollToBottom();
        return msgEl;
    }

    showTyping() {
        if (this._typingEl) return;
        this._typingEl = document.createElement('div');
        this._typingEl.className = 'c-chat__message c-chat__message--assistant c-chat__message--typing';
        this._typingEl.textContent = '...';
        this._container.appendChild(this._typingEl);
        this._scrollToBottom();
    }

    hideTyping() {
        if (this._typingEl) {
            this._typingEl.remove();
            this._typingEl = null;
        }
    }

    async streamResponse(stream) {
        this._isStreaming = true;
        this.showTyping();
        this.hideTyping();
        const msgEl = this.addMessage('', 'assistant');
        let fullText = '';
        try {
            for await (const chunk of stream) {
                fullText += chunk;
                msgEl.textContent = fullText;
                this._scrollToBottom();
            }
        } catch (err) {
            msgEl.textContent = `Ошибка: ${err.message}`;
            console.error(err);
        } finally {
            this._isStreaming = false;
            this.hideTyping();
        }
        return fullText;
    }

    sendUserMessage(text) {
        if (!text || this._isStreaming) return;
        this.addMessage(text, 'user');
        this._onSend(text);
    }

    _handleSend() {
        const text = this._input.value.trim();
        if (!text || this._isStreaming) return;
        this._input.value = '';
        this.addMessage(text, 'user');
        this._onSend(text);
    }

    _scrollToBottom() {
        this._container.scrollTop = this._container.scrollHeight;
    }
}