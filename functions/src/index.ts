import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

// Same region as Firestore (firebase.json)
setGlobalOptions({ region: 'europe-west3', maxInstances: 10 });

export { joinTeam } from './joinTeam';
export { ping } from './ping';
