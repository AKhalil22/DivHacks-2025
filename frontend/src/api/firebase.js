import { initializeApp } from "firebase/app"
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onIdTokenChanged,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

setPersistence(auth, browserLocalPersistence)

onIdTokenChanged(auth, async (user) => {
  const token = user ? await user.getIdToken() : null
  if (token) localStorage.setItem("idToken", token)
  else localStorage.removeItem("idToken")
})

export default app