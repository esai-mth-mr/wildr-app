# Wildr Publisher Portal

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Authentication Setup Instructions

To enable proper authentication in this project, you need to configure the connection with Firebase and provide the required API keys. Follow these steps:

1. Create a file named `.env.local` in the project's root folder.

2. Fill in the `.env.local` file with your Firebase settings obtained during the project creation on [Firebase Console](https://console.firebase.google.com/):

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
