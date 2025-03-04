import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import {
  Auth,
  AuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  UserCredential,
  updateProfile,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '@angular/fire/auth';

export interface Credential {
  name: string;
  lastName: string;
  email: string;
  password: string;
  rol: string;
}

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  
  getUserData(uid: string) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    // Return an observable that emits the document data
    return docData(userDocRef);
    
    // Alternatively, if you want a one-time fetch:
    // return from(getDoc(userDocRef)).pipe(
    //   map(docSnap => docSnap.data())
    // );
  }
  getCurrentUser() {
    throw new Error('Method not implemented.');
  }
  constructor(private firestore: Firestore) {}

  private auth: Auth = inject(Auth);

  readonly authState$ = authState(this.auth);

  async signUpWithEmailAndPassword(credential: Credential): Promise<void> {
    try {
      // Create the user with email and password
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        credential.email,
        credential.password
      );

      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: `${credential.name} ${credential.lastName}`,
        });
      }

      // Save additional details to Firestore
      const userRef = doc(this.firestore, `users/${userCredential.user?.uid}`);
      await setDoc(userRef, {
        uid: userCredential.user?.uid,
        name: credential.name,
        lastName: credential.lastName,
        email: credential.email,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  logInWithEmailAndPassword(credential: Credential) {
    return signInWithEmailAndPassword(
      this.auth,
      credential.email,
      credential.password
    );
  }

  logOut(): Promise<void> {
    return this.auth.signOut();
  }

  // providers
  signInWithGoogleProvider(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();

    return this.callPopUp(provider);
  }

  signInWithGithubProvider(): Promise<UserCredential> {
    const provider = new GithubAuthProvider();

    return this.callPopUp(provider);
  }

  async callPopUp(provider: AuthProvider): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(this.auth, provider);

      return result;
    } catch (error: any) {
      return error;
    }
  }  
}
