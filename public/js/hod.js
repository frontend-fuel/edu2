// DOM Elements
const dashboardPage = document.getElementById('dashboard-page');
const viewFacultyPage = document.getElementById('view-faculty-page');
const classManagerPage = document.getElementById('class-manager-page');

// Class Management Elements
const classListContainer = document.getElementById('class-list-container');
const classManagement = document.getElementById('class-management');
const selectedClassTitle = document.getElementById('selected-class-title');
const backToClassesBtn = document.getElementById('back-to-classes');
const refreshClassesBtn = document.getElementById('refresh-classes');

// Add Class Modal Elements
const addClassForm = document.getElementById('add-class-form');
const saveClassBtn = document.getElementById('save-class');

// Faculty Page Elements
const facultyList = document.getElementById('faculty-list');
const filterFacultyName = document.getElementById('filter-faculty-name');
const filterFacultyDepartment = document.getElementById('filter-faculty-department');
const applyFacultyFiltersBtn = document.getElementById('apply-faculty-filters');
const refreshFacultyListBtn = document.getElementById('refresh-faculty-list');

// Subject Tab Elements
const addSubjectForm = document.getElementById('add-subject-form');
const classIdForSubject = document.getElementById('class-id-for-subject');
const facultyDropdown = document.getElementById('faculty-dropdown');
const subjectsList = document.getElementById('subjects-list');

// Edit Subject Modal Elements
const editSubjectForm = document.getElementById('edit-subject-form');
const editSubjectModal = new bootstrap.Modal(document.getElementById('editSubjectModal'));
const editSubjectId = document.getElementById('edit-subject-id');
const editClassId = document.getElementById('edit-class-id');
const editSubjectName = document.getElementById('edit-subject-name');
const editSubjectCode = document.getElementById('edit-subject-code');
const editSubjectType = document.getElementById('edit-subject-type');
const editSubjectFaculty = document.getElementById('edit-subject-faculty');

// Students Tab Elements
const uploadStudentsForm = document.getElementById('upload-students-form');
const classIdForStudents = document.getElementById('class-id-for-students');
const studentsList = document.getElementById('students-list');
const downloadTemplateBtn = document.getElementById('download-template');

// Timetable Tab Elements
const addTimetableForm = document.getElementById('add-timetable-form');
const classIdForTimetable = document.getElementById('class-id-for-timetable');
const timetableSlots = document.getElementById('timetable-slots');
const addSlotBtn = document.getElementById('add-slot');
const currentTimetable = document.getElementById('current-timetable');

// Attendance Tab Elements
const attendanceSubjectFilter = document.getElementById('attendance-subject-filter');
const attendanceStartDate = document.getElementById('attendance-start-date');
const attendanceEndDate = document.getElementById('attendance-end-date');
const filterAttendanceBtn = document.getElementById('filter-attendance');
const subjectHeaderRow = document.getElementById('subject-header-row');
const attendanceData = document.getElementById('attendance-data');

// Dashboard Elements
const totalFaculty = document.getElementById('total-faculty');
const totalStudents = document.getElementById('total-students');
const totalSubjects = document.getElementById('total-subjects');
const totalClasses = document.getElementById('total-classes');
// Recent Activities section has been removed
const attendanceChart = document.getElementById('attendance-chart');
const downloadReportsBtn = document.getElementById('download-reports');

let attendanceStatsChart = null;

// Navigation
document.querySelectorAll('.nav-link, .btn[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.closest('[data-page]').dataset.page;
        showPage(page);
    });
});

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`${pageId}-page`).classList.add('active');

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });

    // Reset class management view
    if (pageId === 'class-manager') {
        classManagement.style.display = 'none';
    }

    // Load page-specific data
    if (pageId === 'dashboard') {
        loadDashboardStats();
    } else if (pageId === 'view-faculty') {
        loadFacultyMembers();
    } else if (pageId === 'class-manager') {
        loadClasses();
    } else if (pageId === 'add-subjects') {
        loadAllSubjects();
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const stats = await api.getDepartmentStats();
        
        // Get class count
        let classCount = 0;
        try {
            const classes = await api.getClasses();
            classCount = classes.length;
        } catch (err) {
            console.error('Error fetching classes for dashboard:', err);
        }
        
        // Update stats cards
        totalFaculty.textContent = stats.facultyCount;
        totalStudents.textContent = stats.studentCount;
        totalSubjects.textContent = stats.subjectCount;
        totalClasses.textContent = classCount; // Show actual class count

        // Clear attendance chart
        if (attendanceStatsChart) {
            attendanceStatsChart.destroy();
            attendanceStatsChart = null;
        }
        const ctx = attendanceChart.getContext('2d');
        ctx.clearRect(0, 0, attendanceChart.width, attendanceChart.height);

        // Update attendance chart if data is available
        if (stats.attendanceStats && stats.attendanceStats.length > 0) {
            updateAttendanceChart(stats.attendanceStats);
        }

        // Recent Activities section has been removed
    } catch (error) {
        console.error('Error loading stats:', error);
        totalFaculty.textContent = '0';
        totalStudents.textContent = '0';
        totalSubjects.textContent = '0';
        totalClasses.textContent = '0';
    }
}

