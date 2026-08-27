# Firebase and Google setup

This fork uses Firebase Authentication, Cloud Firestore realtime listeners, and
Google Drive. It does not use the original Readest hosted cloud, DeepL, WebDAV,
OneDrive, or S3.

## Firebase project

1. Create a Firebase project and add a Web app.
2. Enable **Authentication > Google**.
3. Create a Cloud Firestore database and a Cloud Storage bucket.
4. Copy `apps/readest-app/.env.local.example` to the environment file used by
   your build and fill in the public `NEXT_PUBLIC_FIREBASE_*` values.
5. Install the Firebase CLI, select your project, then deploy the included
   owner-only rules with `firebase deploy --only firestore:rules,storage`.

Do not put a Firebase service-account JSON file, Google client secret, or other
server credential in the app. Firebase web configuration and OAuth client IDs
are public identifiers; access is protected by Authentication and the supplied
rules.

## Google OAuth and Drive

Create OAuth clients for the platforms you build, enable the Google Drive API,
and configure the callback URIs already used by the app. The requested scopes
are Google identity plus `drive.file`; the app can only access Drive files that
it created. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for native builds and
`NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` for the web build.

## Data layout

Firestore keeps each account isolated under `users/{firebaseUid}`:

- `books`: library metadata
- `configs`: reading position and reader configuration
- `notes`: highlights, bookmarks, and annotations
- `stat-books` and `stat-pages`: reading statistics

Book files are synchronized through Google Drive. Firestore snapshots update
library, progress, and note state in realtime while explicit pull/push remains
available for offline catch-up.
