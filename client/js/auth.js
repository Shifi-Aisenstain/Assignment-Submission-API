// Authentication Functions
document.addEventListener('DOMContentLoaded', function() {
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        userId: formData.get('userId'),
        password: formData.get('password')
    };
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // Show loading state
        submitButton.innerHTML = '<div class="loading"></div> Signing In...';
        submitButton.disabled = true;
        
        clearErrors();
        
        const response = await apiRequest('/authentication/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });
        
        if (response.token) {
            setToken(response.token);
            showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
        }
        
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const registerData = {
        _id: formData.get('_id'),
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // Show loading state
        submitButton.innerHTML = '<div class="loading"></div> Creating Account...';
        submitButton.disabled = true;
        
        clearErrors();
        
        // Validate password
        if (!validatePassword(registerData.password)) {
            throw new Error('Password must be at least 8 characters with letters and numbers');
        }
        
        const response = await apiRequest('/authentication/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        showSuccess('Account created successfully! Please login.');
        closeModal('registerModal');
        showModal('loginModal');
        
    } catch (error) {
        showError('registerError', error.message);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

function validatePassword(password) {
    if (password.length < 8) return false;
    if (!/[A-Za-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
}