// Update Attendance Chart
function updateAttendanceChart(stats) {
    const ctx = attendanceChart.getContext('2d');
    
    if (attendanceStatsChart) {
        attendanceStatsChart.destroy();
    }

    attendanceStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.map(s => s.subject),
            datasets: [{
                label: 'Average Attendance %',
                data: stats.map(s => s.percentage),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load Classes for Class Manager
async function loadClasses() {
    console.log('Loading classes...');
    try {
        // Show loading spinner
        classListContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div></div>';
        
        // Loading classes - show spinner
        console.log('Fetching classes from API...');
        
        // Fetch classes from API
        const classes = await api.getClasses();
        console.log('Classes loaded:', classes);
        
        // No debug display needed anymore
        
        // Handle empty classes array
        if (!classes || classes.length === 0) {
            console.log('No classes found');
            classListContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> No classes found. Create your first class by clicking the "Add New Class" button.
                    </div>
                </div>
            `;
            return;
        }
        
        // Generate HTML for each class
        const classCardsHtml = classes.map(cls => {
            console.log('Processing class:', cls);
            
            // Safety check for required fields
            if (!cls || !cls._id) {
                console.error('Invalid class object:', cls);
                return '';
            }
            
            // Get class details with fallbacks for missing data
            const classId = cls._id;
            const year = cls.year || 'Unknown';
            const department = cls.department || 'Unknown';
            const section = cls.section || 'Unknown';
            const subjectsCount = cls.subjects ? cls.subjects.length : 0;
            const studentCount = cls.studentCount || 0;
            
            console.log(`Rendering class card: ${year} - ${department} - Section ${section}`);
            
            // Use standard card style
            const cardStyle = 'class-card';
            
            return `
                <div class="col-md-4 mb-4">
                    <div class="${cardStyle}" data-class-id="${classId}">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="m-0">${getYearText(year)} - ${department}</h4>
                            <span class="badge bg-primary">Section ${section}</span>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-book me-2"></i> ${subjectsCount} Subjects
                        </div>
                        <div class="mb-3">
                            <i class="fas fa-user-graduate me-2"></i> ${studentCount} Students
                        </div>
                        <button class="btn btn-sm btn-outline-primary w-100 manage-class-btn" data-class-id="${classId}">
                            <i class="fas fa-cogs me-2"></i>Manage Class
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update the DOM
        classListContainer.innerHTML = classCardsHtml;
        console.log('Class cards rendered');
        
        // Add event listeners to class cards
        document.querySelectorAll('.manage-class-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const classId = e.target.closest('.manage-class-btn').dataset.classId;
                console.log('Opening management for class ID:', classId);
                openClassManagement(classId);
            });
        });
        console.log('Event listeners attached to class cards');
        
    } catch (error) {
        console.error('Error loading classes:', error);
        classListContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i> Error loading classes: ${error.message || 'Unknown error'}
                </div>
            </div>
        `;
    }
}

// Helper function to format year text consistently
function getYearText(year) {
    // If year already contains the full text (e.g., '1st'), return it with 'Year' appended
    if (year && (year.includes('st') || year.includes('nd') || year.includes('rd') || year.includes('th'))) {
        return year.includes('Year') ? year : `${year} Year`;
    }
    
    // Otherwise convert numeric values to text
    const yearMap = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        '1st': '1st Year',
        '2nd': '2nd Year',
        '3rd': '3rd Year',
        '4th': '4th Year'
    };
    return yearMap[year] || `${year} Year`;
}

// Open Class Management Section
async function openClassManagement(classId) {
    try {
        // Show loading state
        selectedClassTitle.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Loading class details...';
        classManagement.style.display = 'block';
        
        // Scroll to class management section
        classManagement.scrollIntoView({ behavior: 'smooth' });
        
        // Get class details
        const classDetails = await api.getClassById(classId);
        
        // Update class title
        selectedClassTitle.textContent = `${getYearText(classDetails.year)} - ${classDetails.department} - Section ${classDetails.section}`;
        
        // Set class ID for various forms
        classIdForSubject.value = classId;
        classIdForStudents.value = classId;
        classIdForTimetable.value = classId;
        
        // Load faculty for subjects dropdown
        loadFacultyForSubjects(classDetails.department);
        
        // Load subjects for this class
        loadSubjects(classId);
        
        // Load students for this class
        loadStudents(classDetails.year, classDetails.department, classDetails.section);
        
        // Load timetable for this class
        loadTimetable(classId);
        
        // Load attendance data for this class
        loadAttendanceData(classId);
        
    } catch (error) {
        console.error('Error opening class management:', error);
        selectedClassTitle.textContent = 'Error Loading Class';
        alert('Failed to load class details. Please try again.');
    }
}

// Load Faculty Members with Filtering
async function loadFacultyMembers() {
    try {
        facultyList.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
        
        // Get filter values
        const nameFilter = filterFacultyName.value.trim().toLowerCase();
        const departmentFilter = filterFacultyDepartment.value;
        
        // Get all faculty members
        const faculty = await api.getFaculty();
        
        if (!faculty || faculty.length === 0) {
            facultyList.innerHTML = '<tr><td colspan="5" class="text-center">No faculty members found</td></tr>';
            return;
        }
        
        // Apply filters if provided
        const filteredFaculty = faculty.filter(member => {
            const nameMatch = !nameFilter || member.name.toLowerCase().includes(nameFilter);
            const departmentMatch = !departmentFilter || member.department === departmentFilter;
            return nameMatch && departmentMatch;
        });
        
        if (filteredFaculty.length === 0) {
            facultyList.innerHTML = '<tr><td colspan="5" class="text-center">No faculty members match the filters</td></tr>';
            return;
        }

        facultyList.innerHTML = filteredFaculty.map(member => `
            <tr>
                <td>${member.name}</td>
                <td>${member.department || 'Not assigned'}</td>
                <td>${member.email}</td>
                <td>${member.subjects ? member.subjects.join(', ') : 'No subjects assigned'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeFacultyMember('${member._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading faculty:', error);
        facultyList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading faculty members</td></tr>';
    }
}

// Remove Faculty Member
async function removeFacultyMember(facultyId) {
    if (!confirm('Are you sure you want to remove this faculty member?')) {
        return;
    }

    try {
        await api.removeFaculty(facultyId);
        alert('Faculty member removed successfully');
        loadFacultyMembers();
        loadDashboardStats();
    } catch (error) {
        alert(error.message || 'Error removing faculty member');
        console.error('Error:', error);
    }
}

// Load Faculty for Subjects Dropdown
async function loadFacultyForSubjects(department) {
    try {
        const faculty = await api.getFaculty();
        
        // Filter faculty by department
        const departmentFaculty = faculty.filter(f => f.department === department);
        
        if (!departmentFaculty || departmentFaculty.length === 0) {
            facultyDropdown.innerHTML = '<option value="" disabled selected>No faculty available for this department</option>';
            return;
        }
        
        // Update dropdown options
        facultyDropdown.innerHTML = '<option value="" disabled selected>Select Faculty</option>' + 
            departmentFaculty.map(f => `<option value="${f._id}">${f.name}</option>`).join('');
            
    } catch (error) {
        console.error('Error loading faculty for subjects:', error);
        facultyDropdown.innerHTML = '<option value="" disabled selected>Error loading faculty</option>';
    }
}

// Load All Subjects (standalone subjects)
async function loadAllSubjects() {
    try {
        console.log('Loading all standalone subjects');
        const subjects = await api.getAllSubjects();
        console.log('Subjects retrieved:', subjects);
        
        if (!subjects || subjects.length === 0) {
            subjectsList.innerHTML = '<tr><td colspan="5" class="text-center">No subjects added yet</td></tr>';
            // Update dashboard stats if available
            if (totalSubjects) totalSubjects.textContent = '0';
            return;
        }
        
        // Update dashboard stats if available
        if (totalSubjects) totalSubjects.textContent = subjects.length;
        
        // Populate subjects list
        subjectsList.innerHTML = subjects.map(subject => `
            <tr>
                <td>${subject.name}</td>
                <td>${subject.code || 'N/A'}</td>
                <td>${subject.type || 'Theory'}</td>
                <td>${subject.faculty ? subject.faculty.name : 'Not assigned'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeSubject('${subject._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('Standalone subjects list updated');
    } catch (error) {
        console.error('Error loading subjects:', error);
        subjectsList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading subjects: ' + error.message + '</td></tr>';
    }
}

// Load Subjects for a Class
async function loadSubjects(classId) {
    try {
        console.log('Loading subjects for class:', classId);
        const classDetails = await api.getClassById(classId);
        console.log('Class details received:', classDetails);
        
        if (!classDetails.subjects || classDetails.subjects.length === 0) {
            console.log('No subjects found for this class');
            subjectsList.innerHTML = '<tr><td colspan="6" class="text-center">No subjects added yet</td></tr>';
            return;
        }
        
        console.log('Found subjects:', classDetails.subjects.length);
        
        // Populate subjects list
        subjectsList.innerHTML = classDetails.subjects.map(subject => {
            console.log('Processing subject:', subject);
            return `
            <tr>
                <td>${subject.name || 'Unnamed'}</td>
                <td>${subject.code || 'N/A'}</td>
                <td>${subject.type || 'Unknown'}</td>
                <td>${subject.faculty ? subject.faculty.name : 'Not assigned'}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-sm btn-primary" onclick="editSubject('${classId}', '${subject._id}', ${JSON.stringify(subject).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="removeSubject('${classId}', '${subject._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        // Also update the subject dropdowns in timetable tab
        updateSubjectDropdowns(classDetails.subjects);
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        subjectsList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading subjects</td></tr>';
    }
}

// Update Subject Dropdowns in Timetable
function updateSubjectDropdowns(subjects) {
    // Get all subject dropdowns in timetable slots
    const subjectDropdowns = document.querySelectorAll('.slot-subject');
    
    const optionsHtml = '<option value="" disabled selected>Select Subject</option>' + 
        subjects.map(subject => `<option value="${subject._id}" data-faculty="${subject.faculty ? subject.faculty._id : ''}">${subject.name}</option>`).join('');
    
    subjectDropdowns.forEach(dropdown => {
        dropdown.innerHTML = optionsHtml;
    });
}

// Load Students for a Class
async function loadStudents(year, department, section) {
    try {
        // Get students by class criteria
        const students = await api.getStudents(year, department, section);
        
        if (!students || students.length === 0) {
            studentsList.innerHTML = '<tr><td colspan="4" class="text-center">No students added yet</td></tr>';
            return;
        }
        
        // Populate students list
        studentsList.innerHTML = students.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.rollNumber}</td>
                <td>${student.email}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeStudent('${student._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading students:', error);
        studentsList.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading students</td></tr>';
    }
}

// Load Timetable for a Class
async function loadTimetable(classId) {
    try {
        // Get timetable data
        const timetableData = await api.getTimetable(classId);
        
        if (!timetableData || timetableData.length === 0) {
            // Clear timetable if no data
            currentTimetable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center">No timetable created yet</td></tr>';
            return;
        }
        
        // Organize timetable data by time slots and days
        const timeSlots = new Set();
        const timetableByTimeAndDay = {};
        
        timetableData.forEach(slot => {
            const timeKey = `${slot.startTime}-${slot.endTime}`;
            timeSlots.add(timeKey);
            
            if (!timetableByTimeAndDay[timeKey]) {
                timetableByTimeAndDay[timeKey] = {};
            }
            
            timetableByTimeAndDay[timeKey][slot.day] = {
                subject: slot.subject.name,
                faculty: slot.faculty ? slot.faculty.name : 'N/A'
            };
        });
        
        // Sort time slots
        const sortedTimeSlots = Array.from(timeSlots).sort();
        
        // Generate timetable HTML
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timetableHtml = sortedTimeSlots.map(timeSlot => {
            const [startTime, endTime] = timeSlot.split('-');
            const formattedTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
            
            const dayColumns = daysOfWeek.map(day => {
                const slot = timetableByTimeAndDay[timeSlot][day];
                if (slot) {
                    return `<td>${slot.subject}<br><small>${slot.faculty}</small></td>`;
                } else {
                    return '<td class="text-muted">-</td>';
                }
            }).join('');
            
            return `<tr><th>${formattedTime}</th>${dayColumns}</tr>`;
        }).join('');
        
        // Update timetable
        currentTimetable.querySelector('tbody').innerHTML = timetableHtml || '<tr><td colspan="7" class="text-center">No timetable slots found</td></tr>';
        
    } catch (error) {
        console.error('Error loading timetable:', error);
        currentTimetable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading timetable</td></tr>';
    }
}

// Format time for display (e.g., "09:00" to "9:00 AM")
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${suffix}`;
}

// Load Attendance Data for a Class
async function loadAttendanceData(classId) {
    try {
        // Get class details to get subjects
        const classDetails = await api.getClassById(classId);
        
        if (!classDetails.subjects || classDetails.subjects.length === 0) {
            // No subjects added yet
            attendanceData.innerHTML = '<tr><td colspan="5" class="text-center">Please add subjects first</td></tr>';
            return;
        }
        
        // Update subject filter dropdown
        updateAttendanceSubjectFilter(classDetails.subjects);
        
        // Update subject header row
        updateAttendanceSubjectHeaders(classDetails.subjects);
        
        // Get attendance data for this class
        const attendanceResult = await api.getClassAttendance(classId, attendanceSubjectFilter.value, attendanceStartDate.value, attendanceEndDate.value);
        
        if (!attendanceResult.students || attendanceResult.students.length === 0) {
            attendanceData.innerHTML = '<tr><td colspan="' + (classDetails.subjects.length + 2) + '" class="text-center">No attendance data available</td></tr>';
            return;
        }
        
        // Generate attendance rows
        attendanceData.innerHTML = attendanceResult.students.map(student => {
            const subjectCells = classDetails.subjects.map(subject => {
                const attendance = student.attendance.find(a => a.subjectId === subject._id);
                const percentage = attendance ? Math.round(attendance.percentage) : 0;
                let badgeClass = 'bg-danger';
                
                if (percentage >= 75) badgeClass = 'bg-success';
                else if (percentage >= 60) badgeClass = 'bg-warning';
                
                return `<td><span class="badge ${badgeClass}">${percentage}%</span></td>`;
            }).join('');
            
            return `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.rollNumber}</td>
                    ${subjectCells}
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading attendance data:', error);
        attendanceData.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading attendance data</td></tr>';
    }
}

// Update Subject Headers in Attendance Table
function updateAttendanceSubjectHeaders(subjects) {
    subjectHeaderRow.innerHTML = subjects.map(subject => 
        `<th>${subject.name}<br><small>${subject.code || ''}</small></th>`
    ).join('');
}

// Update Subject Filter Dropdown in Attendance Tab
function updateAttendanceSubjectFilter(subjects) {
    attendanceSubjectFilter.innerHTML = '<option value="">All Subjects</option>' + 
        subjects.map(subject => `<option value="${subject._id}">${subject.name}</option>`).join('');
}

// Class management back button
backToClassesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    classManagement.style.display = 'none';
});

