# 🍉🗡️ FruitFit

Hey there! Welcome to **FruitFit**! 👋

This is just a **super fun, experimental side project** I built to mess around with browser-based hand tracking. The idea is simple: turn your webcam into a motion controller and slice virtual fruits like a ninja, right in your browser! No VR headsets or fancy controllers needed. 

I made this just for fun to see how well MediaPipe's hand tracking could run in a React game loop, and honestly, it turned out pretty awesome. The game runs entirely locally in your browser, so your webcam feed never leaves your device.

## What is it?
- A fast-paced, fruit-slicing mini-game.
- Uses your webcam and tracks your index finger as the sword. 🗡️
- Just a fun experiment to burn a few calories from your chair!

## How to play
1. Allow camera access (don't worry, everything stays on your device!).
2. Stand back a little or just use your hands.
3. Swipe your index finger through the air to slice fruits and avoid the bombs! 💣

## Tech Stack
- **React & Vite** for the UI and fast builds.
- **MediaPipe Tasks Vision** for the magic hand tracking.
- **Tailwind CSS** for making things look pretty.
- A custom, vanilla JS game engine I whipped up to handle the physics, drawing, and performance optimization (so it doesn't melt your laptop!).

## Running it locally

If you want to poke around the code:
```bash
npm install
npm run dev
```

---
*Just a fun project made to learn and experiment. Enjoy! 🍎🍍🍉*
