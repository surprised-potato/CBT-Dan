
// src/services/analytics.service.js

/**
 * Calculates item analysis statistics for a set of submissions.
 * @param {Array} submissions - Array of submission objects
 * @param {Array} questions - Array of question objects
 * @returns {Array} - Array of question stats
 */
export const calculateItemStatistics = (submissions, questions) => {
    if (!submissions || submissions.length === 0) return [];

    // 1. Sort submissions by total score to find Upper/Lower groups
    const sortedSubs = [...submissions].sort((a, b) => b.score - a.score);
    const n = sortedSubs.length;

    // For small matching, we just split in half. For larger, we can use top/bottom 27%.
    // Using 27% is standard for discrimination index, but let's stick to simple 33% or 50% for small classes.
    // Let's use 27% rule if N >= 20, else 50%.
    const splitRatio = n >= 20 ? 0.27 : 0.5;
    const splitCount = Math.ceil(n * splitRatio);

    const upperGroup = sortedSubs.slice(0, splitCount);
    const lowerGroup = sortedSubs.slice(n - splitCount, n);

    return questions.map(q => {
        let correctCount = 0;
        let upperCorrect = 0;
        let lowerCorrect = 0;
        const answerCounts = {}; // { 'A': 10, 'B': 2 }

        submissions.forEach(sub => {
            const ans = sub.answers[q.id];
            const isCorrect = isAnswerCorrect(q, ans, sub.assessmentId); // We need keys? 
            // Wait, we don't have the keys passed in. 
            // We can infer correctness from the score if we had per-question score, 
            // but currently submission only has total score.
            // We need to re-evaluate correctness or rely on `isCorrect` being stored?
            // Current submission doesn't store per-question correctness status.
            // WE MUST FETCH KEYS or pass them in.

            // Logic adjust: The caller should pass enriched submissions OR keys.
            // Let's assume the caller passes in keys or we fetch them?
            // Ideally this is a pure function. 

            // Let's implement a helper `checkCorrectness` identical to the one in grading/results.
            // But we don't have the keys here.
            // REFACTOR: We need keys.
        });
    });
};

// Helper: Normalize
const normalize = (str) => String(str || '').trim().toLowerCase();

/**
 * We need the Answer Keys to determine if an answer is correct for statistics.
 */