// Refresh classes button
refreshClassesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadClasses();
});

// Refresh faculty list button
refreshFacultyListBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadFacultyMembers();
});

// Apply faculty filters button
applyFacultyFiltersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadFacultyMembers();
});

// Add class form submission
saveClassBtn.addEventListener('click', async () => {
    console.log('Save class button clicked');
    
    const formData = new FormData(addClassForm);
    const year = formData.get('year');
    const department = formData.get('department');
    const section = formData.get('section');
    
    console.log('Form data:', { year, department, section });
    
    if (!year || !department || !section) {
        alert('Please fill out all fields');
        return;
    }
    
    try {
        // Show loading state
        saveClassBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
        saveClassBtn.disabled = true;
        
        const result = await api.addClass({
            year,
            department,
            section
        });
        
        console.log('Class created successfully:', result);
        alert('Class created successfully!');
        
        // Close the modal using jQuery if available, or native JS
        try {
            // Try using Bootstrap 5 native approach
            const modalElement = document.getElementById('addClassModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            } else {
                // Fallback to direct approach
                modalElement.classList.remove('show');
                modalElement.style.display = 'none';
                document.body.classList.remove('modal-open');
                const modalBackdrops = document.getElementsByClassName('modal-backdrop');
                if (modalBackdrops.length > 0) {
                    for (let i = 0; i < modalBackdrops.length; i++) {
                        modalBackdrops[i].parentNode.removeChild(modalBackdrops[i]);
                    }
                }
            }
        } catch (modalError) {
            console.error('Error closing modal:', modalError);
        }
        
        // Wait a moment before refreshing to ensure server has processed the change
        console.log('Scheduling class list refresh');
        setTimeout(() => {
            console.log('Refreshing class list after creation');
            // Switch to class manager page if not already there
            if (!document.getElementById('class-manager-page').classList.contains('active')) {
                showPage('class-manager');
            } else {
                // Just reload the classes
                loadClasses();
            }
        }, 500);
        
        // Reset form
        addClassForm.reset();
        
    } catch (error) {
        console.error('Error creating class:', error);
        alert(error.message || 'Error creating class');
    } finally {
        // Reset button state
        saveClassBtn.innerHTML = 'Create Class';
        saveClassBtn.disabled = false;
    }
});

