// Auth page JavaScript
const signInTab = document.getElementById('signInTab');
const signUpTab = document.getElementById('signUpTab');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const signInFormElement = document.getElementById('signInFormElement');
const signUpFormElement = document.getElementById('signUpFormElement');
const signInError = document.getElementById('signInError');
const signUpError = document.getElementById('signUpError');

// Tab switching
signInTab.addEventListener('click', () => {
  signInTab.classList.add('active');
  signUpTab.classList.remove('active');
  signInForm.classList.add('active');
  signUpForm.classList.remove('active');
  clearErrors();
});

signUpTab.addEventListener('click', () => {
  signUpTab.classList.add('active');
  signInTab.classList.remove('active');
  signUpForm.classList.add('active');
  signInForm.classList.remove('active');
  clearErrors();
});

function clearErrors() {
  signInError.classList.remove('show');
  signUpError.classList.remove('show');
  signInError.textContent = '';
  signUpError.textContent = '';
}

function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

// Sign In
signInFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('signInEmail').value.trim();
  const password = document.getElementById('signInPassword').value;

  if (!email || !password) {
    showError(signInError, 'Please fill in all fields');
    return;
  }

  try {
    const response = await axios.post('/api/auth/signin', { email, password });
    
    if (response.data.success) {
      // Store token
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('userName', response.data.name);
      
      // Redirect to main app
      window.location.href = '/';
    } else {
      showError(signInError, response.data.message || 'Invalid email or password');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to sign in. Please try again.';
    showError(signInError, message);
  }
});

// Sign Up
signUpFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById('signUpName').value.trim();
  const email = document.getElementById('signUpEmail').value.trim();
  const password = document.getElementById('signUpPassword').value;
  const confirmPassword = document.getElementById('signUpConfirmPassword').value;

  if (!name || !email || !password || !confirmPassword) {
    showError(signUpError, 'Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    showError(signUpError, 'Password must be at least 6 characters long');
    return;
  }

  if (password !== confirmPassword) {
    showError(signUpError, 'Passwords do not match');
    return;
  }

  try {
    const response = await axios.post('/api/auth/signup', { name, email, password });
    
    if (response.data.success) {
      // Store token
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('userName', response.data.name);
      
      // Redirect to main app
      window.location.href = '/';
    } else {
      showError(signUpError, response.data.message || 'Failed to create account');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to sign up. Please try again.';
    showError(signUpError, message);
  }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // Verify token is still valid
    axios.get('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      window.location.href = '/';
    }).catch(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
    });
  }
});