export const calculateAnalytics = (submissions, assessment, keys) => {
    if (!submissions.length) return { itemStats: [], topicStats: [] };

    // --- 1. Pre-process Submissions (Mark Correctness) ---
    const gradedSubs = submissions.map(sub => {
        const correctness = {}; // { qId: 1 | 0 }

        assessment.questions.forEach(q => {
            const studentAns = sub.answers[q.id];
            const keyAns = keys[q.id];
            correctness[q.id] = checkCorrectness(q, studentAns, keyAns) ? 1 : 0;
        });

        return { ...sub, correctness };
    });

    // --- 2. Item Analysis ---
    const sortedSubs = [...gradedSubs].sort((a, b) => b.score - a.score);
    const n = sortedSubs.length;
    const splitRatio = n >= 20 ? 0.27 : 0.5;
    const splitCount = Math.max(1, Math.ceil(n * splitRatio)); // Ensure at least 1

    const upperGroup = sortedSubs.slice(0, splitCount);
    const lowerGroup = sortedSubs.slice(n - splitCount, n);

    const itemStats = assessment.questions.map(q => {
        const totalCorrect = gradedSubs.reduce((acc, s) => acc + s.correctness[q.id], 0);

        // Difficulty (p-value): % Correct
        const pValue = totalCorrect / n;

        // Discrimination (D): (UpperCorrect - LowerCorrect) / GroupSize
        const upperCorrect = upperGroup.reduce((acc, s) => acc + s.correctness[q.id], 0);
        const lowerCorrect = lowerGroup.reduce((acc, s) => acc + s.correctness[q.id], 0);

        const dIndex = (upperCorrect - lowerCorrect) / splitCount;

        // Status Interpretation
        let status = 'GOOD';
        if (pValue < 0.2) status = 'TOO DIFFICULT';
        if (pValue > 0.9) status = 'TOO EASY';
        if (dIndex < 0.1) status = 'POOR DISCRIMINATION';
        if (dIndex < 0) status = 'MISKEYED? (Negative)';

        // Distractor Analysis (Choice counts)
        const choiceCounts = {};
        gradedSubs.forEach(s => {
            const ans = s.answers[q.id];
            const strAns = Array.isArray(ans) ? ans.join(',') : String(ans);
            choiceCounts[strAns] = (choiceCounts[strAns] || 0) + 1;
        });

        return {
            id: q.id,
            text: q.text,
            topic: q.topic || 'Uncategorised',
            type: q.type,
            stats: {
                totalAttempts: n,
                correctCount: totalCorrect,
                difficulty: parseFloat(pValue.toFixed(2)),
                discrimination: parseFloat(dIndex.toFixed(2)),
                status,
                distractors: choiceCounts
            }
        };
    });

    // --- 3. Topic Performance ---
    const topicMap = {}; // { 'Calculus': { pointsEarned: 10, totalPoints: 20 } }

    // Calculate total possible points per topic from Assessment
    const topicTotals = {};
    assessment.questions.forEach(q => {
        const t = q.topic || 'Uncategorised';
        const p = parseInt(q.sectionPoints !== undefined ? q.sectionPoints : (q.points !== undefined ? q.points : 1));
        topicTotals[t] = (topicTotals[t] || 0) + p;
    });

    // Calculate earned points
    gradedSubs.forEach(sub => {
        assessment.questions.forEach(q => {
            if (sub.correctness[q.id]) {
                const t = q.topic || 'Uncategorised';
                const p = parseInt(q.sectionPoints !== undefined ? q.sectionPoints : (q.points !== undefined ? q.points : 1));
                // We need to aggregate across all students or per student?
                // The requirement says "identify student performance on specific topics"
                // This function is likely for "Teacher Class Overview".
                // We also need a per-student function.
            }
        });
    });

    // Let's do Class-Level Topic Performance here
    const classTopicStats = Object.keys(topicTotals).map(topic => {
        let totalEarned = 0;
        let totalPossible = topicTotals[topic] * n; // Max points * number of students

        gradedSubs.forEach(sub => {
            assessment.questions.forEach(q => {
                if ((q.topic || 'Uncategorised') === topic && sub.correctness[q.id]) {
                    totalEarned += parseInt(q.sectionPoints !== undefined ? q.sectionPoints : (q.points !== undefined ? q.points : 1));
                }
            });
        });

        return {
            topic,
            earned: totalEarned,
            possible: totalPossible,
            percentage: totalPossible === 0 ? 0 : Math.round((totalEarned / totalPossible) * 100)
        };
    });

    return { itemStats, classTopicStats };
};

export const calculateStudentTopicPerformance = (submission, assessment, keys) => {
    // Single student analysis
    const topicMap = {};

    assessment.questions.forEach(q => {
        const t = q.topic || 'General';
        const p = parseInt(q.sectionPoints !== undefined ? q.sectionPoints : (q.points !== undefined ? q.points : 1));

        if (!topicMap[t]) topicMap[t] = { earned: 0, total: 0 };

        topicMap[t].total += p;

        const ans = submission.answers[q.id];
        const key = keys[q.id];
        if (checkCorrectness(q, ans, key)) {
            topicMap[t].earned += p;
        }
    });

    return Object.entries(topicMap).map(([topic, stats]) => ({
        topic,
        earned: stats.earned,
        total: stats.total,
        percentage: stats.total === 0 ? 0 : Math.round((stats.earned / stats.total) * 100)
    }));
};

// --- Logic from results.page.js / grading.service.js ---
const checkCorrectness = (q, studentAns, keyAns) => {
    if (Array.isArray(keyAns)) {
        if (Array.isArray(studentAns)) {
            if (studentAns.length !== keyAns.length) return false;
            if (q.type === 'MULTI_ANSWER') {
                return studentAns.every(v => keyAns.includes(v)) && keyAns.every(v => studentAns.includes(v));
            } else if (q.type === 'MATCHING') {
                return studentAns.every((v, idx) => {
                    const def = keyAns[idx]?.definition;
                    return def && normalize(v) === normalize(def);
                });
            } else if (q.type === 'ORDERING') {
                return studentAns.every((v, idx) => {
                    const key = keyAns[idx];
                    return key && normalize(v) === normalize(key);
                });
            }
            return studentAns.every((v, idx) => {
                const key = keyAns[idx];
                return key && normalize(v) === normalize(key);
            });
        } else if (typeof studentAns === 'string') {
            return keyAns.some(v => normalize(studentAns) === normalize(v));
        }
    }
    return normalize(studentAns) === normalize(keyAns);
};