// Edit subject form submission
editSubjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Edit subject form submitted');
    
    const formData = new FormData(editSubjectForm);
    const subjectId = formData.get('subjectId');
    const classId = formData.get('classId');
    const name = formData.get('name');
    const code = formData.get('code');
    const type = formData.get('type');
    const facultyId = formData.get('facultyId');
    
    console.log('Edit form data:', { subjectId, classId, name, code, type, facultyId });
    
    try {
        console.log('Calling API to edit subject...');
        const result = await api.editSubject(classId, subjectId, {
            name,
            code,
            type,
            facultyId
        });
        
        console.log('API response:', result);
        
        alert('Subject updated successfully!');
        editSubjectModal.hide();
        
        // Refresh subjects list
        loadSubjects(classId);
        
    } catch (error) {
        alert(error.message || 'Error updating subject');
        console.error('Error updating subject:', error);
    }
});

// Add subject form submission
addSubjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Subject form submitted');
    
    const formData = new FormData(addSubjectForm);
    const classId = formData.get('classId');
    const name = formData.get('name');
    const code = formData.get('code');
    const type = formData.get('type');
    const facultyId = formData.get('facultyId');
    
    console.log('Form data:', { classId, name, code, type, facultyId });
    
    // Input validation
    if (!name || name.trim() === '') {
        alert('Please enter a subject name');
        return;
    }
    
    if (!code || code.trim() === '') {
        alert('Please enter a subject code');
        return;
    }
    
    if (!facultyId || facultyId === '') {
        alert('Please select a faculty member');
        return;
    }
    
    try {
        // Use the correct API method - addSubjectToClass instead of addSubject
        console.log('Calling API to add subject to class...');
        const result = await api.addSubjectToClass(classId, {
            name,
            code,
            type,
            facultyId
        });
        
        console.log('API response:', result);
        
        alert('Subject added successfully!');
        // Refresh subjects list
        loadSubjects(classId);
        // Clear form except for classId
        addSubjectForm.querySelector('[name="name"]').value = '';
        addSubjectForm.querySelector('[name="code"]').value = '';
        addSubjectForm.querySelector('[name="type"]').value = 'Theory'; // Changed to match the form values
        addSubjectForm.querySelector('[name="facultyId"]').value = '';
        
    } catch (error) {
        alert(error.message || 'Error adding subject');
        console.error('Error adding subject:', error);
    }
});

