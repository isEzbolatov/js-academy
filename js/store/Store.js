/**
 * @module Store
 * @description Модуль управления состоянием приложения с синхронизацией в localStorage
 * и защитой от частых записей (debounce 1 секунда).
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage}
 */

import { debounce } from '../utils/debounce.js';

/**
 * @class Store
 * @classdesc Единый объект состояния для всего приложения.
 * Позволяет получать, обновлять состояние и подписываться на изменения.
 */
export class Store {
    /**
     * @param {Object} initialState - Начальное состояние, используется,
     * если в localStorage нет сохранённых данных.
     * @param {string} [storageKey='js-academy-state'] - Ключ для localStorage.
     */
    constructor(initialState = {}, storageKey = 'js-academy-state') {
        /** @private */
        this._storageKey = storageKey;

        /** @private */
        this._listeners = [];

        /**
         * Текущее состояние. Загружается из localStorage или берётся initialState.
         * @type {Object}
         * @private
         */
        this._state = this._loadState() || { ...initialState };

        /**
         * Debounce-версия сохранения состояния.
         * @private
         */
        this._debouncedSave = debounce(() => {
            this._saveState();
        }, 1000);

        // Подписываем debouncedSave на изменения состояния
        this._saveOnChange = () => {
            this._debouncedSave();
        };

        // Немедленное сохранение начального состояния, если оно не было загружено
        if (!localStorage.getItem(this._storageKey)) {
            this._saveState();
        }
    }

    /**
     * Возвращает текущее состояние (копию).
     * @returns {Object} Текущее состояние.
     */
    getState() {
        return { ...this._state };
    }

    /**
     * Частичное обновление состояния (shallow merge).
     * @param {Object} partial - Объект с новыми значениями для слияния.
     * @example
     * store.setState({ currentLesson: 'intro', userCode: 'console.log(1)' });
     */
    setState(partial) {
        const prevState = { ...this._state };
        this._state = { ...this._state, ...partial };
        this._notifyListeners(prevState);
        this._saveOnChange(); // вызовет debounced сохранение
    }

    /**
     * Подписывает функцию-слушатель на изменения состояния.
     * @param {Function} listener - Функция, принимающая (newState, oldState).
     * @returns {Function} Функция для отписки.
     */
    subscribe(listener) {
        this._listeners.push(listener);
        // Возвращаем функцию отписки
        return () => {
            this._listeners = this._listeners.filter((l) => l !== listener);
        };
    }

    /**
     * Принудительно сохраняет состояние в localStorage немедленно.
     */
    forceSave() {
        this._saveState();
    }

    // ---------- Приватные методы ----------

    /**
     * Оповещает всех подписчиков об изменении состояния.
     * @param {Object} oldState - Предыдущее состояние.
     * @private
     */
    _notifyListeners(oldState) {
        for (const listener of this._listeners) {
            try {
                listener(this._state, oldState);
            } catch (error) {
                console.error('Store listener error:', error);
            }
        }
    }

    /**
     * Сохраняет текущее состояние в localStorage.
     * @private
     */
    _saveState() {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(this._state));
        } catch (error) {
            console.warn('Store: не удалось сохранить состояние в localStorage', error);
        }
    }

    /**
     * Загружает состояние из localStorage.
     * @returns {Object|null} Распарсенное состояние или null, если данных нет или ошибка парсинга.
     * @private
     */
    _loadState() {
        try {
            const raw = localStorage.getItem(this._storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('Store: не удалось загрузить состояние из localStorage', error);
            return null;
        }
    }
}