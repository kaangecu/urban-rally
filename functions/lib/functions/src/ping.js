"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const https_1 = require("firebase-functions/v2/https");
/** Proves the functions wiring: answers signed-in callers with their uid. */
exports.ping = (0, https_1.onCall)((request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in first.');
    }
    return { uid: request.auth.uid };
});