// Function to open the edit subject modal
function editSubject(classId, subjectId, subject) {
    console.log('Editing subject:', subject);
    
    // Populate the edit form
    editSubjectId.value = subjectId;
    editClassId.value = classId;
    editSubjectName.value = subject.name;
    editSubjectCode.value = subject.code;
    editSubjectType.value = subject.type;
    
    // Reset and populate the faculty dropdown
    editSubjectFaculty.innerHTML = '<option value="" disabled>Select Faculty</option>';
    
    // Fetch faculty list for the dropdown
    api.getAllFaculty().then(faculty => {
        faculty.forEach(f => {
            const option = document.createElement('option');
            option.value = f._id;
            option.textContent = f.name;
            // Select the current faculty if available
            if (subject.faculty && subject.faculty._id === f._id) {
                option.selected = true;
            }
            editSubjectFaculty.appendChild(option);
        });
    });
    
    // Open the modal
    editSubjectModal.show();
}

// Remove subject function
async function removeSubject(classId, subjectId) {
    if (!confirm('Are you sure you want to remove this subject?')) {
        return;
    }
    
    try {
        await api.removeSubject(classId, subjectId);
        alert('Subject removed successfully');
        loadSubjects(classId);
    } catch (error) {
        alert(error.message || 'Error removing subject');
        console.error('Error removing subject:', error);
    }
}

