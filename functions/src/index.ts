import { setGlobalOptions } from 'firebase-functions/v2';

// Same region as Firestore (firebase.json)
setGlobalOptions({ region: 'europe-west3', maxInstances: 10 });
