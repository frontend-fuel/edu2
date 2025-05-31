class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const url = `${this.baseUrl}${endpoint}`;
            console.log('Making request to:', url);
            
            const response = await fetch(url, {
                ...options,
                headers
            });

            console.log('Response status:', response.status);
            
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('Response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.error || 'Server returned an error');
                }
                
                return data;
            } else {
                // Handle non-JSON responses
                const text = await response.text();
                console.error('Non-JSON response received:', text.substring(0, 500));
                throw new Error('Server returned non-JSON response');
            }
        } catch (error) {
            console.error('API request error:', error);
            if (error.message === 'Token is not valid' || error.message === 'No token, authorization denied') {
                this.clearToken();
                window.location.href = '/login.html';
            }
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password, role) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        });
        this.setToken(data.token);
        return data.user;
    }

    async getCurrentUser() {
        try {
            const data = await this.request('/auth/me');
            return data.user;
        } catch (error) {
            this.clearToken();
            throw error;
        }
    }

    async verifyToken() {
        try {
            const data = await this.request('/auth/verify');
            return data.user;
        } catch (error) {
            this.clearToken();
            throw error;
        }
    }

    // Owner endpoints
    async addAdmin(adminData) {
        return await this.request('/owner/add-admin', {
            method: 'POST',
            body: JSON.stringify(adminData)
        });
    }

    async getAdminStats() {
        return await this.request('/owner/admin-stats');
    }

    async getAllAdmins() {
        return await this.request('/owner/admins');
    }

    // Admin endpoints
    async addHod(hodData) {
        const response = await this.request('/admin/add-hod', {
            method: 'POST',
            body: JSON.stringify(hodData)
        });
        return response.data;
    }

    async addFaculty(facultyData) {
        const response = await this.request('/admin/add-faculty', {
            method: 'POST',
            body: JSON.stringify(facultyData)
        });
        return response.data;
    }

    async getStaff(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return await this.request(`/admin/staff${query ? `?${query}` : ''}`);
    }

    async deleteStaff(staffId) {
        return await this.request(`/admin/staff/${staffId}`, {
            method: 'DELETE'
        });
    }

    async getAdminDashboardStats() {
        return await this.request('/admin/stats');
    }

    // HOD endpoints
    async getFaculty() {
        return await this.request('/hod/faculty');
    }

    async getDepartmentStats() {
        try {
            const stats = await this.request('/hod/stats');
            console.log('Department stats:', stats);
            return stats;
        } catch (error) {
            console.error('Error getting department stats:', error);
            throw error;
        }
    }

    // Class Management
    async addClass(classData) {
        console.log('API: Adding class with data:', classData);
        try {
            const result = await this.request('/hod/add-class', {
                method: 'POST',
                body: JSON.stringify(classData)
            });
            console.log('API: Class added successfully:', result);
            return result;
        } catch (error) {
            console.error('API: Error adding class:', error);
            throw error;
        }
    }

    async getClasses() {
        console.log('API: Fetching classes');
        try {
            // Use the existing request method which handles token management
            const result = await this.request('/hod/classes');
            console.log('API: Classes fetched successfully, count:', result ? result.length : 0);
            
            if (result && result.length > 0) {
                // Log details of first class for debugging
                console.log('API: First class details:', {
                    id: result[0]._id,
                    year: result[0].year,
                    department: result[0].department,
                    section: result[0].section,
                    subjectsCount: result[0].subjects ? result[0].subjects.length : 0
                });
            } else {
                console.log('API: No classes returned from server');
            }
            
            return result;
        } catch (error) {
            console.error('API: Error fetching classes:', error);
            // Don't alert here as it can be disruptive - just log the error
            throw error;
        }
    }
    
    async getClassById(classId) {
        console.log('API: Fetching class details for ID:', classId);
        try {
            // First try to fetch from the server
            const result = await this.request(`/hod/classes/${classId}`);
            console.log('API: Class details fetched from server:', result);
            return result;
        } catch (error) {
            console.error(`API: Error fetching class details from server:`, error);
            
            // Fallback: Try to find the class in the locally cached classes
            console.log('API: Attempting to get class from local cache');
            try {
                const classes = await this.getClasses();
                const classDetails = classes.find(c => c._id === classId);
                
                if (classDetails) {
                    console.log('API: Found class in local cache:', classDetails);
                    return classDetails;
                } else {
                    console.error('API: Class not found in local cache');
                    throw new Error('Class not found');
                }
            } catch (fallbackError) {
                console.error('API: Fallback also failed:', fallbackError);
                throw error; // Throw the original error
            }
        }
    }

    async addSubjectToClass(classId, subjectData) {
        return await this.request(`/hod/classes/${classId}/subjects`, {
            method: 'POST',
            body: JSON.stringify(subjectData)
        });
    }
    
    async editSubject(classId, subjectId, subjectData) {
        console.log(`API: Editing subject ${subjectId} in class ${classId}`);
        return await this.request(`/hod/classes/${classId}/subjects/${subjectId}`, {
            method: 'PUT',
            body: JSON.stringify(subjectData)
        });
    }

    async deleteSubject(classId, subjectId) {
        console.log(`API: Deleting subject ${subjectId} from class ${classId}`);
        return await this.request(`/hod/classes/${classId}/subjects/${subjectId}`, {
            method: 'DELETE'
        });
    }
    
    // Owner API Methods
    async getAdminStats() {
        return await this.request('/owner/admin-stats');
    }
    
    async getAllAdmins() {
        return await this.request('/owner/admins');
    }
    
    async addAdmin(adminData) {
        return await this.request('/owner/add-admin', {
            method: 'POST',
            body: JSON.stringify(adminData)
        });
    }
    
    async removeAdmin(adminId) {
        return await this.request(`/owner/admins/${adminId}`, {
            method: 'DELETE'
        });
    }
    
    async addSubject(subjectData) {
        try {
            console.log('%c[Subject Creation] Step 1: Initial data received', 'color: blue; font-weight: bold', subjectData);
            
            // Ensure subjectData is not null or undefined
            if (!subjectData) {
                console.error('%c[Subject Creation] Error: Subject data is null or undefined', 'color: red');
                throw new Error('Subject data is required');
            }
            
            // Get current user for department info if needed
            let currentUser = null;
            try {
                currentUser = await this.getCurrentUser();
                console.log('%c[Subject Creation] Step 2: Current user retrieved', 'color: blue', {
                    id: currentUser._id,
                    department: currentUser.department
                });
            } catch (userError) {
                console.error('%c[Subject Creation] Error getting current user:', 'color: red', userError);
            }
            
            // Prepare the data with fallbacks
            const fullData = {
                ...subjectData,
                name: subjectData.name || 'Unnamed Subject',
                code: subjectData.code || (subjectData.name ? subjectData.name.substring(0, 4).toUpperCase() : 'SUBJ'),
                department: subjectData.department || (currentUser ? currentUser.department : 'Unknown')
            };
            
            console.log('%c[Subject Creation] Step 3: Prepared data', 'color: blue', fullData);
            
            // Make the API request - use the correct path with /hod prefix
            console.log('%c[Subject Creation] Step 4: Sending request to backend', 'color: blue');
        
            // The request method already prepends /api to the path, so we just need the correct endpoint
            const result = await this.request('/hod/add-subject', {
                method: 'POST',
                body: JSON.stringify(fullData)
            });
            
            console.log('%c[Subject Creation] Step 5: Success! Subject created:', 'color: green; font-weight: bold', result);
            return result;
        } catch (error) {
            console.error('%c[Subject Creation] Fatal Error:', 'color: red; font-weight: bold', error);
            
            // Provide a user-friendly error message
            const errorMessage = error.message || 'Unknown error';
            alert('Failed to add subject: ' + errorMessage);
            
            // Rethrow the error for further handling if needed
            throw error;
        }
    }
    
    // Direct fallback for adding subjects
    async _directAddSubject(subjectData) {
        try {
            console.log('Request URL:', `${this.baseUrl}/hod/subjects`);
            console.log('Request data:', JSON.stringify(subjectData));
            console.log('Token exists:', !!this.token);
            
            const response = await fetch(`${this.baseUrl}/hod/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token ? `Bearer ${this.token}` : ''
                },
                body: JSON.stringify(subjectData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            // Check if response is JSON or HTML
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('Response JSON data:', data);
                
                if (!response.ok) {
                    throw new Error(data.error || 'Server error');
                }
                
                return data;
            } else {
                // If not JSON, log the text content for debugging
                const text = await response.text();
                console.log('Response is not JSON. First 100 chars:', text.substring(0, 100));
                throw new Error('Server returned non-JSON response');
            }
        } catch (error) {
            console.error('Error in addSubject:', error);
            throw error;
        }
    }

    async uploadStudents(classId, formData) {
        return await this.request(`/hod/classes/${classId}/upload-students`, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set correct content-type for FormData
        });
    }

    async addStudent(studentData) {
        return await this.request('/hod/add-student', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    // Additional owner endpoints
    async removeAdmin(adminId) {
        return await this.request(`/owner/admins/${adminId}`, {
            method: 'DELETE'
        });
    }

    async addStudents(studentsData) {
        return await this.request('/hod/add-students', {
            method: 'POST',
            body: JSON.stringify(studentsData)
        });
    }

    async addSubjects(subjectsData) {
        return await this.request('/hod/add-subjects', {
            method: 'POST',
            body: JSON.stringify(subjectsData)
        });
    }
    
    async getAllSubjects() {
        console.log('Getting all subjects for department');
        try {
            return await this.request('/hod/subjects');
        } catch (error) {
            console.error('Error getting subjects:', error);
            throw error;
        }
    }

    async addTimetable(timetableData) {
        return await this.request('/hod/add-timetable', {
            method: 'POST',
            body: JSON.stringify(timetableData)
        });
    }

    async getStudentAttendance(params) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/hod/student-attendance?${query}`);
    }

    // Faculty endpoints
    async addAttendance(attendanceData) {
        return await this.request('/faculty/add-attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    async addMarks(marksData) {
        return await this.request('/faculty/add-marks', {
            method: 'POST',
            body: JSON.stringify(marksData)
        });
    }

    async getFacultyTimetable() {
        return await this.request('/faculty/timetable');
    }

    async getFacultyStats() {
        return await this.request('/faculty/stats');
    }

    async getStudentsForAttendance(params) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/faculty/students?${query}`);
    }

    async getFacultySubjects() {
        return await this.request('/faculty/subjects');
    }

    async submitAttendance(attendanceData) {
        return await this.request('/faculty/submit-attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    async getAttendanceRecords(params) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/faculty/attendance-records?${query}`);
    }

    async getFacultyReports(params) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/faculty/reports?${query}`);
    }

    // Student endpoints
    async getStudentAttendanceReport() {
        return await this.request('/student/attendance');
    }

    async getStudentMarks() {
        return await this.request('/student/marks');
    }

    async getStudentTimetable() {
        return await this.request('/student/timetable');
    }

    async getStudentStats() {
        return await this.request('/student/stats');
    }

    async getStudentAttendance() {
        return await this.request('/student/attendance');
    }
}

const api = new ApiService();