// Upload students form submission
uploadStudentsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(uploadStudentsForm);
    const classId = formData.get('classId');
    const file = formData.get('file');
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    try {
        const result = await api.uploadStudents(classId, formData);
        
        alert(`File processed successfully!\nAdded ${result.successes.length} students.\n${result.errors.length > 0 ? 'Errors: ' + result.errors.length : ''}`);
        
        // Refresh students list - get class details first to get year, department, section
        const classDetails = await api.getClassById(classId);
        loadStudents(classDetails.year, classDetails.department, classDetails.section);
        
        // Clear file input
        uploadStudentsForm.querySelector('[name="file"]').value = '';
        
    } catch (error) {
        alert(error.message || 'Error uploading students');
        console.error('Error uploading students:', error);
    }
});

// Download student template
downloadTemplateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Create CSV content
    const csvContent = 'name,rollNumber,email\nJohn Doe,CSE001,john.doe@example.com\nJane Smith,CSE002,jane.smith@example.com';
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'student_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// Remove student function
async function removeStudent(studentId) {
    if (!confirm('Are you sure you want to remove this student?')) {
        return;
    }
    
    try {
        await api.removeStudent(studentId);
        alert('Student removed successfully');
        
        // Get current class ID from the hidden input
        const classId = document.getElementById('class-id-for-students').value;
        const classDetails = await api.getClassById(classId);
        loadStudents(classDetails.year, classDetails.department, classDetails.section);
        
    } catch (error) {
        alert(error.message || 'Error removing student');
        console.error('Error removing student:', error);
    }
}

// Add timetable slot button
addSlotBtn.addEventListener('click', () => {
    const slotCount = document.querySelectorAll('.timetable-slot').length;
    const newSlot = document.createElement('div');
    newSlot.className = 'timetable-slot border p-3 mb-3';
    newSlot.innerHTML = `
        <div class="row">
            <div class="col-md-2">
                <div class="mb-3">
                    <label class="form-label">Day</label>
                    <select class="form-select" name="slots[${slotCount}][day]" required>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                    </select>
                </div>
            </div>
            <div class="col-md-3">
                <div class="mb-3">
                    <label class="form-label">Time Slot</label>
                    <div class="input-group">
                        <input type="time" class="form-control" name="slots[${slotCount}][startTime]" required>
                        <span class="input-group-text">to</span>
                        <input type="time" class="form-control" name="slots[${slotCount}][endTime]" required>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="mb-3">
                    <label class="form-label">Subject</label>
                    <select class="form-select slot-subject" name="slots[${slotCount}][subject]" required>
                        <option value="" selected disabled>Select Subject</option>
                        <!-- Subjects will be loaded here -->
                    </select>
                </div>
            </div>
            <div class="col-md-3">
                <div class="mb-3">
                    <label class="form-label">Faculty</label>
                    <select class="form-select slot-faculty" name="slots[${slotCount}][faculty]" required disabled>
                        <option value="" selected disabled>Select Subject First</option>
                    </select>
                </div>
            </div>
            <div class="col-md-1 d-flex align-items-end">
                <button type="button" class="btn btn-danger remove-slot">×</button>
            </div>
        </div>
    `;
    timetableSlots.appendChild(newSlot);
    
    // Update subject dropdown options in the new slot
    const classId = document.getElementById('class-id-for-timetable').value;
    api.getClassById(classId).then(classDetails => {
        if (classDetails.subjects && classDetails.subjects.length > 0) {
            updateSubjectDropdowns(classDetails.subjects);
        }
    }).catch(error => {
        console.error('Error loading subjects for timetable:', error);
    });
});

