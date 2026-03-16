# 🎨 Skribbl

A real-time multiplayer drawing and guessing game — inspired by [skribbl.io](https://skribbl.io). Built with TypeScript, featuring a dedicated frontend, backend, and shared component library.

---

## 📸 Overview

Skribbl is an online party game where players take turns drawing a word while others race to guess it in the chat. The faster you guess, the more points you earn!

---

## ✨ Features

- 🎮 **Real-time Multiplayer** — Play with friends in shared game rooms
- ✏️ **Interactive Drawing Canvas** — Draw with brush tools, colors, and an eraser
- 💬 **Live Chat & Guessing** — Guess words in real-time as others draw
- 🏆 **Scoring System** — Points awarded based on guess speed and drawing quality
- 🔄 **Turn-based Rounds** — Each player gets a turn to draw
- 🎯 **Word Selection** — Players choose from random word prompts each round
- 🚀 **Room System** — Create or join game rooms with friends

---

## 🗂️ Project Structure

```
Skribbl/
├── frontend/         # Client-side application (TypeScript/React)
├── backend/          # Server-side application (TypeScript/Node.js)
├── components/       # Shared UI components
├── package.json      # Root-level dependencies & scripts
└── package-lock.json
```

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | TypeScript, React, CSS               |
| Backend    | TypeScript, Node.js                  |
| Real-time  | Socket.IO                            |
| Language   | TypeScript (96.2%), CSS (3.0%)       |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/akshatx03x/Skribbl.git
   cd Skribbl
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

4. **Install backend dependencies**

   ```bash
   cd ../backend
   npm install
   ```

---

### Running the App

#### Development Mode

**Start the backend server:**

```bash
cd backend
npm run dev
```

**Start the frontend (in a new terminal):**

```bash
cd frontend
npm run dev
```

The frontend will typically be available at `http://localhost:3000` and the backend at `http://localhost:5000` (check your `.env` for exact ports).

---

## 🎮 How to Play

1. Open the app in your browser.
2. **Create a Room** — click "Create Room" to start a new game lobby and share the room code with friends.
3. **Join a Room** — enter a room code to join an existing game.
4. Once enough players are in, the game begins.
5. On your turn, **pick a word** and draw it on the canvas.
6. Other players type their guesses in the chat — the faster they guess, the more points they earn!
7. Scores are tallied at the end of each round.
8. The player with the most points at the end wins! 🏆

---

## 📁 Environment Variables

Create a `.env` file in the `backend/` directory and configure the following:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
```

And optionally in `frontend/`:

```env
VITE_SERVER_URL=http://localhost:5000
```

> ⚠️ Never commit `.env` files to version control.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a new branch: `git checkout -b feature/your-feature-name`
3. **Make** your changes and commit: `git commit -m "Add: your feature"`
4. **Push** to your branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please make sure your code follows the existing TypeScript conventions and is properly typed.

---

## 🐛 Issues

Found a bug or have a feature request? [Open an issue](https://github.com/akshatx03x/Skribbl/issues) on GitHub.

---

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**akshatx03x**  
GitHub: [@akshatx03x](https://github.com/akshatx03x)

---

> Built with ❤️ and TypeScript
