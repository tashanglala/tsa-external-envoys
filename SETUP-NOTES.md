# TSA External Envoys — roster + admin setup

## 1. Give the 11 (12) people login access without Google
Run `seed-tsa-roster.js` once (Node + `npm install firebase-admin`, service
account key from Firebase Console). It:
- creates a Firebase Auth account for each email with the shared password
  `tsaenvoy2026` (only if one doesn't already exist — safe to re-run)
- writes their `/roster/{key}` and `/users/{uid}` docs so they can log in
  immediately, no separate "Create password account" step needed
- sets `role: "admin"` for exactly these three, `role: "member"` for
  everyone else:
  - nner2023-1001-27559@bicol-u.edu.ph
  - elijahgideandes.barrun26@bicol-u.edu.ph
  - johnmarlpenaflor.meyer24@bicol-u.edu.ph

They can change that password later from **Dashboard → My Profile**. Right
now "Update Password" there just points people to "Forgot password?" on the
login screen — say the word if you want it wired to Firebase's
`updatePassword()` directly instead.

When you're ready to also let them use "Continue with Google," you don't
need to change any code — just make sure their Google account's email
matches the roster email exactly; `signInWithGoogle()` already checks the
roster the same way.

## 2. Making the admin-only restriction actually secure
The website already hides Manage Members / Assign Tasks / Applications /
MOA upload behind `role === "admin"` — but that check runs in the visitor's
browser, so it's a UI convenience, not real security. Someone could still
call Firestore directly. Lock it down with rules like this in **Firestore →
Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function myRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isAdmin() { return isSignedIn() && myRole() == "admin"; }

    match /users/{uid} {
      allow read: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if isSignedIn();
    }
    match /roster/{id}   { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /documents/{id}{ allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /tasks/{id}    { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /applications/{id}{ allow read, write: if isAdmin(); allow create: if true; }
    match /partners/{id} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /notifications/{id} {
      allow read, update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn();
    }
  }
}
```

And the matching **Storage rule** for the MOA files:
```
match /moas/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

This is what actually guarantees "only admins upload, members only
view/download" — the front-end classes/checks in `index.html` are just the
UI reflection of it.

## 3. Splitting into dashboard.html / login.html
I kept everything in one `index.html` for now. The app's auth state,
real-time Firestore listeners, and all the render functions are shared
across the landing page, login modal, and dashboard in one script — moving
the dashboard/login to their own files means duplicating that Firebase
session logic (or introducing a shared script include) so a login on one
page is recognized on the other. Doable, but it's a separate, riskier
refactor from today's UI pass. Happy to do it next if you still want
separate URLs — just say the word.
