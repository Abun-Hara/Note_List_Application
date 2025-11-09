// Profile page JavaScript
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileNameInput = document.getElementById('profileNameInput');
const profileEmailInput = document.getElementById('profileEmailInput');
const totalNotes = document.getElementById('totalNotes');
const memberSince = document.getElementById('memberSince');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const profileError = document.getElementById('profileError');
const profileSuccess = document.getElementById('profileSuccess');
const passwordError = document.getElementById('passwordError');
const passwordSuccess = document.getElementById('passwordSuccess');
const logoutBtn = document.getElementById('logoutBtn');
const profileAvatar = document.getElementById('profileAvatar');
const profileImageInput = document.getElementById('profileImageInput');

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}

// Get auth token for API requests
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Load profile data
async function loadProfile() {
  if (!checkAuth()) return;

  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const user = response.data.user;
      const stats = response.data.stats;

      // Update UI
      profileName.textContent = user.name;
      profileEmail.textContent = user.email;
      profileNameInput.value = user.name;
      profileEmailInput.value = user.email;
      totalNotes.textContent = stats.totalNotes || 0;

      // Update profile image
      if (user.profile_image) {
        const img = document.createElement('img');
        img.src = user.profile_image;
        img.alt = user.name;
        profileAvatar.innerHTML = '';
        profileAvatar.appendChild(img);
      } else {
        profileAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
      }

      // Format member since date
      if (user.created_at) {
        const date = new Date(user.created_at);
        memberSince.textContent = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else {
        memberSince.textContent = 'Recently';
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      window.location.href = '/auth.html';
    } else {
      showError(profileError, 'Failed to load profile. Please try again.');
    }
  }
}

// Update profile
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  if (!checkAuth()) return;

  const name = profileNameInput.value.trim();

  if (!name) {
    showError(profileError, 'Name is required');
    return;
  }

  try {
    const response = await axios.put('/api/auth/profile', 
      { name },
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      profileName.textContent = name;
      localStorage.setItem('userName', name);
      showSuccess(profileSuccess, 'Profile updated successfully!');
    } else {
      showError(profileError, response.data.message || 'Failed to update profile');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update profile. Please try again.';
    showError(profileError, message);
  }
});

// Change password
passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  if (!checkAuth()) return;

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showError(passwordError, 'All password fields are required');
    return;
  }

  if (newPassword.length < 6) {
    showError(passwordError, 'New password must be at least 6 characters long');
    return;
  }

  if (newPassword !== confirmPassword) {
    showError(passwordError, 'New passwords do not match');
    return;
  }

  try {
    const response = await axios.put('/api/auth/password',
      { currentPassword, newPassword },
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      showSuccess(passwordSuccess, 'Password changed successfully!');
      passwordForm.reset();
    } else {
      showError(passwordError, response.data.message || 'Failed to change password');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to change password. Please try again.';
    showError(passwordError, message);
  }
});

// Image upload handler
profileImageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showError(profileError, 'Please select a valid image file');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError(profileError, 'Image size must be less than 5MB');
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = 'Profile';
    profileAvatar.innerHTML = '';
    profileAvatar.appendChild(img);
  };
  reader.readAsDataURL(file);

  // Upload image
  try {
    const formData = new FormData();
    formData.append('profileImage', file);

    const token = localStorage.getItem('authToken');
    const response = await axios.post('/api/auth/profile/image',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      showSuccess(profileSuccess, 'Profile image updated successfully!');
    } else {
      showError(profileError, response.data.message || 'Failed to upload image');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to upload image. Please try again.';
    showError(profileError, message);
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  window.location.href = '/auth.html';
});

// Helper functions
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

function showSuccess(element, message) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

function clearMessages() {
  profileError.classList.remove('show');
  profileSuccess.classList.remove('show');
  passwordError.classList.remove('show');
  passwordSuccess.classList.remove('show');
  profileError.textContent = '';
  profileSuccess.textContent = '';
  passwordError.textContent = '';
  passwordSuccess.textContent = '';
}

// Load profile on page load
window.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    loadProfile();
  }
});

