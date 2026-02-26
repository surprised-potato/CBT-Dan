import { db } from '../core/config.js';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    query,
    where,
    arrayUnion,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { calculateDistance, generateSecureCode } from '../core/utils.js';
import { getClassesByTeacher, getStudentClasses } from './class.service.js';

const COLLECTION = 'attendance_sessions';
const CODE_TTL_MS = 5000; // 5 seconds

// ──────────────────────────────────
// Teacher Actions
// ──────────────────────────────────

/**
 * Start a new attendance session for a class.
 */
export const startSession = async ({ classId, className, teacherId, geofence, lateThresholdMinutes = 15, autoCloseMinutes = 0, note = '' }) => {
    const code = generateSecureCode();
    const now = Date.now();

    const payload = {
        classId,
        className,
        teacherId,
        status: 'active',
        geofence, // { lat, lng, radius }
        currentCode: code,
        codeExpiresAt: now + CODE_TTL_MS,
        lateThresholdMinutes,
        autoCloseMinutes,
        note,
        checkedIn: [],
        createdAt: new Date().toISOString(),
        closedAt: null
    };

    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
};

/**
 * Rotate the session code. Called every 5 seconds by the teacher terminal.
 */
export const rotateCode = async (sessionId) => {
    const code = generateSecureCode();
    const now = Date.now();
    await updateDoc(doc(db, COLLECTION, sessionId), {
        currentCode: code,
        codeExpiresAt: now + CODE_TTL_MS
    });
    return code;
};

/**
 * Close an active attendance session.
 */
export const closeSession = async (sessionId) => {
    await updateDoc(doc(db, COLLECTION, sessionId), {
        status: 'closed',
        closedAt: new Date().toISOString()
    });
};

/**
 * Listen to real-time changes on a session document (live feed).
 * Returns an unsubscribe function.
 */
export const listenToSession = (sessionId, callback) => {
    return onSnapshot(doc(db, COLLECTION, sessionId), (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() });
        }
    });
};

// ──────────────────────────────────
// Student Actions
// ──────────────────────────────────

/**
 * Submit a student check-in.
 * Validates: code match, code freshness, geofence, duplicate prevention.
 */
export const submitCheckin = async (sessionId, { uid, name, email }, code, lat, lng) => {
    const sessionRef = doc(db, COLLECTION, sessionId);
    const snap = await getDoc(sessionRef);

    if (!snap.exists()) throw new Error('Session not found.');

    const session = snap.data();

    if (session.status !== 'active') throw new Error('Session is no longer active.');

    // 1. Validate code
    if (session.currentCode !== code) throw new Error('Invalid or expired code. Please scan again.');

    // 2. Validate code freshness (allow small buffer for network latency)
    const BUFFER_MS = 3000;
    if (Date.now() > session.codeExpiresAt + BUFFER_MS) {
        throw new Error('Code expired. Please scan the latest QR code.');
    }

    // 3. Validate geofence
    if (session.geofence && session.geofence.lat != null) {
        const distance = calculateDistance(lat, lng, session.geofence.lat, session.geofence.lng);
        if (distance > session.geofence.radius) {
            throw new Error(`Outside authorized perimeter (${Math.round(distance)}m > ${session.geofence.radius}m allowed).`);
        }
    }

    // 4. Check duplicate
    const alreadyIn = session.checkedIn.some(s => s.uid === uid);
    if (alreadyIn) throw new Error('Already checked in for this session.');

    // 5. Determine PRESENT vs LATE
    const sessionStart = new Date(session.createdAt).getTime();
    const elapsed = (Date.now() - sessionStart) / 60000; // minutes
    const status = (session.lateThresholdMinutes > 0 && elapsed > session.lateThresholdMinutes) ? 'LATE' : 'PRESENT';

    // 6. Append
    const record = {
        uid,
        name: name || 'Unknown',
        email: email || '',
        time: new Date().toISOString(),
        status
    };

    await updateDoc(sessionRef, {
        checkedIn: arrayUnion(record)
    });

    return record;
};

// ──────────────────────────────────
// Queries & Export
// ──────────────────────────────────

/**
 * Fetch all attendance sessions for a given class.
 */
export const getSessionsByClass = async (classId) => {
    const q = query(collection(db, COLLECTION), where('classId', '==', classId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt > b.createdAt ? 1 : -1);
};

/**
 * Find all active sessions for a specific teacher.
 */
export const getActiveSessionsByTeacher = async (teacherId) => {
    const q = query(
        collection(db, COLLECTION),
        where('teacherId', '==', teacherId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Get active session for a class (if any).
 */
export const getActiveSession = async (classId) => {
    const q = query(
        collection(db, COLLECTION),
        where('classId', '==', classId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
};

/**
 * Find any active sessions for a student's enrolled classes.
 */
export const getActiveSessionsForStudent = async (studentId) => {
    const classes = await getStudentClasses(studentId);
    const results = [];
    for (const cls of classes) {
        const session = await getActiveSession(cls.id);
        if (session) results.push(session);
    }
    return results;
};

/**
 * Build and trigger a CSV download of cross-tabulated attendance for a class.
 * Columns: Name, Email, Date1, Date2, ..., Total Present, Total Late, Total Absent
 */
export const exportAttendanceCSV = async (classId, classDoc) => {
    const sessions = await getSessionsByClass(classId);
    if (sessions.length === 0) throw new Error('No attendance sessions found for this class.');

    // Build roster from class students
    const students = (classDoc.students || []).map(s => (typeof s === 'string' ? { uid: s, name: s, email: '' } : s));
    if (students.length === 0) throw new Error('No students enrolled in this class.');

    // Session dates (columns)
    const sessionDates = sessions.map(s => {
        const d = new Date(s.createdAt);
        return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    });

    // Build matrix
    const rows = students.map(student => {
        let totalP = 0, totalL = 0, totalA = 0;
        const statuses = sessions.map(session => {
            const record = session.checkedIn.find(c => c.uid === student.uid);
            if (!record) { totalA++; return 'A'; }
            if (record.status === 'LATE') { totalL++; return 'L'; }
            totalP++;
            return 'P';
        });
        return {
            name: student.name || student.email || student.uid,
            email: student.email || '',
            statuses,
            totalP,
            totalL,
            totalA
        };
    });

    // Build CSV
    const headers = ['Name', 'Email', ...sessionDates, 'Total Present', 'Total Late', 'Total Absent'];
    const csvLines = [headers.join(',')];
    rows.forEach(r => {
        const cells = [
            `"${r.name}"`,
            `"${r.email}"`,
            ...r.statuses,
            r.totalP,
            r.totalL,
            r.totalA
        ];
        csvLines.push(cells.join(','));
    });

    const csv = csvLines.join('\n');

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${classDoc.name || classId}_${new Date().toLocaleDateString('en-CA')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
