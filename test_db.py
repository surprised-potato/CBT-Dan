import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Use a service account
cred = credentials.Certificate('/home/daniel/programming/CBT-Dan/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

users_ref = db.collection('users')
docs = users_ref.stream()

teacher_id = None
for doc in docs:
    data = doc.to_dict()
    if data.get('email') == 'testteacher@test.com':
        print(f"Found teacher: {doc.id} => {data}")
        teacher_id = doc.id
        # Approve the teacher
        doc.reference.update({'isAuthorized': True})

if teacher_id:
    # Find a class to assign to this teacher
    classes_ref = db.collection('classes')
    class_docs = classes_ref.stream()
    for c_doc in class_docs:
        print(f"Assigning class {c_doc.id} to teacher {teacher_id}")
        c_doc.reference.update({'teacherId': teacher_id})
        break # Just one class is enough
