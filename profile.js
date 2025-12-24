// ===== CONFIGURATION =====
const CONFIG = {
  apiBaseUrl: 'http://localhost:5000/api'
};

// ===== STATE MANAGEMENT =====
let state = {
  userData: null,
  theme: localStorage.getItem('theme') || 'dark',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  isEditing: false,
  originalData: {},
  formData: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male'
  },
  settings: {
    emailNotifications: true,
    smsNotifications: false,
    publicProfile: false,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'UTC'
  }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Profile Page...');
  
  // Check authentication
  checkAuthentication();
  
  // Initialize theme
  initTheme();
  
  // Load user data
  loadUserData();
  
  // Initialize components
  initComponents();
  
  // Initialize particles
  initParticles();
  
  // Handle initial resize
  handleResize();
  
  // Apply initial sidebar state
  applySidebarState();
});

// ===== AUTHENTICATION =====
function checkAuthentication() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const token = localStorage.getItem('token');
  
  if (!isLoggedIn || !token) {
    window.location.href = 'login.html';
    return;
  }
}

// ===== LOAD USER DATA =====
async function loadUserData() {
  try {
    const token = localStorage.getItem('token');
    
    if (token && token !== 'demo-token') {
      // Try to fetch from backend
      const response = await fetch(`${CONFIG.apiBaseUrl}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        state.userData = data;
        console.log('✅ Live data loaded');
        updateProfileDisplay();
        return;
      }
    }
    
    // Use demo data
    state.userData = {
      student: {
        id: 1,
        rollNumber: "23FA-003-SE",
        firstName: "Ali",
        lastName: "Ahmed",
        email: "23fa-003-se@nexor.edu",
        phone: "+92 300 1234567",
        dateOfBirth: "2005-06-15",
        gender: "male",
        department: "Software Engineering",
        semester: 4,
        batch: "23FA",
        cgpa: 3.42,
        creditHours: 18,
        attendanceRate: 92.5,
        classRank: 12,
        totalStudents: 85
      },
      academicHistory: [
        {
          course: "CS101",
          title: "Introduction to Programming",
          semester: "Fall 2023",
          grade: "A",
          credits: 3,
          status: "COMPLETED"
        },
        {
          course: "CS102",
          title: "Data Structures",
          semester: "Spring 2024",
          grade: "A-",
          credits: 4,
          status: "COMPLETED"
        },
        {
          course: "CS201",
          title: "Object-Oriented Programming",
          semester: "Spring 2024",
          grade: "B+",
          credits: 4,
          status: "COMPLETED"
        },
        {
          course: "MATH101",
          title: "Calculus I",
          semester: "Fall 2023",
          grade: "B",
          credits: 4,
          status: "COMPLETED"
        },
        {
          course: "MATH102",
          title: "Linear Algebra",
          semester: "Spring 2024",
          grade: "A-",
          credits: 3,
          status: "COMPLETED"
        }
      ]
    };
    
    console.log('🔄 Demo data loaded');
    updateProfileDisplay();
    
  } catch (error) {
    console.log('❌ Error loading data:', error.message);
    showToast('Error loading user data', 'danger');
  }
}

function updateProfileDisplay() {
  const user = state.userData?.student;
  if (!user) return;
  
  // Update header info
  const elements = {
    'miniName': `${user.firstName} ${user.lastName}`,
    'miniRoll': user.rollNumber,
    'userName': `${user.firstName} ${user.lastName}`,
    'miniAvatar': user.firstName.charAt(0),
    'profileName': `${user.firstName} ${user.lastName}`,
    'profileRoll': user.rollNumber,
    'profileDepartment': user.department,
    'profileBatch': `Batch ${user.batch}`,
    'profileAvatar': `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
    'profileSemester': user.semester,
    'profileCGPA': user.cgpa.toFixed(2),
    'profileRank': user.classRank,
    'profileAttendance': `${user.attendanceRate.toFixed(1)}%`,
    'totalCredits': calculateTotalCredits(),
    'creditsCompleted': calculateCompletedCredits(),
    'currentCredits': user.creditHours,
    'expectedGraduation': calculateExpectedGraduation()
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
  
  // Update form data
  state.formData = {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth || '',
    gender: user.gender || 'male'
  };
  
  // Store original data
  state.originalData = { ...state.formData };
  
  // Update form inputs
  updateFormInputs();
  
  // Update academic history
  updateAcademicHistory();
}

function calculateTotalCredits() {
  return state.userData?.academicHistory?.reduce((sum, course) => sum + (course.credits || 0), 0) || 0;
}

function calculateCompletedCredits() {
  return state.userData?.academicHistory?.filter(course => course.status === 'COMPLETED')
    .reduce((sum, course) => sum + (course.credits || 0), 0) || 0;
}

function calculateExpectedGraduation() {
  const user = state.userData?.student;
  if (!user) return 'Spring 2026';
  
  const currentSemester = user.semester;
  const totalSemesters = 8;
  const remainingSemesters = totalSemesters - currentSemester;
  
  const seasons = ['Spring', 'Fall'];
  const currentYear = 2024;
  const expectedYear = currentYear + Math.ceil(remainingSemesters / 2);
  const expectedSeason = remainingSemesters % 2 === 0 ? 'Spring' : 'Fall';
  
  return `${expectedSeason} ${expectedYear}`;
}

function updateFormInputs() {
  const fields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'];
  fields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
      element.value = state.formData[field];
    }
  });
}

