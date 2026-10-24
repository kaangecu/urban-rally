"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const v2_1 = require("firebase-functions/v2");
// Same region as Firestore (firebase.json)
(0, v2_1.setGlobalOptions)({ region: 'europe-west3', maxInstances: 10 });
var ping_1 = require("./ping");
Object.defineProperty(exports, "ping", { enumerable: true, get: function () { return ping_1.ping; } });
