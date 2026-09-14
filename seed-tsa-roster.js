/**
 * seed-tsa-roster.js
 * ------------------------------------------------------------
 * One-time (or re-runnable) setup script for the TSA External
 * Envoys portal. This uses the Firebase ADMIN SDK, which can
 * create other people's accounts — the public website's client
 * SDK cannot do this (createUserWithEmailAndPassword only ever
 * signs YOU in as the new user), so this has to be run from a
 * trusted machine, not from index.html.
 *
 * What it does:
 *  1. For every email in ROSTER below, creates (or reuses) a
 *     Firebase Auth account with the shared temporary password.
 *  2. Writes a matching /roster/{emailKey} Firestore doc — this
 *     is what index.html checks on login/signup/Google sign-in.
 *  3. Writes a matching /users/{uid} profile doc so the member
 *     can log in immediately without going through "Create
 *     password account" first.
 *
 * SETUP:
 *   1. In Firebase Console > Project settings > Service accounts,
 *      generate a new private key (downloads a JSON file).
 *   2. npm install firebase-admin
 *   3. Save that JSON as ./serviceAccountKey.json next to this
 *      file (keep it OUT of any public repo / the website).
 *   4. node seed-tsa-roster.js
 *
 * Members can log in immediately with their school email and the
 * TEMP_PASSWORD below, then change it from Dashboard > My Profile.
 * (Wire up changePassword() with Firebase's updatePassword() if
 * you want that button to work end-to-end — currently it points
 * people to "Forgot password" instead.)
 * ------------------------------------------------------------
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db = admin.firestore();

const TEMP_PASSWORD = "tsaenvoy2026"; // members can change this later in-app

// The 3 people who should hold Council Admin power:
//  - manage members (grant/revoke, roster)
//  - the ONLY ones who can upload/delete MOAs (members stay view/download-only)
const ADMIN_EMAILS = new Set([
  "nner2023-1001-27559@bicol-u.edu.ph",
  "elijahgideandes.barrun26@bicol-u.edu.ph",
  "johnmarlpenaflor.meyer24@bicol-u.edu.ph",
]);

// Everyone who should be able to log in with email + temp password
// (in addition to, or instead of, "Continue with Google").
const ROSTER = [
  "nner2023-1001-27559@bicol-u.edu.ph",
  "elijahgideandes.barrun26@bicol-u.edu.ph",
  "dhenmarcnino.berot24@bicol-u.edu.ph",
  "fjsp2023-6162-76868@bicol-u.edu.ph",
  "amb2023-1782-10599@bicol-u.edu.ph",
  "cylinejoycearingo.alfuente26@bicol-u.edu.ph",
  "satriakeshabarreto.abad26@bicol-u.edu.ph",
  "janinebelle.bilaos26@bicol-u.edu.ph",
  "michaelaremoto.laud26@bicol-u.edu.ph",
  "rheanmaemariscotes.madrelejos26@bicol-u.edu.ph",
  "luvannahherdaollano.cabanatan26@bicol-u.edu.ph",
  "johnmarlpenaflor.meyer24@bicol-u.edu.ph", // 3rd admin, not on the original list
];

function emailKey(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function nameFromEmail(email) {
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, "").trim() || "Envoy";
}

async function ensureAuthUser(email) {
  try {
    const existing = await auth.getUserByEmail(email);
    // Account already exists (e.g. from an earlier Google sign-in test).
    // Make sure it also has the shared password set, otherwise
    // email/password login will keep failing for it.
    const hasPasswordProvider = existing.providerData.some(p => p.providerId === "password");
    if (!hasPasswordProvider) {
      await auth.updateUser(existing.uid, { password: TEMP_PASSWORD });
      console.log(`  ↳ added password credential to existing account (${email})`);
    }
    return existing;
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    return await auth.createUser({
      email,
      password: TEMP_PASSWORD,
      displayName: nameFromEmail(email),
      emailVerified: true, // school-issued addresses; skip verification friction
    });
  }
}

async function run() {
  for (const rawEmail of ROSTER) {
    const email = rawEmail.trim().toLowerCase();
    const role = ADMIN_EMAILS.has(email) ? "admin" : "member";

    try {
      const userRecord = await ensureAuthUser(email);

      await db.collection("roster").doc(emailKey(email)).set(
        {
          email,
          role,
          active: true,
          name: nameFromEmail(email),
          course: "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await db.collection("users").doc(userRecord.uid).set(
        {
          email,
          displayName: nameFromEmail(email),
          role,
          active: true,
          course: "",
          bio: "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`✓ ${email}  →  role: ${role}`);
    } catch (e) {
      // Don't let one bad email (typo, etc.) kill the whole batch —
      // report it and keep going through the rest of the roster.
      console.error(`✗ ${email}  →  FAILED: ${e.message}`);
    }
  }
  console.log(`\nDone. Temp password: ${TEMP_PASSWORD}`);
  console.log("Tell members to change it from Dashboard > My Profile once they log in.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});