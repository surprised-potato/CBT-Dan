# 📝 Development To-Do List
**Project:** Mobile-First Assessment Platform (Vanilla JS + Firebase)

## 📌 Phase 0: Setup & Foundation
*Goal: Get the environment ready and confirm Tailwind is working.*

- [x] **0.1. File Structure Setup**
    - [x] Create root folder `assessment-app`.
    - [x] Create subfolders: `src/core`, `src/shared`, `src/services`, `src/features`.
    - [x] Create `src/assets` folder.
    - [x] Create empty files: `index.html`, `app.js`, `style.css`.
- [x] **0.2. HTML & CSS Shell**
    - [x] Setup `index.html` boilerplate (HTML5).
    - [x] Add `<meta name="viewport" ...>` tag for mobile scaling.
    - [x] Add Tailwind CSS CDN script to `<head>`.
    - [x] Link `app.js` as `type="module"`.
- [x] **0.3. Firebase Initialization**
    - [x] Create project in Firebase Console.
    - [/] Enable **Authentication** (Email/Password provider).
    - [/] Enable **Firestore Database** (Start in Test Mode).
    - [x] Create `src/core/config.js`.
    - [x] Paste Firebase Config keys.
    - [x] Export `app`, `db`, and `auth` instances.
- [x] **0.4. Smoke Test**
    - [x] Add a styled Tailwind button to `index.html` to verify CSS works.
    - [x] Console log the `db` object in `app.js` to verify Firebase connection.

---

## 📌 Phase 1: Core Architecture (Router & State)
*Goal: Navigate between views without refreshing the page.*

- [x] **1.1. Global State Store (`src/core/store.js`)**
    - [x] Create `store` object with `currentUser` and `theme` properties.
    - [x] Export `setState` and `getState` functions.
- [x] **1.2. Router Engine (`src/core/router.js`)**
    - [x] Create `routes` object (mapping hashes like `#login` to functions).
    - [x] Implement `initRouter` function to listen for `hashchange`.
    - [x] Implement `navigateTo` helper function.
- [x] **1.3. View Injection Logic**
    - [x] Create a `<div id="app"></div>` in `index.html`.
    - [x] Ensure router clears `#app` innerHTML before rendering new view.

---

## 📌 Phase 2: Shared Component Library (UI)
*Goal: Create reusable UI blocks (Mobile-First).*

- [x] **2.1. Button Component (`src/shared/button.js`)**
    - [x] Export `renderButton(props)`.
    - [x] Style with `w-full`, `min-h-[44px]` (touch target), `rounded-lg`.
- [x] **2.2. Input Component (`src/shared/input.js`)**
    - [x] Export `renderInput(props)`.
    - [x] Style with `p-4`, `text-base` (prevent iOS zoom).
- [x] **2.3. Loading Spinner (`src/shared/loader.js`)**
    - [x] Create a simple CSS/SVG spinner for async states.
- [x] **2.4. UI Test Page**
    - [x] Create `src/features/test/ui-test.page.js`.
    - [x] Render inputs and buttons.
    - [x] **Manual Test:** Open on phone to check touch sizes.

---

## 📌 Phase 3: Authentication & Roles
*Goal: Handle Users, Teachers, and Students.*

- [x] **3.1. Auth Service (`src/services/auth.service.js`)**
    - [x] Implement `registerUser(email, pass, role)`.
    - [x] Implement `loginUser(email, pass)`.
    - [x] Implement `logoutUser()`.
    - [x] Implement `observeAuthChanges()` (Firebase listener).
- [x] **3.2. Login UI**
    - [x] Create `src/features/auth/login.ui.js` (Template).
    - [x] Create `src/features/auth/login.page.js` (Logic).
    - [x] Connect Form Submit to `auth.service`.
- [x] **3.3. Register UI (Dev Only)**
    - [x] Create `src/features/auth/register.page.js`.
    - [x] Add Dropdown for Role (Teacher/Student).
- [x] **3.4. Role-Based Redirects**
    - [x] Update `router.js` middleware.
    - [x] If role is 'student', go to `#student-dash`.
    - [x] If role is 'teacher', go to `#teacher-dash`.
- [x] **3.5. Google Authentication**
    - [x] Enable Google Provider.
    - [x] Implement `signInWithPopup` in Service.
    - [x] Add Google Button to Login UI.

