console.log("App starting...");

// Import config (optional, ensures firebase init)
import './src/core/config.js';

import { initRouter, addRoute, navigateTo } from './src/core/router.js';
import { LoginPage } from './src/features/auth/login.page.js';
import { RegisterPage } from './src/features/auth/register.page.js';
import { EditorPage } from './src/features/question-bank/editor.page.js';
import { StudentDashPage } from './src/features/dashboard/student-dash.page.js';
import { TeacherDashPage } from './src/features/dashboard/teacher-dash.page.js';
import { AssessmentBankPage } from './src/features/assessment/assessment-bank.page.js';
import { DetailsPage } from './src/features/assessment/details.page.js';
import { WizardPage } from './src/features/assessment/wizard.page.js';
import { TakerPage } from './src/features/assessment/taker.page.js';
import { ResultsPage } from './src/features/assessment/results.page.js';
import { ReportPage } from './src/features/assessment/report.page.js';
import { BankPage } from './src/features/question-bank/bank.page.js';
import { BulkImportPage } from './src/features/question-bank/bulk-import.page.js';
import { PrintablePage } from './src/features/printable/printable.page.js';
import { ClassManagerPage } from './src/features/dashboard/class-manager.page.js';
import { UITestPage } from './src/features/test/ui-test.page.js';
import { observeAuthChanges } from './src/services/auth.service.js';

// --- Register Routes ---
addRoute('#login', LoginPage);
addRoute('#register', RegisterPage);
addRoute('#editor', EditorPage);
addRoute('#student-dash', StudentDashPage);
addRoute('#teacher-dash', TeacherDashPage);
addRoute('#assessment-bank', AssessmentBankPage);
addRoute('#details', DetailsPage);
addRoute('#wizard', WizardPage);
addRoute('#taker', TakerPage);
addRoute('#results', ResultsPage);
addRoute('#report', ReportPage);
addRoute('#bank', BankPage);
addRoute('#bulk-import', BulkImportPage);
addRoute('#printable', PrintablePage);
addRoute('#class-manager', ClassManagerPage);
addRoute('#test-ui', UITestPage);
// Add a default route or alias
addRoute('', LoginPage);

// --- Start the App ---
observeAuthChanges((user) => {
    console.log("Auth State Changed:", user);
});

initRouter();
