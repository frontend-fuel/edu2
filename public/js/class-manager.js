class ClassManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadClasses();
    }

    initializeElements() {
        // Forms
        this.addClassForm = document.getElementById('add-class-form');
        this.addSubjectForm = document.getElementById('add-subject-form');
        this.uploadStudentsForm = document.getElementById('upload-students-form');

        // Modals
        this.addClassModal = new bootstrap.Modal(document.getElementById('add-class-modal'));
        this.addSubjectModal = new bootstrap.Modal(document.getElementById('add-subject-modal'));
        this.uploadStudentsModal = new bootstrap.Modal(document.getElementById('upload-students-modal'));

        // Lists and containers
        this.classList = document.getElementById('class-list');
        
        // Stats elements
        this.totalClassesEl = document.getElementById('total-classes');
        this.totalStudentsEl = document.getElementById('total-students');
        this.totalSubjectsEl = document.getElementById('total-subjects');
        this.totalFacultyEl = document.getElementById('total-faculty');

        // Buttons
        this.addClassBtn = document.getElementById('add-class-btn');
        this.downloadTemplateBtn = document.getElementById('download-template');
    }

    setupEventListeners() {
        // Add Class
        this.addClassBtn.addEventListener('click', () => this.addClassModal.show());
        this.addClassForm.addEventListener('submit', (e) => this.handleAddClass(e));

        // Add Subject
        this.addSubjectForm.addEventListener('submit', (e) => this.handleAddSubject(e));

        // Upload Students
        this.uploadStudentsForm.addEventListener('submit', (e) => this.handleUploadStudents(e));
        this.downloadTemplateBtn.addEventListener('click', (e) => this.downloadTemplate(e));

        // Class List Click Delegation
        this.classList.addEventListener('click', (e) => {
            const target = e.target;
            const classCard = target.closest('.class-card');
            if (!classCard) return;

            if (target.matches('.add-subject-btn')) {
                this.showAddSubjectModal(classCard.dataset.id);
            } else if (target.matches('.upload-students-btn')) {
                this.showUploadStudentsModal(classCard.dataset.id);
            } else {
                this.toggleClassDetails(classCard);
            }
        });
    }

    async loadClasses() {
        try {
            const classes = await api.getClasses();
            this.renderClasses(classes);
            this.updateStats(classes);
        } catch (error) {
            console.error('Error loading classes:', error);
            alert('Error loading classes. Please try again.');
        }
    }

    async handleAddClass(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const classData = {
            year: formData.get('year'),
            department: formData.get('department'),
            section: formData.get('section')
        };

        try {
            await api.addClass(classData);
            this.addClassModal.hide();
            event.target.reset();
            this.loadClasses();
        } catch (error) {
            console.error('Error adding class:', error);
            alert(error.message);
        }
    }

    async handleAddSubject(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const subjectData = {
            name: formData.get('name'),
            code: formData.get('code'),
            type: formData.get('type'),
            facultyId: formData.get('facultyId')
        };
        const classId = formData.get('classId');

        try {
            await api.addSubjectToClass(classId, subjectData);
            this.addSubjectModal.hide();
            event.target.reset();
            this.loadClasses();
        } catch (error) {
            console.error('Error adding subject:', error);
            alert(error.message);
        }
    }

    async handleUploadStudents(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const classId = formData.get('classId');

        try {
            const result = await api.uploadStudents(classId, formData);
            
            // Show results
            const resultsDiv = document.getElementById('upload-results');
            const successDiv = document.getElementById('upload-success');
            const errorsDiv = document.getElementById('upload-errors');
            
            successDiv.textContent = result.successes.join('\\n');
            errorsDiv.textContent = result.errors.join('\\n');
            resultsDiv.style.display = 'block';

            if (result.errors.length === 0) {
                setTimeout(() => {
                    this.uploadStudentsModal.hide();
                    event.target.reset();
                    resultsDiv.style.display = 'none';
                    this.loadClasses();
                }, 2000);
            }
        } catch (error) {
            console.error('Error uploading students:', error);
            alert(error.message);
        }
    }

    showAddSubjectModal(classId) {
        const form = this.addSubjectForm;
        form.querySelector('[name="classId"]').value = classId;
        this.addSubjectModal.show();
    }

    showUploadStudentsModal(classId) {
        const form = this.uploadStudentsForm;
        form.querySelector('[name="classId"]').value = classId;
        this.uploadStudentsModal.show();
    }

    toggleClassDetails(classCard) {
        const wasActive = classCard.classList.contains('active');
        // Remove active class from all cards
        this.classList.querySelectorAll('.class-card').forEach(card => {
            card.classList.remove('active');
        });
        // Toggle active class on clicked card
        if (!wasActive) {
            classCard.classList.add('active');
        }
    }

    downloadTemplate(event) {
        event.preventDefault();
        const csvContent = "Name,Roll Number,Email\\nJohn Doe,22781A0501,john@example.com";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    renderClasses(classes) {
        this.classList.innerHTML = classes.map(cls => this.createClassCard(cls)).join('');
    }

    createClassCard(cls) {
        return `
            <div class="col-md-4 mb-4">
                <div class="dashboard-card class-card" data-id="${cls._id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${cls.year} - ${cls.department} - ${cls.section}</h5>
                        <span class="badge bg-primary">${cls.subjects.length} subjects</span>
                    </div>
                    <div class="class-details mt-3">
                        <div class="mb-3">
                            <h6>Subjects</h6>
                            ${this.createSubjectsList(cls.subjects)}
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-primary add-subject-btn">
                                <i class="bi bi-plus-circle"></i> Add Subject
                            </button>
                            <button class="btn btn-sm btn-success upload-students-btn">
                                <i class="bi bi-upload"></i> Upload Students
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createSubjectsList(subjects) {
        if (subjects.length === 0) {
            return '<p class="text-muted">No subjects added yet</p>';
        }

        return `
            <div class="list-group">
                ${subjects.map(subject => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${subject.name}</strong>
                                ${subject.code ? `<small class="text-muted">(${subject.code})</small>` : ''}
                                <br>
                                <small class="text-muted">${subject.type}</small>
                            </div>
                            <small>${subject.faculty ? subject.faculty.name : 'No faculty assigned'}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateStats(classes) {
        let totalStudents = 0;
        let totalSubjects = 0;
        let totalFaculty = new Set();

        classes.forEach(cls => {
            totalSubjects += cls.subjects.length;
            cls.subjects.forEach(subject => {
                if (subject.faculty) {
                    totalFaculty.add(subject.faculty._id);
                }
            });
        });

        this.totalClassesEl.textContent = classes.length;
        this.totalStudentsEl.textContent = totalStudents;
        this.totalSubjectsEl.textContent = totalSubjects;
        this.totalFacultyEl.textContent = totalFaculty.size;
    }
}

// Initialize the class manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.classManager = new ClassManager();
});
