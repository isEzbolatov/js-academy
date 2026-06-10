(function () {
    'use strict';
    if (window.parent === window) return;

    function sendToParent(type, args) {
        try {
            var serialized = args.map(function (arg) {
                try {
                    if (arg instanceof Error) {
                        return { $$error: true, message: arg.message, stack: arg.stack };
                    }
                    if (typeof arg === 'object' && arg !== null) {
                        return JSON.parse(JSON.stringify(arg));
                    }
                    return arg;
                } catch (e) {
                    return String(arg);
                }
            });
            window.parent.postMessage(
                { source: 'js-academy-sandbox', type: type, data: serialized },
                '*'
            );
        } catch (e) { }
    }

    console.log = function () { sendToParent('log', Array.prototype.slice.call(arguments)); };
    console.error = function () { sendToParent('error', Array.prototype.slice.call(arguments)); };
    console.warn = function () { sendToParent('warn', Array.prototype.slice.call(arguments)); };

    window.addEventListener('error', function (e) {
        sendToParent('error', [e.message + ' at ' + e.filename + ':' + e.lineno]);
    });

    window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'execute') {
            try {
                (new Function(event.data.code))();
            } catch (err) {
                sendToParent('error', [err.message + '\n' + err.stack]);
            }
        }
    });
})();