// Remove timetable slot
timetableSlots.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-slot')) {
        const slotElement = e.target.closest('.timetable-slot');
        if (document.querySelectorAll('.timetable-slot').length > 1) {
            slotElement.remove();
        } else {
            alert('You must have at least one time slot');
        }
    }
});

// Handle subject selection in timetable to auto-select faculty
timetableSlots.addEventListener('change', (e) => {
    if (e.target.classList.contains('slot-subject')) {
        const subjectSelect = e.target;
        const facultySelect = subjectSelect.closest('.row').querySelector('.slot-faculty');
        
        if (subjectSelect.value) {
            // Get the selected option's data-faculty attribute
            const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
            const facultyId = selectedOption.getAttribute('data-faculty');
            
            if (facultyId) {
                facultySelect.value = facultyId;
                facultySelect.disabled = true;
            } else {
                facultySelect.disabled = false;
                facultySelect.value = '';
            }
        } else {
            facultySelect.disabled = true;
            facultySelect.value = '';
        }
    }
});

// Add timetable form submission
addTimetableForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addTimetableForm);
    const classId = formData.get('classId');
    const autoRepeat = formData.get('autoRepeat') === '1';
    
    // Extract time slots
    const slots = [];
    document.querySelectorAll('.timetable-slot').forEach((slotElement, index) => {
        const day = slotElement.querySelector(`[name="slots[${index}][day]"]`).value;
        const startTime = slotElement.querySelector(`[name="slots[${index}][startTime]"]`).value;
        const endTime = slotElement.querySelector(`[name="slots[${index}][endTime]"]`).value;
        const subject = slotElement.querySelector(`[name="slots[${index}][subject]"]`).value;
        const faculty = slotElement.querySelector(`[name="slots[${index}][faculty]"]`).value;
        
        if (day && startTime && endTime && subject) {
            slots.push({
                day,
                startTime,
                endTime,
                subject,
                faculty
            });
        }
    });
    
    if (slots.length === 0) {
        alert('Please add at least one valid time slot');
        return;
    }
    
    try {
        const result = await api.addTimetable(classId, {
            slots,
            autoRepeat
        });
        
        alert('Timetable created successfully!');
        // Refresh timetable
        loadTimetable(classId);
        
    } catch (error) {
        alert(error.message || 'Error creating timetable');
        console.error('Error creating timetable:', error);
    }
});

// Filter attendance button
filterAttendanceBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Get current class ID from the hidden input
    const classId = document.getElementById('class-id-for-students').value;
    loadAttendanceData(classId);
});

// Download reports button
downloadReportsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    alert('Reports functionality will be implemented in a future update.');
});

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Load current user info for department display
    loadCurrentUserInfo();
});

// Load current user info to display department
async function loadCurrentUserInfo() {
    try {
        const user = await api.getCurrentUser();
        console.log('Current user loaded:', user);
        
        // Display the HOD's department in the form
        const hodDepartmentElement = document.getElementById('hod-department');
        if (hodDepartmentElement && user.department) {
            hodDepartmentElement.textContent = user.department;
            
            // Also set the hidden department field value
            const departmentField = document.getElementById('class-department');
            if (departmentField) {
                departmentField.value = user.department;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Logout Handler
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/index.html';
});

// Add Students Form Handler
addStudentsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addStudentsForm);
    const data = {
        year: formData.get('year'),
        department: formData.get('department'),
        section: formData.get('section'),
        students: []
    };

    const studentEntries = document.querySelectorAll('.student-entry');
    studentEntries.forEach((entry, index) => {
        data.students.push({
            name: formData.get(`students[${index}][name]`),
            rollNumber: formData.get(`students[${index}][rollNumber]`),
            email: formData.get(`students[${index}][email]`)
        });
    });

    try {
        await api.addStudents(data);
        alert('Students added successfully');
        addStudentsForm.reset();
        while (studentsContainer.children.length > 1) {
            studentsContainer.removeChild(studentsContainer.lastChild);
        }
        showPage('dashboard');
    } catch (error) {
        alert(error.message || 'Error adding students');
        console.error('Error:', error);
    }
});

