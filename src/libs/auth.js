import { auth, provider } from "@/libs/firebase";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";

const db = getFirestore();

export const handleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const defaultUsername = String(user.displayName).split(" ")[0]

      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        username: defaultUsername,
        photoURL: user.photoURL,
        createAt: new Date(),
      });
    }

    return user;
  } catch (err) {
    return null;
  }
};
