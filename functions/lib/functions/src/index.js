"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = exports.joinTeam = void 0;
const app_1 = require("firebase-admin/app");
const v2_1 = require("firebase-functions/v2");
(0, app_1.initializeApp)();
// Same region as Firestore (firebase.json)
(0, v2_1.setGlobalOptions)({ region: 'europe-west3', maxInstances: 10 });
var joinTeam_1 = require("./joinTeam");
Object.defineProperty(exports, "joinTeam", { enumerable: true, get: function () { return joinTeam_1.joinTeam; } });
var ping_1 = require("./ping");
Object.defineProperty(exports, "ping", { enumerable: true, get: function () { return ping_1.ping; } });