// Add More Subjects
document.getElementById('add-more-subjects').addEventListener('click', () => {
    const subjectCount = document.querySelectorAll('.subject-entry').length;
    const newSubject = document.createElement('div');
    newSubject.className = 'subject-entry border p-3 mb-3';
    newSubject.innerHTML = `
        <div class="row">
            <div class="col-md-5">
                <div class="mb-3">
                    <label class="form-label">Subject Name</label>
                    <input type="text" class="form-control" name="subjects[${subjectCount}][name]" required>
                </div>
            </div>
            <div class="col-md-3">
                <div class="mb-3">
                    <label class="form-label">Subject Code</label>
                    <input type="text" class="form-control" name="subjects[${subjectCount}][code]">
                </div>
            </div>
            <div class="col-md-2">
                <div class="mb-3">
                    <label class="form-label">Type</label>
                    <select class="form-select" name="subjects[${subjectCount}][type]" required>
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                    </select>
                </div>
            </div>
            <div class="col-md-2">
                <div class="mb-3">
                    <label class="form-label">&nbsp;</label>
                    <button type="button" class="btn btn-danger d-block w-100 remove-subject">Remove</button>
                </div>
            </div>
        </div>
    `;
    subjectsContainer.appendChild(newSubject);
});

// Remove Subject Entry
subjectsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-subject')) {
        const subjectEntry = e.target.closest('.subject-entry');
        if (document.querySelectorAll('.subject-entry').length > 1) {
            subjectEntry.remove();
        }
    }
});

// Add Subjects Form Handler
addSubjectsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addSubjectsForm);
    const data = {
        year: formData.get('year'),
        department: formData.get('department'),
        section: formData.get('section'),
        subjects: []
    };

    const subjectEntries = document.querySelectorAll('.subject-entry');
    subjectEntries.forEach((entry, index) => {
        data.subjects.push({
            name: formData.get(`subjects[${index}][name]`),
            code: formData.get(`subjects[${index}][code]`),
            type: formData.get(`subjects[${index}][type]`)
        });
    });

    try {
        await api.addSubjects(data);
        alert('Subjects added successfully');
        addSubjectsForm.reset();
        while (subjectsContainer.children.length > 1) {
            subjectsContainer.removeChild(subjectsContainer.lastChild);
        }
        showPage('dashboard');
    } catch (error) {
        alert(error.message || 'Error adding subjects');
        console.error('Error:', error);
    }
});

// Generate Timetable Grid
function generateTimeSlot() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="time" class="form-control" name="slots[][time]" required>
        </td>
        ${Array(6).fill().map(() => `
            <td>
                <select class="form-select" name="slots[][subject]">
                    <option value="">No Class</option>
                    <!-- Subjects will be loaded here -->
                </select>
            </td>
        `).join('')}
        <td>
            <button type="button" class="btn btn-danger btn-sm remove-slot">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    return row;
}

// Add Time Slot
document.getElementById('add-time-slot').addEventListener('click', () => {
    timetableGrid.appendChild(generateTimeSlot());
});

// Remove Time Slot
timetableGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-slot')) {
        const row = e.target.closest('tr');
        if (timetableGrid.children.length > 1) {
            row.remove();
        }
    }
});

// Add Timetable Form Handler
addTimetableForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addTimetableForm);
    const data = {
        year: formData.get('year'),
        department: formData.get('department'),
        section: formData.get('section'),
        weekStartDate: formData.get('weekStartDate'),
        slots: []
    };

    const timeSlots = timetableGrid.querySelectorAll('tr');
    timeSlots.forEach(slot => {
        const time = slot.querySelector('input[type="time"]').value;
        const subjects = Array.from(slot.querySelectorAll('select')).map(select => select.value);
        data.slots.push({ time, subjects });
    });

    try {
        await api.addTimetable(data);
        alert('Timetable created successfully');
        addTimetableForm.reset();
        timetableGrid.innerHTML = '';
        timetableGrid.appendChild(generateTimeSlot());
        showPage('dashboard');
    } catch (error) {
        alert(error.message || 'Error creating timetable');
        console.error('Error:', error);
    }
});

// Fetch Attendance
document.getElementById('fetch-attendance').addEventListener('click', async () => {
    const year = document.getElementById('attendance-year').value;
    const department = document.getElementById('attendance-department').value;
    const section = document.getElementById('attendance-section').value;

    if (!year || !department || !section) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const attendance = await api.getAttendance({ year, department, section });
        document.getElementById('attendance-list').innerHTML = attendance.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.rollNumber}</td>
                <td>
                    ${Object.entries(student.attendance).map(([subject, percent]) => `
                        <div>${subject}: ${percent}%</div>
                    `).join('')}
                </td>
                <td>${student.overallAttendance}%</td>
            </tr>
        `).join('');
    } catch (error) {
        alert(error.message || 'Error fetching attendance');
        console.error('Error:', error);
    }
});

// Update Recent Activities
function updateRecentActivities(activities) {
    recentActivities.innerHTML = activities.map(activity => `
        <tr>
            <td>${new Date(activity.date).toLocaleDateString()}</td>
            <td>${activity.activity}</td>
            <td>${activity.details}</td>
        </tr>
    `).join('');
}

// Logout Handler
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// Initial load
loadDashboardStats();

// Add initial slots
timetableGrid.appendChild(generateTimeSlot());
