import { environment } from '../environments/environment';
import { EnvironmentProviders } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

const firebaseProviders: EnvironmentProviders[] = [
  provideFirebaseApp(() => {
    const app = initializeApp(environment.firebaseConfig);
    console.log('Firebase initialized:', app.name);  // This should print 'Firebase initialized: [DEFAULT]'
    return app;
  }),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideStorage(() => getStorage()),
];

export { firebaseProviders };
