
---

### **Phase 0: Project Foundation & Environment** (✅ DONE)
*Goal: Directory structure setup and verifying Tailwind CSS is working.*

*   [ ] **0.1. File System Setup**
    *   Create the exact folder structure defined in the PRD (`src/core`, `src/shared`, `src/features`, `src/services`).
    *   Create `index.html`, `style.css`, and `app.js`.
*   [ ] **0.2. Tailwind Integration**
    *   Add the Tailwind CDN script to `index.html` head for dev speed:
        `<script src="https://cdn.tailwindcss.com"></script>`
    *   Add `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`.
*   [ ] **0.3. Firebase Config**
    *   Create `src/core/config.js`.
    *   Paste your Firebase keys (from Firebase Console). Export `db` and `auth`.

**✅ Manual Test:** Create a `<h1 class="text-3xl font-bold text-red-500">Hello World</h1>` in `index.html`. Open in browser. If it's big, bold, and red, you are ready.

---

### **Phase 1: The Application Core (Router & Store)** (✅ DONE)
*Goal: A working Single Page Application (SPA) shell that can navigate between views.*

*   [ ] **1.1. The Store (`src/core/store.js`)**
    *   Create a simple state object: `state = { currentUser: null, theme: 'light' }`.
    *   Export functions: `getUser()`, `setUser(user)`.
*   [ ] **1.2. The Router Engine (`src/core/router.js`)**
    *   Create `routes` object mapping hashes (`#login`, `#dashboard`) to functions.
    *   Implement `initRouter()`: Listens to `window.hashchange`. Clears `<div id="app">`. Calls the mapped function.
    *   Implement `navigateTo(route)` helper.
*   [ ] **1.3. Placeholder Pages**
    *   Create `src/features/auth/login.page.js` (Export a function that renders `<h1>Login Page</h1>`).
    *   Create `src/features/dashboard/student-dash.page.js` (Export `<h1>Student Dash</h1>`).
    *   Wire these into `router.js`.

**✅ Manual Test:** Open `index.html`. Manually type `#login` in the URL bar. The screen should clear and show "Login Page". Type `#dashboard`, it should switch.

---

### **Phase 2: The Shared UI Component Library** (✅ DONE)
*Goal: Build the visual "LEGO blocks" so we don't write HTML in our logic files later.*

*   [ ] **2.1. The Button Component (`src/shared/button.js`)**
    *   Export `renderButton({ text, onClick, variant })`.
    *   Use Tailwind classes: `w-full p-4 rounded-xl font-bold text-white transition-all active:scale-95`.
    *   *Variants:* Primary (Blue), Secondary (Gray), Danger (Red).
*   [ ] **2.2. The Input Component (`src/shared/input.js`)**
    *   Export `renderInput({ type, placeholder, id })`.
    *   Style: `w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500`.
*   [ ] **2.3. The Kitchen Sink (Temporary Test View)**
    *   Create `src/features/test/ui-test.page.js`.
    *   Import Button and Input. Render them all on one screen.
    *   Add this route to `router.js` as `#test-ui`.

**✅ Manual Test:** Navigate to `#test-ui` on your mobile phone (using Network IP). Verify buttons are "thumb-sized" (at least 44px height) and inputs don't zoom the screen (font-size 16px+).

---

### **Phase 3: Authentication & Role Logic** (✅ DONE)
*Goal: Real users logging in and being routed based on Teacher vs. Student.*

*   [x] **3.X. [ADDED] Google Authentication**
    *   Enable Google Provider in Firebase.
    *   Implement `signInWithPopup`.

*   [ ] **3.1. Auth Service (`src/services/auth.service.js`)**
    *   Implement `login(email, password)`.
    *   Implement `register(email, password, role)`. (This writes to `users` collection).
*   [ ] **3.2. Login UI (`src/features/auth/login.ui.js`)**
    *   Import `renderInput` (Email, Pass) and `renderButton` (Login).
    *   Return the HTML string.
*   [ ] **3.3. Login Controller (`src/features/auth/login.page.js`)**
    *   Inject `login.ui`.
    *   Add Event Listener to Form Submit.
    *   Call `authService.login()`.
    *   On success: Fetch User Role $\to$ Store in `store.js` $\to$ Redirect.

**✅ Manual Test:** Create a user in Firebase Console (or build a temp register page). Log in. If role is 'teacher', app redirects to `#teacher-dash`. If 'student', to `#student-dash`.

---

### **Phase 4: The Question Engine (UI & Data)** (✅ DONE)
*Goal: Building the visual renderers for questions and the CRUD mechanism.*

*   [x] **4.4. [ADDED] Academic Organization Refactor**
    *   Update `addQuestion` for Course/Topic fields.
    *   Create **Question Bank Manager** (`bank.page.js`) to view/filter questions.

*   [ ] **4.1. Question Renderers (`src/features/question-bank/question-types/`)**
    *   Create `mcq.js`: Accepts `{text, choices[]}`. Returns HTML with radio buttons.
    *   Create `identification.js`: Accepts `{text}`. Returns HTML with text input.
    *   *Test:* Update `#test-ui` to render these with dummy data to see how they look.
*   [ ] **4.2. Question Bank Service (`src/services/question-bank.service.js`)**
    *   Implement `addQuestion(questionData)`. (Writes to `questions` collection).
    *   Implement `getQuestionsByTopic(topic)`.