function updateAcademicHistory() {
  const historyContainer = document.getElementById('academicHistory');
  if (!historyContainer) return;
  
  const history = state.userData?.academicHistory || [];
  
  historyContainer.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-info">
        <div class="history-course">${item.course}: ${item.title}</div>
        <div class="history-details">${item.semester} • ${item.credits} credits</div>
      </div>
      <div class="history-grade grade-${item.grade.charAt(0)}">${item.grade}</div>
    </div>
  `).join('');
}

// ===== THEME MANAGEMENT =====
function initTheme() {
  const root = document.getElementById('themeRoot');
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!localStorage.getItem('theme')) {
    state.theme = prefersDark ? 'dark' : 'light';
  }
  
  root.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  
  // Update particles on theme change
  updateParticlesTheme();
}

function updateThemeIcon() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  const icon = themeToggle.querySelector('i');
  if (state.theme === 'dark') {
    icon.className = 'fas fa-sun';
    themeToggle.style.background = 'linear-gradient(135deg, #f59e0b, #fbbf24)';
  } else {
    icon.className = 'fas fa-moon';
    themeToggle.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
  }
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  const root = document.getElementById('themeRoot');
  
  if (!toggleBtn || !root) return;
  
  toggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    
    // Update icon
    updateThemeIcon();
    
    // Update particles
    updateParticlesTheme();
    
    // Show toast
    showToast(`Theme changed to ${state.theme} mode`, 'info');
  });
}

function updateParticlesTheme() {
  if (window.pJSDom && window.pJSDom.length > 0) {
    const particles = window.pJSDom[0].pJS;
    if (particles) {
      particles.particles.color.value = state.theme === 'dark' ? '#ffffff' : '#4f46e5';
      particles.particles.line_linked.color = state.theme === 'dark' ? '#ffffff' : '#4f46e5';
      particles.particles.line_linked.opacity = state.theme === 'dark' ? 0.1 : 0.05;
      particles.fn.particlesRefresh();
    }
  }
}

// ===== SIDEBAR MANAGEMENT =====
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleSidebar');
  const mobileToggle = document.getElementById('mobileToggle');
  
  // Desktop toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth > 992) {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
        updateToggleIcon();
        updateMainContentWidth();
      }
    });
  }
  
  // Mobile toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const isActive = sidebar.classList.contains('active');
      sidebar.classList.toggle('active', !isActive);
      
      if (!isActive) {
        createMobileOverlay();
      } else {
        removeMobileOverlay();
      }
      
      document.body.style.overflow = !isActive ? 'hidden' : '';
    });
  }
  
  // Close sidebar on window resize if needed
  window.addEventListener('resize', handleResize);
}

function updateMainContentWidth() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  if (window.innerWidth > 992) {
    if (state.sidebarCollapsed) {
      mainContent.style.marginLeft = '100px';
      mainContent.style.width = 'calc(100% - 100px)';
    } else {
      mainContent.style.marginLeft = '300px';
      mainContent.style.width = 'calc(100% - 300px)';
    }
  }
}

function createMobileOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
    overlay.remove();
  });
  document.body.appendChild(overlay);
}

function removeMobileOverlay() {
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ===== HANDLE RESIZE =====
function handleResize() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !mainContent) return;
  
  if (window.innerWidth > 992) {
    // Desktop mode
    sidebar.style.position = 'fixed';
    sidebar.style.left = '20px';
    sidebar.style.top = '20px';
    sidebar.style.height = 'calc(100vh - 40px)';
    sidebar.classList.remove('active');
    
    if (state.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }
    
    updateMainContentWidth();
  } else {
    // Mobile mode
    sidebar.style.position = 'fixed';
    sidebar.style.left = '-100%';
    sidebar.style.top = '20px';
    sidebar.style.height = 'calc(100vh - 40px)';
    sidebar.classList.remove('collapsed');
    
    mainContent.style.marginLeft = '0';
    mainContent.style.width = '100%';
    
    if (state.sidebarCollapsed) {
      state.sidebarCollapsed = false;
      localStorage.setItem('sidebarCollapsed', 'false');
    }
  }
}

function updateToggleIcon() {
  const toggleBtn = document.getElementById('toggleSidebar');
  if (!toggleBtn) return;
  
  const icon = toggleBtn.querySelector('i');
  if (state.sidebarCollapsed) {
    icon.className = 'fas fa-chevron-right';
    toggleBtn.title = 'Expand Sidebar';
  } else {
    icon.className = 'fas fa-chevron-left';
    toggleBtn.title = 'Collapse Sidebar';
  }
}

function applySidebarState() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !mainContent) return;
  
  if (state.sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    updateToggleIcon();
    
    if (window.innerWidth > 992) {
      mainContent.style.marginLeft = '100px';
      mainContent.style.width = 'calc(100% - 100px)';
    }
  }
}

// ===== INITIALIZATION =====
function initComponents() {
  initThemeToggle();
  initSidebar();
  initProfileActions();
  initSettings();
  initLogout();
}

function initProfileActions() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editPersonalBtn = document.getElementById('editPersonalBtn');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', toggleEditMode);
  }
  
  if (editPersonalBtn) {
    editPersonalBtn.addEventListener('click', toggleEditMode);
  }
  
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', () => {
      showToast('Avatar upload feature coming soon!', 'info');
    });
  }
}

function toggleEditMode() {
  state.isEditing = !state.isEditing;
  
  const sections = document.querySelectorAll('.profile-section');
  const editBtns = document.querySelectorAll('.edit-btn');
  const saveCancelBtns = document.querySelectorAll('.profile-actions-bottom button');
  const formInputs = document.querySelectorAll('.info-item input, .info-item select');
  
  if (state.isEditing) {
    // Enable edit mode
    sections.forEach(section => section.classList.add('edit-mode'));
    editBtns.forEach(btn => btn.style.display = 'none');
    saveCancelBtns.forEach(btn => btn.style.display = 'flex');
    formInputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        input.removeAttribute('disabled');
      } else {
        input.removeAttribute('disabled');
      }
    });
  } else {
    // Disable edit mode
    sections.forEach(section => section.classList.remove('edit-mode'));
    editBtns.forEach(btn => btn.style.display = 'flex');
    saveCancelBtns.forEach(btn => btn.style.display = 'none');
    formInputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        input.setAttribute('disabled', 'disabled');
      } else {
        input.setAttribute('disabled', 'disabled');
      }
    });
  }
}

function initSettings() {
  // Toggle switches
  const toggles = {
    emailNotifications: document.getElementById('emailNotifications'),
    smsNotifications: document.getElementById('smsNotifications'),
    publicProfile: document.getElementById('publicProfile'),
    twoFactorAuth: document.getElementById('twoFactorAuth')
  };

  Object.entries(toggles).forEach(([key, element]) => {
    if (element) {
      element.checked = state.settings[key];
      element.addEventListener('change', (e) => {
        state.settings[key] = e.target.checked;

        showToast(
          `${key.replace(/([A-Z])/g, ' $1').toUpperCase()} ${e.target.checked ? 'ENABLED' : 'DISABLED'}`,
          'info'
        );
      });
    }
  });

  // Select dropdowns
  const selects = {
    language: document.getElementById('language'),
    timezone: document.getElementById('timezone')
  };

  Object.entries(selects).forEach(([key, element]) => {
    if (element) {
      element.value = state.settings[key];
      element.addEventListener('change', (e) => {
        state.settings[key] = e.target.value;

        showToast(
          `${key.replace(/([A-Z])/g, ' $1').toUpperCase()} changed to ${e.target.value}`,
          'info'
        );
      });
    }
  });
}


function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to logout from Nexor Portal?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          showToast('Logging out...', 'info');
          
          setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
          }, 1500);
        }
      });
    });
  }
}

// ===== PARTICLES BACKGROUND =====
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
      particles: {
        number: { 
          value: state.theme === 'dark' ? 60 : 40, 
          density: { enable: true, value_area: 800 } 
        },
        color: { value: state.theme === 'dark' ? '#ffffff' : '#4f46e5' },
        shape: { type: "circle" },
        opacity: { value: state.theme === 'dark' ? 0.15 : 0.08, random: true },
        size: { value: 2, random: true },
        line_linked: { 
          enable: true, 
          distance: 150, 
          color: state.theme === 'dark' ? '#ffffff' : '#4f46e5', 
          opacity: state.theme === 'dark' ? 0.1 : 0.05, 
          width: 1 
        },
        move: { enable: true, speed: 1, direction: "none", random: true }
      },
      interactivity: { 
        detect_on: "canvas",
        events: { 
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" }
        } 
      },
      retina_detect: true
    });
  }
}

// ===== UPDATE DATE/TIME =====
function updateDateTime() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const dateTimeStr = now.toLocaleDateString('en-US', options);
  const element = document.getElementById('currentDateTime');
  if (element) element.textContent = dateTimeStr;
}

// Start date/time updates
setInterval(updateDateTime, 60000);
updateDateTime();

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
  handleResize();
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
  console.error('Profile page error:', e.error);
  showToast('An error occurred. Some features may not work properly.', 'danger');
});