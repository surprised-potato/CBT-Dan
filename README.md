# CBT-Dan: Mobile-First Assessment Platform

CBT-Dan is a professional, framework-agnostic assessment system designed for high scalability and secure test-taking. Built with **Vanilla JavaScript** and **Tailwind CSS**, it offers a premium, app-like experience for both students and educators.

## 🚀 core Features
- **Secure Architecture**: "Split-brain" data model prevents client-side answer sniffing.
- **Harmonized Grading**: Centralized logic ensuring consistent results across Taker, Reports, and Analytics.
- **Resilient Sessions**: Real-time answer persistence to `localStorage` prevents data loss.
- **Mathematical Support**: Rich-text editing with LaTeX integration (MathLive/KaTeX).
- **Proctoring Readiness**: One-item-at-a-time mode, shuffling of items/choices, and countdown timers.

## 🏗️ Technical Stack
- **Engine**: Vanilla ES6 modules.
- **Styling**: Tailwind CSS (Utility-first design).
- **Persistence**: Firebase (Firestore & Authentication).
- **Editor**: Quill.js for advanced content authoring.

## 📁 Project Structure
- `/src/core`: Routing, global state, and configuration.
- `/src/services`: Data layer and shared business logic.
- `/src/features`: Domain-specific modules (Auth, Assessment, Question Bank).
- `/src/shared`: Reusable atomic UI components.

## 🛠️ Getting Started
1. Open `index.html` in a web browser.
2. Initialize Firebase configuration in `src/core/config.js`.
3. Start authoring questions in the **Resource Forge**.

---
*Maintained by the CBT-Dan Development Team.*
