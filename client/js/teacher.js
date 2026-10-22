// Teacher Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();

    // only teachers may use this page
    if (getUserRole() !== 'Teacher') {
        redirectToDashboard();
        return;
    }

    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = getUserId() || '';
    }

    setupNavigation();
    document.getElementById('assignmentForm').addEventListener('submit', handleCreateAssignment);
    loadSubmissions();
    loadAverages();
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const titles = {
        create: 'New Assignment',
        submissions: 'Student Submissions',
        stats: 'Average Grades'
    };

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            sections.forEach(section => section.classList.remove('active'));

            const target = this.getAttribute('data-section');
            document.getElementById(target + '-section').classList.add('active');
            document.getElementById('pageTitle').textContent = titles[target] || 'Dashboard';
        });
    });
}

async function handleCreateAssignment(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const payload = {
        title: formData.get('title'),
        description: formData.get('description'),
        dueDate: new Date(formData.get('dueDate')).toISOString()
    };

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    try {
        submitButton.disabled = true;
        clearErrors();
        await apiRequest('/teacher/assignments', { method: 'POST', body: JSON.stringify(payload) });
        showSuccess('Assignment created successfully!');
        event.target.reset();
        loadAverages();
    } catch (error) {
        showError('assignmentError', error.message);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

async function loadSubmissions() {
    const container = document.getElementById('submissionsList');
    container.innerHTML = '<div class="loading-spinner">Loading submissions...</div>';

    try {
        const submissions = await apiRequest('/teacher/submissions');

        if (submissions.length === 0) {
            container.innerHTML = '<div class="no-data">No submissions yet.</div>';
            return;
        }

        container.innerHTML = submissions.map(sub => {
            const student = sub.studentId || {};
            const partner = sub.partner;
            const assignment = sub.assignmentId || {};
            const graded = sub.grade !== undefined && sub.grade !== null;

            return `
                <div class="submission-card" data-student="${escapeHtml(student.userId || '')}" data-assignment="${escapeHtml(assignment._id || assignment.id || '')}">
                    <h3>${escapeHtml(assignment.title || 'Unknown assignment')}</h3>
                    <div class="meta">Student: ${escapeHtml(student.name || '')} (${escapeHtml(student.userId || '')})</div>
                    ${partner ? `<div class="meta">Partner: ${escapeHtml(partner.name || '')} (${escapeHtml(partner.userId || '')})</div>` : ''}
                    <div class="meta"><a href="${escapeHtml(sub.githubLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sub.githubLink)}</a></div>
                    <div class="grade-form">
                        <input type="number" min="0" max="100" step="any" placeholder="Grade" value="${graded ? escapeHtml(sub.grade) : ''}">
                        <input type="text" placeholder="Feedback" value="${escapeHtml(sub.feedback || '')}">
                        <button class="btn btn-success" onclick="saveGrade(this)">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `<div class="error-message" style="display:block">Error loading submissions: ${escapeHtml(error.message)}</div>`;
    }
}

async function saveGrade(button) {
    const card = button.closest('.submission-card');
    const [gradeInput, feedbackInput] = card.querySelectorAll('.grade-form input');

    if (gradeInput.value === '') {
        showSuccess('Enter a grade first');
        return;
    }

    try {
        button.disabled = true;
        await apiRequest(`/teacher/submissions/${encodeURIComponent(card.dataset.student)}/${encodeURIComponent(card.dataset.assignment)}`, {
            method: 'PUT',
            body: JSON.stringify({ grade: Number(gradeInput.value), feedback: feedbackInput.value })
        });
        showSuccess('Grade saved');
        loadAverages();
    } catch (error) {
        showSuccess('Could not save: ' + error.message);
    } finally {
        button.disabled = false;
    }
}

async function loadAverages() {
    const container = document.getElementById('averagesList');

    try {
        const averages = await apiRequest('/teacher/stats/averages');

        if (averages.length === 0) {
            container.innerHTML = '<div class="no-data">No assignments yet.</div>';
            return;
        }

        container.innerHTML = averages.map(item => {
            const hasAverage = item.Average !== null && item.Average !== undefined;
            return `
                <div class="grade-item">
                    <div class="grade-title">${escapeHtml(item.assignmentTitle)}</div>
                    <span class="grade-score ${hasAverage ? getGradeClass(item.Average) : 'grade-pending'}">${hasAverage ? Math.round(item.Average) : 'N/A'}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `<div class="error-message" style="display:block">Error loading averages: ${escapeHtml(error.message)}</div>`;
    }
}

function getGradeClass(grade) {
    if (grade === undefined || grade === null) return 'grade-pending';
    if (grade >= 90) return 'grade-excellent';
    if (grade >= 80) return 'grade-good';
    if (grade >= 70) return 'grade-average';
    return 'grade-poor';
}
