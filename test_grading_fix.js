
import { checkCorrectness } from './src/services/grading.service.js';

// Simple unit test for checkCorrectness and potential fuzzy logic if I moved it there
// But I implemented fuzzy logic in gradeSubmission which is harder to test without a DB.
// Let's at least test if I can simulate the fuzzy lookup.

const studentAnswers = {
    "q - q1 ": "correct_val",
    "q-q2": "wrong_val"
};

const keys = {
    "q1": "correct_val",
    "q2": "correct_val"
};

console.log("Testing Fuzzy Lookup Simulation...");

for (const [qId, correctAnswer] of Object.entries(keys)) {
    let studentAnswer = studentAnswers[qId];
    
    if (studentAnswer === undefined) {
        const normalizedQid = qId.replace(/\s+/g, '');
        const alternativeKey = Object.keys(studentAnswers).find(k => k.replace(/\s+/g, '') === normalizedQid);
        if (alternativeKey) {
            studentAnswer = studentAnswers[alternativeKey];
            console.log(`PASS: Found fuzzy match for ${qId} -> ${alternativeKey}`);
        } else {
            console.log(`FAIL: Could not find match for ${qId}`);
        }
    } else {
        console.log(`PASS: Direct match for ${qId}`);
    }
}