---

## 📌 Phase 4: Question Bank (Teacher)
*Goal: Create and manage content.*

- [x] **4.1. Data Service (`src/services/question-bank.service.js`)**
    - [x] Implement `addQuestion(data)`.
    - [x] Implement `getQuestions(filters)`.
- [x] **4.2. Question Renderers (`src/features/question-bank/types/`)**
    - [x] Create `mcq.js` (Accepts question data, returns HTML).
    - [x] Create `true-false.js`.
    - [x] Create `identification.js`.
    - [x] Create `matching.js` (Start simple: A/B columns).
- [x] **4.3. Question Editor Page**
    - [x] Create `src/features/question-bank/editor.page.js`.
    - [x] Implement dynamic form (Show "Add Choice" button only if MCQ selected).
    - [x] Implement Save logic (Writes to Firestore).
- [x] **4.4. Academic Organization (Refactor)**
    - [x] Update Data Model (Course/Topic hierarchy).
    - [x] Create `bank.page.js` (Manager View).
    - [x] Update Editor inputs to be dynamic.

---

## 📌 Phase 5: Classes & Curriculum
*Goal: Organize Students.*

- [x] **5.1. Class Service (`src/services/class.service.js`)**
    - [x] Implement `createClass(name, section)`.
    - [x] Implement `joinClass(code)`.
    - [x] Implement `approveStudent(classId, studentId)`.
- [x] **5.2. Teacher Dashboard**
    - [x] Show list of created classes.
    - [x] Show "Pending Requests" list with Approve buttons.
- [x] **5.3. Student Dashboard**
    - [x] Show "Join Class" input.
    - [x] Show list of enrolled classes.

---

## 📌 Phase 6: Assessment Builder (The Split-Brain)
*Goal: Securely generate tests.*

- [x] **6.1. Assessment Service (`src/services/assessment.service.js`)**
    - [x] Implement `generateAssessment(config)`.
    - [x] **CRITICAL:** Implement the logic to split data into `assessment_content` and `assessment_keys`.
    - [x] Implement `batch.commit()` to save both docs simultaneously.
- [x] **6.2. Wizard UI (`src/features/assessment/wizard.page.js`)**
    - [x] UI to select Course/Topic.
    - [x] UI to input number of questions per type.
    - [x] "Create" button triggering the service.

---

## 📌 Phase 7: The Test Taker (Student)
*Goal: Distraction-free, secure testing.*

- [x] **7.1. Taker Logic (`src/features/assessment/taker.page.js`)**
    - [x] Fetch `assessment_content` (Verify NO answers in payload).
    - [x] Loop through questions and reuse Renderers from Phase 4.2.
- [x] **7.2. State Persistence**
    - [x] Add `input` event listeners to all fields.
    - [x] Save state to `localStorage` on every keystroke/click.
    - [x] Restore state from `localStorage` on page load.
- [x] **7.3. Submission**
    - [x] Create `src/services/submission.service.js`.
    - [x] Implement `submitTest(answers)`.
    - [x] Clear `localStorage` after success.

---

## 📌 Phase 8: Grading & Reporting
*Goal: Calculate scores client-side (Teacher).*

- [x] **8.1. Grading Logic (`src/services/grading.service.js`)**
    - [x] Implement `gradeSubmission(subId, testId)`.
    - [x] Logic: Fetch Key $\to$ Fetch Answer $\to$ Compare $\to$ Update Score.
- [x] **8.2. Report Page (`src/features/assessment/report.page.js`)**
    - [x] Fetch all submissions for a test.
    - [x] Render a Table: Student Name | Score | Status.
    - [x] Add "Grade All" button.

---

## 📌 Phase 9: Security & Deployment
*Goal: Lock it down.*

- [ ] **9.1. Firestore Rules**
    - [ ] Open Firebase Console.
    - [ ] Paste rules to deny Student access to `assessment_keys` and `questions`.
    - [ ] Allow Teachers full access.
- [ ] **9.2. Code Cleanup**
    - [ ] Remove "Dev Register" page (or hide it).
    - [ ] Remove `console.log` statements exposing data.
- [ ] **9.3. Deployment**
    - [ ] Push code to GitHub.
    - [ ] Enable GitHub Pages (Source: Main branch / Root).
    - [ ] Verify live URL works on mobile data (simulate real student).