# QIK - The Ultimate Campus Companion

<p align="center">
  <img src="assets/images/icon.png" alt="QIK Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Your all-in-one companion for N.B.K.R. Institute</strong>
</p>

<p align="center">
  <a href="https://qik.tobioffice.dev">Website</a> •
  <a href="https://github.com/tobioffice/QIK/releases">Download</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a>
</p>

---

## About

QIK is a mobile app designed specifically for students of N.B.K.R. Institute of Science & Technology, Vidyanagar. It consolidates scattered academic data into one beautiful, intuitive interface.

No more scrolling through endless chat histories or navigating slow portals. Everything you need is just one tap away.

## Features

- 📊 **Attendance Tracking** - Visual analytics for your attendance percentage
- 📝 **Mid Marks** - Check your mid-term marks with detailed breakdown
- 🏆 **Leaderboard** - See your rank among peers (college, year, branch, section)
- 🔐 **Secure Login** - Google Sign-In with Clerk authentication
- 🎨 **Modern UI** - Dark theme with glassmorphism design
- ⚡ **Fast & Lightweight** - Built for performance

## Tech Stack

- **Frontend**: React Native, Expo SDK 54
- **Styling**: NativeWind (TailwindCSS)
- **Authentication**: Clerk
- **Backend**: Bun + Hono (TypeScript)
- **Database**: PostgreSQL

## Installation

### Prerequisites

- Node.js 18+ or Bun
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/tobioffice/QIK.git
   cd QIK
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Create a `.env` file with your environment variables:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   EXPO_PUBLIC_API_URL=your_api_url
   ```

4. Start the development server:
   ```bash
   npm start
   # or
   bun start
   ```

5. Scan the QR code with Expo Go app or run on emulator:
   ```bash
   npm run android
   ```

## Building

### Development Build
```bash
npx expo run:android
```

### Production APK
```bash
eas build --platform android --profile production --local
```

## Project Structure

```
QIK/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigator screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry/routing logic
│   ├── onboarding.tsx     # Roll number input
│   └── sign-in.tsx        # Authentication
├── components/            # Reusable components
├── services/              # API and storage services
├── assets/                # Images, fonts
└── docs/                  # Website (gh-pages)
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is private and intended for N.B.K.R. Institute students only.

## Contact

- **Developer**: Murali Aggipothu
- **Email**: muraliaggipothu@gmail.com
- **Website**: [qik.tobioffice.dev](https://qik.tobioffice.dev)

---

<p align="center">Built with ❤️ for NBKRIST students</p>
