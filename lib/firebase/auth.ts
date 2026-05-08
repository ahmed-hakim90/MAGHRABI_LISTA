"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getClientAuth } from "./client";

export async function signInAdmin(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(
    getClientAuth(),
    email,
    password,
  );
  return cred.user;
}

export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(getClientAuth());
}
