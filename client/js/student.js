// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Load initial data
    loadAssignments();
    loadGrades();
    
    // Setup navigation
    setupNavigation();
    
    // Setup forms
    setupForms();
});

function initializeDashboard() {
    const userId = getUserId();
    const userNameElement = document.getElementById('userName');
    if (userNameElement && userId) {
        userNameElement.textContent = userId;
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const targetSection = this.getAttribute('data-section');
            const targetElement = document.getElementById(targetSection + '-section');
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Update page title
            const titles = {
                'assignments': 'Open Assignments',
                'submissions': 'Submit Assignment',
                'grades': 'My Grades & Class Average'
            };
            if (pageTitle) {
                pageTitle.textContent = titles[targetSection] || 'Dashboard';
            }
        });
    });
}

function setupForms() {
    const submissionForm = document.getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', handleSubmission);
    }
}

async function loadAssignments() {
    const container = document.getElementById('assignmentsList');
    const select = document.getElementById('assignmentSelect');
    
    if (container) {
        container.innerHTML = '<div class=\"loading-spinner\">Loading assignments...</div>';
    }
    
    try {
        const assignments = await apiRequest('/student/assignments');
        
        if (container) {
            if (assignments.length === 0) {
                container.innerHTML = '<div class=\"no-data\">No open assignments available.</div>';
            } else {
                container.innerHTML = assignments.map(assignment => `
                    <div class=\"assignment-card\">
                        <h3>${assignment.title}</h3>
                        <p>${assignment.description || 'No description provided.'}</p>
                        <div class=\"assignment-meta\">
                            <div class=\"due-date\">
                                <i class=\"fas fa-calendar-alt\"></i>
                                Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                            <span class=\"status-badge ${assignment.IsOpen ? 'status-open' : 'status-closed'}\">
                                ${assignment.IsOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Populate assignment select
        if (select) {
            select.innerHTML = '<option value=\"\">Choose an assignment...</option>' +
                assignments.map(assignment => 
                    `<option value=\"${assignment._id}\">${assignment.title}</option>`
                ).join('');
        }
        
    } catch (error) {
        if (container) {
            container.innerHTML = `<div class=\"error-message\">Error loading assignments: ${error.message}</div>`;
        }
        console.error('Error loading assignments:', error);
    }
}

async function loadGrades() {
    const myGradesContainer = document.getElementById('myGrades');
    const classAveragesContainer = document.getElementById('classAverages');
    
    if (myGradesContainer) {
        myGradesContainer.innerHTML = '<div class=\"loading-spinner\">Loading grades...</div>';
    }
    if (classAveragesContainer) {
        classAveragesContainer.innerHTML = '<div class=\"loading-spinner\">Loading averages...</div>';
    }
    
    try {
        const data = await apiRequest('/student/submissions/me');
        
        // Display my grades
        if (myGradesContainer) {
            if (data['your grades'].length === 0) {
                myGradesContainer.innerHTML = '<div class=\"no-data\">No submissions yet.</div>';
            } else {
                myGradesContainer.innerHTML = data['your grades'].map(submission => {
                    const gradeClass = getGradeClass(submission.grade);
                    const gradeText = submission.grade ? submission.grade : 'Pending';
                    
                    return `
                        <div class=\"grade-item\">
                            <div>
                                <div class=\"grade-title\">${submission.assignmentId ? submission.assignmentId.title : 'Unknown Assignment'}</div>
                                ${submission.feedback ? `<small style=\"color: #666;\">${submission.feedback}</small>` : ''}
                            </div>
                            <span class=\"grade-score ${gradeClass}\">${gradeText}</span>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // Display class averages
        if (classAveragesContainer) {
            if (data['class avg'].length === 0) {
                classAveragesContainer.innerHTML = '<div class=\"no-data\">No class data available.</div>';
            } else {
                classAveragesContainer.innerHTML = data['class avg'].map(avg => {
                    const avgClass = getGradeClass(avg.Average);
                    const avgText = avg.Average ? Math.round(avg.Average) : 'N/A';
                    
                    return `
                        <div class=\"grade-item\">
                            <div class=\"grade-title\">${avg.assignmentTitle}</div>
                            <span class=\"grade-score ${avgClass}\">${avgText}</span>
                        </div>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        if (myGradesContainer) {
            myGradesContainer.innerHTML = `<div class=\"error-message\">Error loading grades: ${error.message}</div>`;
        }
        if (classAveragesContainer) {
            classAveragesContainer.innerHTML = `<div class=\"error-message\">Error loading averages: ${error.message}</div>`;
        }
        console.error('Error loading grades:', error);
    }
}

function getGradeClass(grade) {
    if (!grade) return 'grade-pending';
    if (grade >= 90) return 'grade-excellent';
    if (grade >= 80) return 'grade-good';
    if (grade >= 70) return 'grade-average';
    return 'grade-poor';
}

async function handleSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const submissionData = {
        assignmentId: formData.get('assignmentId'),
        gitHubLink: formData.get('gitHubLink'),
        partner: formData.get('partner') || undefined
    };
    
    const submitButton = event.target.querySelector('button[type=\"submit\"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.innerHTML = '<div class=\"loading\"></div> Submitting...';
        submitButton.disabled = true;
        
        await apiRequest('/student/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
        
        showSuccess('Assignment submitted successfully!');
        event.target.reset();
        
        // Refresh grades
        loadGrades();
        
    } catch (error) {
        showError('submissionError', error.message);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}