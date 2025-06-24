# Mini &nbsp; <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/minimize.svg" alt="Mini Logo" height="20" />

> A minimalist platform for reading and writing.  
> Like Medium, but lighter, faster, and distraction-free.

<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/minimize.svg" width="60" alt="Mini Logo" />
</p>

<p align="center">
  <b>Built with React • Firebase Powered • Minimal by Design</b>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=white"/>
  <img alt="Lucide" src="https://img.shields.io/badge/Lucide_Icons-000000?style=for-the-badge&logo=lucide&logoColor=white"/>
</p>

---

## Overview
**MINISPACE** is a clean, lightweight web app where users can write, publish, and read articles without the distractions of traditional platforms.

---

## Features
- Minimal homepage feed (latest articles)
- Simple, beautiful editor
- Distraction-free reading pages
- Secure authentication with Firebase
- Cloud Firestore to store articles
- Responsive on all devices

---

## Tech Stack
- **Frontend:** React.js (or Next.js)
- **Icons:** `lucide-react`
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Hosting:** Vercel or Firebase Hosting

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mini.git
   cd mini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project
   - Enable **Authentication** (Email/Password)
   - Create a **Firestore** database
   - Add your Firebase configuration to `.env.local`

4. **Run the app locally**
   ```bash
   npm run dev
   ```

---

## Project Structure
```
/src
  /components    → UI Components
  /pages         → Home, Article, Write
  /services      → Firebase setup, Firestore helpers
  /styles        → CSS or Tailwind files
firebaseConfig.js → Firebase initialization
```

---

## License
MIT License.  
Feel free to fork, customize, and make it yours!

---

## Final Note
MINI is intentionally small.  
No endless features. No follower counts. No distractions.  
Just pure reading and writing. ✍🏽

---

built by me, [Lily](https://github.com/lilianada)