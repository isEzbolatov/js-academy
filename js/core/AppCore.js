import { Router } from './Router.js';
import { ContentRenderer } from '../renderer/ContentRenderer.js';
import { SandboxManager } from '../sandbox/SandboxManager.js';

export class AppCore {
    constructor(store) {
        this.store = store;
        this.router = null;
        this.renderer = null;
        this.sandbox = null;
    }

    async init() {
        console.log('JS Academy запущен');

        this.renderer = new ContentRenderer({
            theoryContainerSelector: '#theoryBlock',
            codeEditorSelector: '#codeEditor',
            store: this.store,
            lessonsUrl: './data/lessons.json'
        });

        const lessons = await this.renderer.loadLessons();
        this._buildNavigation(lessons);

        this.router = new Router((lessonId) => {
            this.renderer.render(lessonId);
        });
        this.router.init();

        const savedLesson = this.store.getState().currentLesson;
        if (savedLesson) {
            window.location.hash = `#/lesson/${savedLesson}`;
        }

        this.sandbox = new SandboxManager({
            iframeEl: document.getElementById('codeSandbox'),
            codeEditor: document.getElementById('codeEditor'),
            consoleOutput: document.getElementById('consoleOutput'),
            runButton: document.getElementById('runCodeBtn')
        });

        document.getElementById('resetCodeBtn').addEventListener('click', () => {
            const currentLessonId = this.store.getState().currentLesson;
            if (currentLessonId) {
                this.renderer.render(currentLessonId);
            } else {
                document.getElementById('codeEditor').value = '';
            }
        });
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