*   [ ] **4.3. Question Editor Page (`src/features/question-bank/editor.page.js`)**
    *   Build a form with Dropdowns (Course, Topic, Type).
    *   *Logic:* When "Type" changes, dynamically insert different input fields (e.g., if MCQ, show "Add Choice" button).
    *   Submit button calls `addQuestion`.

**✅ Manual Test:** Log in as Teacher. Go to Editor. Create an MCQ. Check Firestore Console. Verify the document exists with `correct_answer` field.

---

### **Phase 5: Class Management** (✅ DONE)
*Goal: Linking students to teachers.*

*   [ ] **5.1. Class Service (`src/services/class.service.js`)**
    *   `createClass(name)`: Generates random 6-char code.
    *   `joinClass(code, studentUid)`: Adds to subcollection.
*   [ ] **5.2. Teacher Class Dashboard**
    *   List classes. Show "Join Code".
    *   Show "Pending Approvals" list.
*   [ ] **5.3. Student Enrollment**
    *   Input field for "Class Code".
    *   Call `joinClass`.

**✅ Manual Test:** Open two browsers (Incognito). Browser A (Teacher) creates class "Math". Browser B (Student) enters code. Teacher approves. Student refreshes and sees "Math" in list.

---

### **Phase 6: Assessment Creation (The Split-Brain)** (✅ DONE)
*Goal: Generating the test and splitting data for security.*

*   [ ] **6.1. Assessment Service (`src/services/assessment.service.js`)**
    *   `generateAssessment(criteria)`:
        1. Fetch Questions.
        2. Randomize/Slice.
        3. Create `contentPayload` (No answers).
        4. Create `keysPayload` (Answers only).
        5. Batch write to `assessment_content` and `assessment_keys`.
*   [ ] **6.2. Wizard UI (`src/features/assessment/wizard.page.js`)**
    *   Simple form: Select Topic, Input Quantity (e.g., "5 Questions").
    *   "Create" button triggers service.

**✅ Manual Test:** Use Wizard to create a test. Go to Firebase Console. **Crucial:** Verify `assessment_content` doc has questions but `correct_answer` is undefined/removed. Verify `assessment_keys` has the answers.

---

### **Phase 7: The Secure Test Taker**
*Goal: Student takes the test without access to answers.*

*   [ ] **7.1. Taker Page (`src/features/assessment/taker.page.js`)**
    *   URL parameter: `#take-test?id=123`.
    *   Fetch `assessment_content/123`.
    *   Loop through questions $\to$ Import `renderMCQ` / `renderID` from Phase 4.1.
    *   Append to DOM.
*   [ ] **7.2. State Persistence logic**
    *   Add `change` listener to `#app`.
    *   On any input change: `localStorage.setItem('current_answers', JSON.stringify(answers))`.
    *   On page load: Read localStorage and pre-fill inputs.
*   [ ] **7.3. Submission**
    *   "Submit" button writes `localStorage` data to `submissions` collection.
    *   Clears `localStorage`.

**✅ Manual Test:** Start test. Select "Option A". Refresh Page. "Option A" should still be selected. Open Console -> Network Tab -> Verify no answer keys were sent in the JSON response.

---

### **Phase 8: Grading & Reporting**
*Goal: Teacher calculates scores.*

*   [ ] **8.1. Grading Service (`src/services/grading.service.js`)**
    *   `gradeSubmission(submissionId, testId)`:
        1. Fetch `assessment_keys/testId`.
        2. Fetch `submissions/submissionId`.
        3. Compare. Calculate Score.
        4. Update `submissions` doc.
*   [ ] **8.2. Report Page (`src/features/assessment/report.page.js`)**
    *   List all students for a test.
    *   "Grade All" button.
    *   Display Score column.

**✅ Manual Test:** Submit a test as Student (Score is null). Log in as Teacher. Click "Grade". Verify Student score updates in database.

---
## Phase 6: Question Editor Refinements & Fixes
- [ ] **Initialization Refactor**: Ensure `getQuestionById` completes before UI-type resets are triggered.
- [ ] **Metadata Sync**: Ensure Topic datalist populates correctly when a Course is pre-filled.
- [ ] **Visual Feedback**:
    - [ ] Update Submit Button text on load.
    - [ ] Add Loading indicator during fetch.
    - [ ] Redirect "Cancel" to `#bank`.
- [x] **Validation Improvements**: Ensure all fields are correctly validated before update.

---
## Phase 7: Advanced Question Editor
- [ ] **Enhanced Selection**: Implement searchable dropdowns for Course/Topic that fuzzy-filter existing data.
- [ ] **WYSIWYG Editor**:
    - [ ] Integrate Quill.js.
    - [ ] Add Heading, Bold, Underline options.
    - [ ] **Math Support**: Integrate KaTeX for LaTeX equation rendering within the editor.
- [ ] **Rendering**: Ensure the Bank Page and Test Taker correctly render the HTML/Math content.


### **Phase 9: Polish & Deploy**
*   [ ] **9.1. Firestore Security Rules**
    *   Apply the rules preventing Students from reading `assessment_keys` or `questions` (Bank).
*   [ ] **9.2. Deployment**
    *   Push code to GitHub.
    *   Enable GitHub Pages.

**✅ Final Test:** Ask a friend to log in as a student on their phone using the live link. You manage it from your laptop. Run a full exam cycle.