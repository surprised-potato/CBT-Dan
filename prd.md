Here is the **Revised PRD (v2.0)** with a focus on high modularity.

---

# Product Requirements Document (PRD) v2.1
**Project:** Mobile-First Assessment Platform
**Focus:** Highly Modular Vanilla JS Architecture
**Philosophy:** Separation of Concerns (Data vs. UI vs. Logic)
**Latest Feature Additions:** Google Auth, Academic Course Hierarchy.

## 1. Architectural Philosophy: The "SCP" Pattern
To ensure modularity without a framework, every feature will follow the **Service-Component-Page** pattern:

1.  **Services (Data Layer):** Pure JavaScript. No DOM manipulation. Handles Firebase, calculations, and data transformation.
2.  **Components (UI Layer):** Pure Functions. They take data in and return an HTML String. They are dumb (don't know about the database).
3.  **Pages/Controllers (Glue Layer):** They import a Service and a Component. They fetch data from the Service, pass it to the Component, inject the HTML into the DOM, and attach Event Listeners.

---

## 2. Revised Directory Structure (The "Feature Slices")

Instead of generic folders, we organize by **Domain**.

```text
/src
  /assets             # Static images
  /core               # The Application "Brain"
    ├── config.js     # Firebase Init
    ├── router.js     # Hash-based routing logic
    ├── store.js      # Lightweight global state (User session, Theme)
    └── utils.js      # Helpers (Format dates, unique IDs)

  /shared             # Reusable UI elements (dumb components)
    ├── button.js
    ├── input.js
    └── modal.js

  /services           # API Wrappers (The only files that touch Firebase)
    ├── auth.service.js
    ├── class.service.js
    ├── question-bank.service.js
    ├── assessment.service.js
    └── grading.service.js

  /features           # Business Logic & UI
    ├── auth/
    │   ├── login.page.js      # Controller (Supports Email & Google)
    │   └── login.ui.js        # HTML Template
    ├── dashboard/
    │   ├── student-dash.page.js
    │   ├── teacher-dash.page.js
    │   └── dash.ui.js
    ├── question-bank/
    │   ├── editor.page.js
    │   ├── bank.page.js       # [NEW] Question Manager (Library View)
    │   └── question-types/    # Modular Question Renderers
    │       ├── mcq.js
    │       ├── identification.js
    │       └── matching.js
    └── assessment/
        ├── wizard.page.js     # Test Creator
        ├── taker.page.js      # Student Test View
        └── report.page.js     # Teacher Results View

  app.js              # Entry point (Main)
  index.html          # Single HTML file
```

---

## 3. Modular Implementation Standards

To ensure the "Manual Testing" requirement works, every module must follow this contract:

### 3.1 The Component Contract (UI)
Every UI file (e.g., `mcq.js`) must export a `render` function. It returns a string. It does **not** document.querySelector.

```javascript
// src/features/question-bank/question-types/mcq.js
export const renderMCQ = (questionData, index) => {
  return `
    <div class="card p-4 mb-4">
      <p>Q${index}: ${questionData.text}</p>
      <div class="flex flex-col gap-2">
        ${questionData.choices.map(c => `
           <button class="choice-btn border p-3" data-id="${c.id}">${c.text}</button>
        `).join('')}
      </div>
    </div>
  `;
};
```

### 3.2 The Service Contract (Data)
Services return Promises resolving to raw data.

```javascript
// src/services/question-bank.service.js
import { db } from '../../core/config.js';
// ... imports

export const fetchQuestionsByTopic = async (topicId) => {
  // Firestore logic here
  return list; // Returns Array of Objects
};
```

### 3.3 The Page Contract (Controller)
This is where the app "runs".

```javascript
// src/features/assessment/taker.page.js
import { fetchAssessmentContent } from '../../services/assessment.service.js';
import { renderMCQ } from '../question-bank/question-types/mcq.js';

export const AssessmentTakerPage = async (params) => {
  const container = document.getElementById('app');
  
  // 1. Show Loading State
  container.innerHTML = '<div class="spinner">Loading...</div>';

  // 2. Fetch Data (Service)
  const data = await fetchAssessmentContent(params.testId);

  // 3. Render UI (Component)
  // Logic to choose which component to render based on type
  const questionsHTML = data.questions.map((q, i) => {
      if(q.type === 'MCQ') return renderMCQ(q, i);
      return ''; 
  }).join('');

  container.innerHTML = `<h1>${data.title}</h1>${questionsHTML}`;

  // 4. Attach Listeners (Logic)
  document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => handleAnswer(e));
  });
};
```

---

## 4. Detailed Feature Modules

### 4.1 Core Module (`/core`)
*   **`router.js`**:
    *   Maps routes (`#login`, `#student/dash`) to Page Functions.
    *   Handles "Middleware" (e.g., checks if `store.currentUser` exists before allowing access to `#teacher/dash`).
*   **`store.js`**:
    *   A simple Pub/Sub system.
    *   Example: When a user logs in, `store.setUser(user)` is called. Components verify this user state.

### 4.2 Auth Module (`/features/auth`)
*   **Independent**: Can be built and tested before the rest of the app.
*   **Features**: Email/Password Login, Google OAuth Sign-In.
*   **Files**: `login.page.js`, `register.page.js`.

### 4.3 Question Bank Module (`/features/question-bank`)
*   **Organization**: Questions are now hierarchical: **Course** -> **Topic** -> **Question**.
*   **Manager UI**: A `bank.page.js` allows browsing the entire library by Course.
*   **Modular Rendering**: The `question-types` folder is critical.
*   **Scalability**: New types can be added easily.

### 4.4 Assessment Module (`/features/assessment`)
*   **Sub-module: `wizard.page.js`**
    *   Contains the logic for the "Auto-Chooser".
    *   Imports `fetchQuestions` from Service.
*   **Sub-module: `taker.page.js`**
    *   Contains the "Split-Brain" logic (only fetches Content).
    *   Handles the `localStorage` state saving.

---

## 5. UI/UX Guidelines (Updated for Modularity)

### 5.1 CSS Architecture (Tailwind)
Since we are using JS modules to inject HTML, we cannot rely on scoped CSS files (like in Vue).
*   **Strategy:** Heavy use of Tailwind utility classes directly in the JavaScript Template Strings.
*   **Shared Styles:** Common patterns (like a card style) should be defined in `styles.css` using `@apply` or saved as string constants in `/shared/styles.js` to avoid cluttering components.

```javascript
// src/shared/styles.js
export const CARD_CLASS = "bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100";
export const BTN_PRIMARY = "w-full bg-blue-600 text-white p-3 rounded-lg active:bg-blue-800";
```

---

## 6. Revised Implementation Phases (Modular Focus)

### Phase 1: The Core Infrastructure
1.  Set up the folder structure.
2.  Build `core/router.js`: It should successfully console log "Navigated to Login" when URL changes.
3.  Build `core/store.js`: Create a basic state object.

### Phase 2: Component Architecture Verification
1.  Create `shared/button.js` (Export a function returning a button string).
2.  Create `features/auth/login.ui.js` (Use the button component inside this).
3.  Create `features/auth/login.page.js` (Inject `login.ui` into DOM).
4.  **Test:** Ensure you can render a page composed of smaller components.

### Phase 3: Service Layer & Authentication
1.  Setup `services/auth.service.js` (Firebase Auth).
2.  Connect `login.page.js` to the Service.
3.  **Test:** Login flows working.

### Phase 4: The Question Engine (Question Bank)
1.  Build `services/question-bank.service.js`.
2.  Build `features/question-bank/question-types/mcq.js` (The renderer).
3.  Build `features/question-bank/editor.page.js` (The CRUD form).
4.  **Test:** Can you add a question? Can you fetch and display it using the generic renderer?

### Phase 5: The Assessment Ecosystem
1.  **Wizard:** `features/assessment/wizard.page.js` (Logic to pick questions).
2.  **Taker:** `features/assessment/taker.page.js` (Logic to render the test).
    *   *Note:* The Taker page will re-use the `mcq.js` component created in Phase 4! This proves the modularity works.

### Phase 6: Grading & Reporting
1.  `services/grading.service.js`: The logic to compare Student Answers vs Secure Keys.
2.  `features/assessment/report.page.js`: The UI to display the results.

---

## 7. Why this is better?
*   **Reusability:** The code that renders an MCQ for the *Teacher* (to preview) is the exact same file (`mcq.js`) used for the *Student* (to take the test).
*   **Debuggability:** If the matching type question is broken, you know exactly where to look (`features/question-bank/question-types/matching.js`).
*   **Workflows:** You can test the "UI" (how a question looks) without needing the Database connected, simply by passing dummy JSON to the render function.