# TSA External Envoys — Firebase Build

This version upgrades the original single-file portal to Firebase-backed authentication,
shared Firestore data, Cloud Storage MOA files, real-time dashboard updates, in-app
notifications, and Firebase Trigger Email notifications.

## What changed

- Firebase Authentication:
  - Email/password authentication.
  - Google Sign-In through Firebase Authentication.
  - Firebase handles password storage/hashing; no plaintext passwords are stored by this app.
  - Password reset uses Firebase's reset-email flow.
- Firestore:
  - Replaces localStorage for members, tasks, partners, applications, documents, and notifications.
  - Real-time listeners update dashboards without refreshing.
- Cloud Storage:
  - Admin-only MOA uploads.
  - Members can view/download MOAs.
  - MOAs have an event, title, type (Reference/Final), notes, and file metadata.
- MOA workflow:
  - Admin uploads reference MOAs for members to consult.
  - Admin can upload final/approved MOAs.
  - Members cannot upload or delete MOAs.
  - Admin can attach a reference MOA to a task.
- Task workflow:
  - Admin assigns a task, event, priority, due date, and optional reference MOA.
  - Member receives an in-app notification.
  - A document is written to the `mail` collection so Firebase Trigger Email can send the email.
- Admin/member permissions are enforced by Firestore/Storage rules rather than only by UI.

## Important: Firebase setup

1. Create/open a Firebase project.
2. Add a Web App and copy its Firebase configuration.
3. In `index.html`, replace the `YOUR_FIREBASE_*` values in `firebaseConfig`.
4. Enable:
   - Authentication > Sign-in method > Email/Password
   - Authentication > Sign-in method > Google
   - Firestore Database
   - Storage
5. Deploy the included rules/indexes:
   - `firestore.rules`
   - `firestore.indexes.json`
   - `storage.rules`
6. Install the official Firebase Trigger Email extension and configure your SMTP provider.
   The app writes task email jobs to the `mail` collection.

## First admin

The first admin must be created manually because the browser must never be allowed
to grant itself an admin role.

Recommended first-time process:

1. In Firebase Authentication, create the first admin account.
2. Copy that user's UID.
3. In Firestore create `users/{UID}` with:
   - `email`: the admin's email
   - `displayName`: admin name
   - `role`: `admin`
   - `active`: `true`
   - `course`: ``
   - `bio`: ``
4. Create the admin's roster document using the normalized email as the document ID:
   `roster/admin-email@example.com`
   with:
   - `email`
   - `name`
   - `role: admin`
   - `active: true`

After that, the admin can add member emails from Manage Members.

## Member onboarding

1. Admin adds the member's email to the roster.
2. The member opens the portal.
3. They can:
   - Create a Firebase password account, or
   - Continue with Google.
4. Their Firebase UID/profile is stored in `users/{uid}`.

## Trigger Email extension

Install the official `firestore-send-email` extension and configure the SMTP
connection. The app creates documents such as:

`mail/{autoId}`

with a `to` address and a `message` containing the task notification.

Do not open the `mail` collection to normal members. The included rules only allow
admins to create mail documents.

## Deploy to Firebase Hosting

Install the Firebase CLI, log in, select your project, then deploy:

    firebase login
    firebase use YOUR_PROJECT_ID
    firebase deploy

The included `firebase.json` serves this directory as the Hosting public folder.

## Notes

- The Firebase web configuration is not a password/secret; it identifies your Firebase app.
  Security comes from Authentication plus Firestore/Storage Security Rules.
- Never put a Firebase Admin SDK service-account key in this frontend.
- The app intentionally uses Firestore, not Realtime Database, because the requested
  shared-data model is implemented with Firestore real-time listeners.
- The Trigger Email extension requires an SMTP delivery provider configured in Firebase;
  the frontend cannot send arbitrary email by itself.

## Source UI

The build keeps the original External Envoys / TechSystems Association visual direction
and extends it with interactive task cards, notification badges, live panels, MOA filters,
upload progress, searchable documents, and admin controls.
