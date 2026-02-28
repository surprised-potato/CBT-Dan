const students = [
    { uid: "1", displayName: "Alice Smith", email: "alice@test.com" },
    { uid: "2", email: "bob@test.com" },
    "studentUID-3"
];

const submissionsData = [
    {
        assessmentTitle: "Quiz 1",
        submissions: [
            { studentId: "1", score: 8, totalPoints: 10 },
            { studentId: "2", score: 9, totalPoints: 10 }
        ]
    }
];

const exportData = students.map(s => {
    const studentId = typeof s === 'string' ? s : s.uid;
    const studentName = typeof s === 'string' ? 'Unnamed' : (s.displayName || s.name || 'Unnamed');
    const studentEmail = typeof s === 'string' ? 'Unknown' : (s.email || 'Unknown');

    const row = { 'Student Name': studentName, 'Email': studentEmail };
    
    submissionsData.forEach(ad => {
        const sub = ad.submissions.find(subDoc => subDoc.studentId === studentId);
        row[ad.assessmentTitle] = sub ? (sub.score !== null ? `${sub.score}/${sub.totalPoints}` : 'Pending') : 'N/A';
    });
    return row;
});

console.log("Export Data:", exportData);
