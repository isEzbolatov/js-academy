import { Router } from './Router.js';
import { ContentRenderer } from '../renderer/ContentRenderer.js';
import { SandboxManager } from '../sandbox/SandboxManager.js';
import { AIConnector } from '../ai/AIConnector.js';
import { ChatUI } from '../chat/ChatUI.js';

export class AppCore {
    constructor(store) {
        this.store = store;
        this.router = null;
        this.renderer = null;
        this.sandbox = null;
        this.chatUI = null;
        this.ai = null;
    }

    async init() {
        console.log('JS Academy запущен');

        // Рендерер
        this.renderer = new ContentRenderer({
            theoryContainerSelector: '#theoryBlock',
            codeEditorSelector: '#codeEditor',
            store: this.store,
            lessonsUrl: './data/lessons.json'
        });
        const lessons = await this.renderer.loadLessons();
        this._buildNavigation(lessons);

        // Роутер
        this.router = new Router((lessonId) => {
            this.renderer.render(lessonId);
        });
        this.router.init();
        const savedLesson = this.store.getState().currentLesson;
        if (savedLesson) {
            window.location.hash = `#/lesson/${savedLesson}`;
        }

        // Sandbox
        this.sandbox = new SandboxManager({
            iframeEl: document.getElementById('codeSandbox'),
            codeEditor: document.getElementById('codeEditor'),
            consoleOutput: document.getElementById('consoleOutput'),
            runButton: document.getElementById('runCodeBtn')
        });

        // Сброс кода
        document.getElementById('resetCodeBtn').addEventListener('click', () => {
            const id = this.store.getState().currentLesson;
            if (id) this.renderer.render(id);
            else document.getElementById('codeEditor').value = '';
        });

        // ИИ
        this.ai = new AIConnector();
        this.chatUI = new ChatUI({
            messagesContainer: document.getElementById('chatMessages'),
            inputEl: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendMessageBtn'),
            onSend: (text) => this._handleChatMessage(text),
            aiConnector: this.ai
        });

        // Кнопка «Спросить про код»
        const askBtn = document.getElementById('askAIButton');
        if (askBtn) {
            askBtn.addEventListener('click', () => {
                const code = document.getElementById('codeEditor').value;
                if (!code.trim()) return;
                this.chatUI.sendUserMessage(`Помоги разобраться с моим кодом:\n\`\`\`js\n${code}\n\`\`\``);
            });
        }

        // Восстановление истории чата
        const history = this.store.getState().chatHistory;
        if (history && history.length) {
            for (const msg of history) {
                this.chatUI.addMessage(msg.text, msg.role);
            }
        }
    }

    async _handleChatMessage(userMessage) {
        const state = this.store.getState();
        const newHistory = [...state.chatHistory, { role: 'user', text: userMessage }];
        this.store.setState({ chatHistory: newHistory });

        const userCode = document.getElementById('codeEditor').value;
        const stream = this.ai.sendMessage({
            userMessage,
            userCode,
            history: newHistory
        });

        const assistantText = await this.chatUI.streamResponse(stream);
        const finalHistory = [...this.store.getState().chatHistory, { role: 'assistant', text: assistantText }];
        this.store.setState({ chatHistory: finalHistory });
    }

    _buildNavigation(lessons) {
        const navList = document.querySelector('.c-nav__list');
        if (!navList) return;
        navList.innerHTML = '';
        lessons.forEach((lesson) => {
            const li = document.createElement('li');
            li.className = 'c-nav__list-item';
            li.textContent = lesson.title;
            li.setAttribute('role', 'tab');
            li.setAttribute('data-lesson-id', lesson.id);
            li.addEventListener('click', () => {
                window.location.hash = `#/lesson/${lesson.id}`;
            });
            navList.appendChild(li);
        });
        this.store.subscribe((newState) => {
            const items = navList.querySelectorAll('.c-nav__list-item');
            items.forEach((item) => {
                const id = item.getAttribute('data-lesson-id');
                item.classList.toggle('c-nav__list-item--active', id === newState.currentLesson);
            });
        });
    }
}