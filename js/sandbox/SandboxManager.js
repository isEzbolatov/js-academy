export class SandboxManager {
    constructor({ iframeEl, codeEditor, consoleOutput, runButton }) {
        this._iframe = iframeEl;
        this._codeEditor = codeEditor;
        this._consoleOutput = consoleOutput;
        this._runButton = runButton;

        this._messageHandler = this._handleMessage.bind(this);
        window.addEventListener('message', this._messageHandler);

        this._initIframe();
        this._runButton.addEventListener('click', () => this.runCode());
    }

    async _initIframe() {
        try {
            const response = await fetch('./js/sandbox/ConsoleInterceptor.js');
            const script = await response.text();
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>${script}</script></body></html>`;
            const blob = new Blob([html], { type: 'text/html' });
            this._iframe.src = URL.createObjectURL(blob);
        } catch (err) {
            console.error('Ошибка загрузки ConsoleInterceptor:', err);
        }
    }

    runCode() {
        const userCode = this._codeEditor.value;
        if (!userCode.trim()) return;

        // Очищаем консоль
        this._consoleOutput.innerHTML = '';

        // Пока без защиты от циклов, чтобы проверить базовую работу
        const safeCode = userCode;

        this._iframe.contentWindow.postMessage(
            { type: 'execute', code: safeCode },
            '*'
        );
    }

    _handleMessage(event) {
        console.log('Сообщение из iframe:', event.data); // Для отладки
        if (event.data && event.data.source === 'js-academy-sandbox') {
            const { type, data } = event.data;
            this._logToConsole(type, data);
        }
    }

    _logToConsole(type, args) {
        const line = document.createElement('div');
        line.className = `c-editor__console-line c-editor__console-line--${type}`;
        line.textContent = args
            .map((arg) => {
                if (arg && arg.$$error) {
                    return `${arg.message}\n${arg.stack || ''}`;
                }
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            })
            .join(' ');

        this._consoleOutput.appendChild(line);
        this._consoleOutput.scrollTop = this._consoleOutput.scrollHeight;
    }

    destroy() {
        window.removeEventListener('message', this._messageHandler);
    }
}