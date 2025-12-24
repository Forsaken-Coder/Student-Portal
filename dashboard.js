// ===== CONFIGURATION =====
const CONFIG = {
  maxCredits: 21,
  targetCGPA: 3.75,
  currentSemester: 4,
  totalSemesters: 8,
  apiBaseUrl: '/api'
};

// ===== DEMO DATA =====
const DEMO_DATA = {
  student: {
    id: 1,
    rollNumber: "23FA-003-SE",
    firstName: "Ali",
    lastName: "Ahmed",
    email: "23fa-003-se@nexor.edu",
    department: "Software Engineering",
    semester: 4,
    cgpa: 3.42,
    creditHours: 18,
    attendanceRate: 92.5,
    classRank: 12,
    totalStudents: 85
  },
  
  cgpaHistory: {
    semesters: [1, 2, 3, 4],
    values: [2.85, 3.10, 3.28, 3.42],
    credits: [15, 16, 17, 18]
  },
  
  deadlines: [
    { 
      id: 1, 
      title: "Data Structures Assignment", 
      course: "CS-102", 
      due: "2024-12-20T23:59:00",
      type: "assignment",
      priority: "high"
    },
    { 
      id: 2, 
      title: "Database Systems Project", 
      course: "CS-202", 
      due: "2024-12-22T23:59:00",
      type: "project",
      priority: "high"
    },
    { 
      id: 3, 
      title: "Linear Algebra Quiz", 
      course: "MATH-102", 
      due: "2024-12-18T10:00:00",
      type: "quiz",
      priority: "medium"
    },
    {
      id: 4,
      title: "Web Development Lab",
      course: "CS-203",
      due: "2024-12-25T23:59:00",
      type: "lab",
      priority: "medium"
    }
  ],
  
  notifications: [
    {
      id: 1,
      title: "Exam Schedule Published",
      description: "Final exams schedule for Fall 2024 has been published.",
      time: "2 hours ago",
      type: "academic",
      important: true
    },
    {
      id: 2,
      title: "Course Registration Open",
      description: "Register for next semester courses before Dec 25, 2024.",
      time: "1 day ago",
      type: "registration",
      important: true
    },
    {
      id: 3,
      title: "Library Book Due",
      description: "Your borrowed book 'Clean Code' is due next week.",
      time: "2 days ago",
      type: "library",
      important: false
    },
    {
      id: 4,
      title: "Assignment Reminder",
      description: "Data Structures assignment due in 3 days.",
      time: "3 hours ago",
      type: "assignment",
      important: false
    }
  ],
  
  activity: [
    {
      id: 1,
      action: "Submitted assignment",
      details: "Data Structures - Assignment 3",
      time: "2 hours ago",
      icon: "fa-file-upload"
    },
    {
      id: 2,
      action: "Grade updated",
      details: "Database Systems: A- (88%)",
      time: "1 day ago",
      icon: "fa-chart-line"
    },
    {
      id: 3,
      action: "Course registered",
      details: "CS-301: Software Engineering",
      time: "2 days ago",
      icon: "fa-book"
    },
    {
      id: 4,
      action: "Attendance marked",
      details: "Present in Web Development class",
      time: "3 days ago",
      icon: "fa-user-check"
    }
  ],
  
  courses: [
    {
      id: 1,
      code: "CS-102",
      name: "Data Structures",
      progress: 85,
      grade: "A-",
      instructor: "Dr. Michael Chen",
      credits: 4
    },
    {
      id: 2,
      code: "CS-202",
      name: "Database Systems",
      progress: 72,
      grade: "B+",
      instructor: "Dr. Robert Kim",
      credits: 3
    },
    {
      id: 3,
      code: "MATH-102",
      name: "Linear Algebra",
      progress: 90,
      grade: "A",
      instructor: "Dr. Maria Garcia",
      credits: 3
    },
    {
      id: 4,
      code: "CS-203",
      name: "Web Development",
      progress: 78,
      grade: "B+",
      instructor: "Dr. Lisa Anderson",
      credits: 3
    }
  ]
};

// ===== STATE MANAGEMENT =====
let state = {
  userData: null,
  theme: localStorage.getItem('theme') || 'dark',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  searchOpen: false,
  mobileMenuOpen: false,
  logoutModalOpen: false,
  notifications: [],
  enrolledCourses: []
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Enhanced Dashboard...');
  
  // Check authentication
  checkAuthentication();
  
  // Initialize theme
  initTheme();
  
  // Load user data
  loadUserData();
  
  // Initialize components
  initComponents();
  
  // Render dynamic content
  renderDynamicContent();
  
  // Start real-time updates
  startRealtimeUpdates();
  
  // Initialize particles
  initParticles();
  
  // Show welcome message
  setTimeout(() => {
    showToast('Welcome to Nexor Portal!', 'success');
  }, 1000);
  
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
      const response = await fetch(`${CONFIG.apiBaseUrl}/student/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        state.userData = data;
        state.enrolledCourses = data.enrolledCourses || [];
        state.notifications = data.notifications || [];
        console.log('✅ Live data loaded');
        renderDynamicContent();
        return;
      }
    }
    
    // Use demo data
    state.userData = DEMO_DATA;
    state.notifications = DEMO_DATA.notifications;
    state.enrolledCourses = DEMO_DATA.courses;
    console.log('🔄 Demo data loaded');
    renderDynamicContent();
    
  } catch (error) {
    console.log('❌ Error loading data:', error.message);
    state.userData = DEMO_DATA;
    state.notifications = DEMO_DATA.notifications;
    state.enrolledCourses = DEMO_DATA.courses;
    renderDynamicContent();
  }
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
    
    // Update charts
    if (window.cgpaChart) {
      window.cgpaChart.destroy();
      renderCGPATrendChart();
    }
    
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
      // Only toggle if on desktop
      if (window.innerWidth > 992) {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
        updateToggleIcon();
        
        // Update main content width smoothly
        updateMainContentWidth();
        
        // Show tooltip for collapsed state
        if (state.sidebarCollapsed) {
          showToast('Sidebar collapsed. Hover on icons to see names.', 'info');
        }
      }
    });
  }
  
  // Mobile toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
      sidebar.classList.toggle('active', state.mobileMenuOpen);
      
      // Create or remove overlay
      if (state.mobileMenuOpen) {
        createMobileOverlay();
      } else {
        removeMobileOverlay();
      }
      
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = state.mobileMenuOpen ? 'hidden' : '';
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
    state.mobileMenuOpen = false;
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
    
    // Reset collapsed state if needed
    if (state.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }
    
    if (state.mobileMenuOpen) {
      state.mobileMenuOpen = false;
      document.body.style.overflow = '';
      removeMobileOverlay();
    }
    
    // Set main content width based on sidebar state
    updateMainContentWidth();
  } else {
    // Mobile mode
    sidebar.style.position = 'fixed';
    sidebar.style.left = '-100%';
    sidebar.style.top = '20px';
    sidebar.style.height = 'calc(100vh - 40px)';
    sidebar.classList.remove('collapsed');
    
    // Reset main content for mobile
    mainContent.style.marginLeft = '0';
    mainContent.style.width = '100%';
    
    // If sidebar was collapsed on desktop, reset it for mobile
    if (state.sidebarCollapsed) {
      state.sidebarCollapsed = false;
      localStorage.setItem('sidebarCollapsed', 'false');
      updateToggleIcon();
    }
  }
  
  // Update charts on resize
  if (window.cgpaChart) {
    setTimeout(() => {
      window.cgpaChart.resize();
    }, 100);
  }
  
  // Ensure no horizontal scroll
  document.body.style.overflowX = 'hidden';
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
    
    // Set main content margin for collapsed sidebar
    if (window.innerWidth > 992) {
      mainContent.style.marginLeft = '100px';
      mainContent.style.width = 'calc(100% - 100px)';
    }
  }
}

// ===== SEARCH FUNCTIONALITY =====
function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  const closeSearch = document.querySelector('.close-search');
  const searchInput = document.getElementById('globalSearch');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      state.searchOpen = true;
      searchModal.classList.add('active');
      setTimeout(() => searchInput.focus(), 100);
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeSearch) {
    closeSearch.addEventListener('click', closeSearchModal);
  }
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.searchOpen) {
      closeSearchModal();
    }
  });
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  // Close when clicking overlay
  searchModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('search-overlay')) {
      closeSearchModal();
    }
  });
}

function closeSearchModal() {
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('globalSearch');
  
  state.searchOpen = false;
  searchModal.classList.remove('active');
  document.body.style.overflow = '';
  
  if (searchInput) {
    searchInput.value = '';
    document.getElementById('searchResults').innerHTML = 
      '<p class="no-results">Start typing to search...</p>';
  }
}

function handleSearch(event) {
  const query = event.target.value.toLowerCase().trim();
  const resultsContainer = document.getElementById('searchResults');
  
  if (!query) {
    resultsContainer.innerHTML = '<p class="no-results">Start typing to search...</p>';
    return;
  }
  
  // Mock search results
  const allItems = [
    ...(state.enrolledCourses || []).map(course => ({
      type: 'course',
      title: `${course.code}: ${course.name}`,
      subtitle: course.instructor,
      icon: 'fa-book'
    })),
    ...DEMO_DATA.deadlines.map(deadline => ({
      type: 'deadline',
      title: deadline.title,
      subtitle: deadline.course,
      icon: 'fa-calendar-times'
    })),
    {
      type: 'resource',
      title: 'Database Systems Textbook PDF',
      subtitle: 'Recommended reading',
      icon: 'fa-file-pdf'
    },
    {
      type: 'announcement',
      title: 'Exam Schedule Update',
      subtitle: 'Important announcement',
      icon: 'fa-bullhorn'
    }
  ];
  
  const results = allItems.filter(item => 
    item.title.toLowerCase().includes(query) || 
    item.subtitle.toLowerCase().includes(query)
  );
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="no-results">No results found for "' + query + '"</p>';
    return;
  }
  
  resultsContainer.innerHTML = results.map(result => `
    <div class="search-result-item" onclick="handleSearchResult('${result.type}', '${result.title}')">
      <div class="result-type">${result.type}</div>
      <div class="result-title">${result.title}</div>
      <div class="result-subtitle">${result.subtitle}</div>
    </div>
  `).join('');
}

function handleSearchResult(type, title) {
  showToast(`Opening ${type}: ${title}`, 'info');
  closeSearchModal();
}

// ===== LOGOUT MODAL =====
function initLogoutModal() {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const cancelBtn = document.getElementById('cancelLogout');
  const confirmBtn = document.getElementById('confirmLogout');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLogoutModal();
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeLogoutModal);
  }
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmLogout);
  }
  
  // Close modal when clicking overlay
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('logout-overlay')) {
        closeLogoutModal();
      }
    });
  }
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.logoutModalOpen) {
      closeLogoutModal();
    }
  });
}

function openLogoutModal() {
  const logoutModal = document.getElementById('logoutModal');
  if (!logoutModal) return;
  
  state.logoutModalOpen = true;
  logoutModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLogoutModal() {
  const logoutModal = document.getElementById('logoutModal');
  if (!logoutModal) return;
  
  state.logoutModalOpen = false;
  logoutModal.classList.remove('active');
  document.body.style.overflow = '';
}

function confirmLogout() {
  showToast('Logging out...', 'info');
  
  // Simulate logout process
  setTimeout(() => {
    // Clear all data
    localStorage.clear();
    sessionStorage.clear();
    
    // Show success message
    showToast('Logged out successfully!', 'success');
    
    // Close modal
    closeLogoutModal();
    
    // Redirect to login page after delay
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  }, 1000);
}

// ===== NOTIFICATIONS =====
function initNotifications() {
  const notificationBtn = document.getElementById('notificationBtn');
  
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Notifications',
        html: getNotificationsHTML(),
        showCloseButton: true,
        showConfirmButton: false,
        width: 500,
        background: state.theme === 'dark' ? '#1e293b' : '#ffffff',
        color: state.theme === 'dark' ? '#ffffff' : '#1e293b',
        customClass: {
          popup: 'notifications-popup'
        }
      });
      
      // Clear notification badge
      const badge = notificationBtn.querySelector('.notification-badge');
      if (badge) {
        badge.style.display = 'none';
      }
    });
  }
}

function getNotificationsHTML() {
  const notifications = state.notifications || DEMO_DATA.notifications;
  
  return `
    <div class="notifications-modal">
      ${notifications.map(notif => `
        <div class="notification-modal-item ${notif.important ? 'important' : ''}">
          <div class="notification-modal-header">
            <div class="notification-modal-icon">
              <i class="fas fa-${notif.type === 'academic' ? 'graduation-cap' : notif.type === 'registration' ? 'clipboard-list' : 'book'}"></i>
            </div>
            <div class="notification-modal-content">
              <strong>${notif.title}</strong>
              <p>${notif.description}</p>
              <span class="notification-modal-time">${notif.time}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== QUICK ACTIONS =====
function initQuickActions() {
  const actions = ['quickAttendance', 'quickGrades', 'quickAssignments', 'quickResources'];
  
  actions.forEach(actionId => {
    const btn = document.getElementById(actionId);
    if (btn) {
      btn.addEventListener('click', () => {
        handleQuickAction(actionId.replace('quick', '').toLowerCase());
      });
      
      // Add ripple effect
      btn.addEventListener('click', createRippleEffect);
    }
  });
}

function createRippleEffect(event) {
  const btn = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const radius = diameter / 2;
  
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - btn.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - btn.getBoundingClientRect().top - radius}px`;
  circle.classList.add('ripple');
  
  const ripple = btn.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }
  
  btn.appendChild(circle);
}

function handleQuickAction(action) {
  const messages = {
    attendance: 'Opening Attendance Dashboard...',
    grades: 'Loading Grade Report...',
    assignments: 'Showing Pending Assignments...',
    resources: 'Opening Learning Resources...'
  };
  
  showToast(messages[action], 'info');
  
  // Simulate loading
  setTimeout(() => {
    showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} loaded successfully!`, 'success');
  }, 1000);
}

// ===== CHARTS INITIALIZATION =====
function initCharts() {
  renderCGPATrendChart();
}

function renderCGPATrendChart() {
  const canvas = document.getElementById('cgpaTrendChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = DEMO_DATA.cgpaHistory;
  
  // Destroy existing chart
  if (window.cgpaChart) {
    window.cgpaChart.destroy();
  }
  
  // Get theme colors
  const isDark = state.theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const primaryColor = isDark ? '#8b5cf6' : '#7c3aed';
  
  window.cgpaChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.semesters.map(sem => `Sem ${sem}`),
      datasets: [
        {
          label: 'CGPA',
          data: data.values,
          borderColor: primaryColor,
          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderColor: primaryColor,
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: primaryColor,
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `CGPA: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            maxRotation: 0
          }
        },
        y: {
          min: 2.0,
          max: 4.0,
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        }
      }
    }
  });
}

// ===== RENDER DYNAMIC CONTENT =====
function renderDynamicContent() {
  if (!state.userData) return;
  
  const user = state.userData.student || DEMO_DATA.student;
  
  // Update header
  updateHeader(user);
  
  // Update stats
  updateStats(user);
  
  // Render deadlines
  renderDeadlines();
  
  // Render notifications
  renderNotifications();
  
  // Render activity feed
  renderActivityFeed();
  
  // Render course progress
  renderCourseProgress();
}

function updateHeader(user) {
  // Welcome message
  const welcomeElement = document.getElementById('dynamicWelcome');
  if (welcomeElement) {
    const firstName = user.firstName || user.name?.split(' ')[0] || 'Student';
    welcomeElement.textContent = `Welcome back, ${firstName}!`;
    welcomeElement.style.background = state.theme === 'dark' 
      ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' 
      : 'linear-gradient(135deg, #7c3aed, #4f46e5)';
    welcomeElement.style.webkitBackgroundClip = 'text';
    welcomeElement.style.backgroundClip = 'text';
  }
  
  // User info
  const elements = {
    'miniName': `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Student',
    'miniRoll': user.rollNumber,
    'userName': `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Student',
    'miniAvatar': (user.firstName || user.name || 'S').charAt(0).toUpperCase()
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function updateStats(user) {
  // CGPA
  const cgpaElements = ['currentCGPA', 'cgpaCurrent'];
  cgpaElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = user.cgpa?.toFixed(2) || '0.00';
  });
  
  // Highest CGPA
  const cgpaHistory = DEMO_DATA.cgpaHistory;
  const highestCGPA = Math.max(...cgpaHistory.values).toFixed(2);
  document.getElementById('cgpaHighest').textContent = highestCGPA;
  
  // Target CGPA
  document.getElementById('cgpaTarget').textContent = CONFIG.targetCGPA.toFixed(2);
  
  // Attendance
  const attendanceRate = user.attendanceRate || DEMO_DATA.student.attendanceRate;
  document.getElementById('attendanceRate').textContent = `${attendanceRate.toFixed(1)}%`;
  
  // Pending tasks
  const deadlines = DEMO_DATA.deadlines;
  document.getElementById('pendingTasks').textContent = deadlines.length;
  
  // Class rank
  document.getElementById('classRank').textContent = user.classRank || 12;
  
  // Performance metrics
  const avgGrade = getGradeFromCGPA(user.cgpa || 3.42);
  document.getElementById('avgGrade').textContent = avgGrade;
  document.getElementById('creditLoad').textContent = `${user.creditHours || 18}/${CONFIG.maxCredits}`;
  document.getElementById('coursesCompleted').textContent = user.totalPassed || 24;
}

function getGradeFromCGPA(cgpa) {
  if (cgpa >= 3.7) return 'A';
  if (cgpa >= 3.3) return 'A-';
  if (cgpa >= 3.0) return 'B+';
  if (cgpa >= 2.7) return 'B';
  if (cgpa >= 2.3) return 'B-';
  if (cgpa >= 2.0) return 'C+';
  return 'C';
}

function renderDeadlines() {
  const container = document.getElementById('deadlinesList');
  const deadlines = DEMO_DATA.deadlines;
  
  if (!container) return;
  
  container.innerHTML = deadlines.map(deadline => {
    const dueDate = new Date(deadline.due);
    const now = new Date();
    const diffHours = Math.floor((dueDate - now) / (1000 * 60 * 60));
    
    let timeText, timeClass = '';
    if (diffHours < 0) {
      timeText = 'Overdue';
      timeClass = 'overdue';
    } else if (diffHours < 24) {
      timeText = `Due in ${diffHours}h`;
      timeClass = 'urgent';
    } else {
      const diffDays = Math.floor(diffHours / 24);
      timeText = `Due in ${diffDays}d`;
      timeClass = 'upcoming';
    }
    
    return `
      <div class="deadline-item ${timeClass}" onclick="handleDeadlineClick(${deadline.id})">
        <div class="deadline-icon">
          <i class="fas fa-${deadline.type === 'assignment' ? 'file-alt' : deadline.type === 'project' ? 'project-diagram' : 'clipboard-check'}"></i>
        </div>
        <div class="deadline-content">
          <div class="deadline-title">${deadline.title}</div>
          <div class="deadline-subtitle">${deadline.course}</div>
        </div>
        <div class="deadline-time ${timeClass}">${timeText}</div>
      </div>
    `;
  }).join('');
}

function handleDeadlineClick(id) {
  showToast(`Opening deadline details...`, 'info');
}

function renderNotifications() {
  const container = document.getElementById('notificationsList');
  const notifications = state.notifications || DEMO_DATA.notifications;
  
  if (!container) return;
  
  container.innerHTML = notifications.map(notif => `
    <div class="notification-item ${notif.important ? 'important' : ''}" onclick="handleNotificationClick(${notif.id})">
      <div class="notification-icon">
        <i class="fas fa-${notif.type === 'academic' ? 'graduation-cap' : notif.type === 'registration' ? 'clipboard-list' : 'book'}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${notif.title}</div>
        <div class="notification-desc">${notif.description}</div>
        <div class="notification-time">${notif.time}</div>
      </div>
    </div>
  `).join('');
}

function handleNotificationClick(id) {
  showToast('Notification marked as read', 'success');
}

function renderActivityFeed() {
  const container = document.getElementById('activityFeed');
  const activities = DEMO_DATA.activity;
  
  if (!container) return;
  
  container.innerHTML = activities.map(activity => `
    <div class="activity-item" onclick="handleActivityClick(${activity.id})">
      <div class="activity-icon">
        <i class="fas ${activity.icon}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-text">
          <strong>${activity.action}</strong>: ${activity.details}
        </div>
        <div class="activity-time">${activity.time}</div>
      </div>
    </div>
  `).join('');
}

function handleActivityClick(id) {
  showToast('Viewing activity details...', 'info');
}

function renderCourseProgress() {
  const container = document.getElementById('courseProgress');
  const courses = state.enrolledCourses || DEMO_DATA.courses;
  
  if (!container) return;
  
  container.innerHTML = courses.map(course => `
    <div class="course-progress-item" onclick="handleCourseClick('${course.code}')">
      <div class="course-header">
        <span class="course-name">${course.code}: ${course.name}</span>
        <span class="course-percent">${course.progress}%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-fill" style="width: ${course.progress}%; background: ${getProgressColor(course.progress)};"></div>
      </div>
      <div class="course-footer">
        <span class="course-instructor">${course.instructor}</span>
        <span class="course-grade">Current: ${course.grade}</span>
      </div>
    </div>
  `).join('');
}

function handleCourseClick(code) {
  showToast(`Opening ${code} course details...`, 'info');
}

function getProgressColor(progress) {
  if (progress >= 90) return 'linear-gradient(to right, #10b981, #34d399)';
  if (progress >= 70) return 'linear-gradient(to right, #f59e0b, #fbbf24)';
  return 'linear-gradient(to right, #ef4444, #f87171)';
}

// ===== REAL-TIME UPDATES =====
function startRealtimeUpdates() {
  // Update date/time every minute
  updateDateTime();
  setInterval(updateDateTime, 60000);
  
  // Simulate live updates every 30 seconds
  setInterval(simulateLiveUpdate, 30000);
}

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

function simulateLiveUpdate() {
  if (Math.random() > 0.7 && !state.searchOpen) {
    // Update notification count
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
      const badge = notificationBtn.querySelector('.notification-badge');
      if (badge) {
        const currentCount = parseInt(badge.textContent);
        badge.textContent = currentCount + 1;
        badge.style.display = 'flex';
        
        // Show toast notification
        showToast('New notification received!', 'info');
      }
    }
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

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 
               type === 'danger' ? 'fa-times-circle' : 'fa-info-circle';
  
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="toast-content">
      <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
      <p>${message}</p>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== INITIALIZATION COORDINATOR =====
function initComponents() {
  initThemeToggle();
  initSidebar();
  initSearch();
  initNotifications();
  initQuickActions();
  initLogoutModal();
  initCharts();
}

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', debounce(() => {
  handleResize();
}, 250));

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
  console.error('Dashboard error:', e.error);
  showToast('An error occurred. Some features may not work properly.', 'danger');
});

// ===== ADDITIONAL CSS FOR RIPPLE EFFECT =====
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    transform: scale(0);
    animation: ripple 0.6s linear;
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .notifications-popup {
    border-radius: 20px !important;
    border: 1px solid var(--border-color) !important;
  }
  
  .logout-popup {
    border-radius: 20px !important;
    border: 1px solid var(--border-color) !important;
  }
  
  .notification-modal-item {
    padding: 16px;
    border-radius: 12px;
    background: var(--glass-bg);
    margin-bottom: 12px;
    border-left: 4px solid var(--info);
  }
  
  .notification-modal-item.important {
    border-left-color: var(--danger);
  }
  
  .notification-modal-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  
  .notification-modal-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(6, 182, 212, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--info);
    flex-shrink: 0;
  }
  
  .notification-modal-item.important .notification-modal-icon {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
  }
  
  .notification-modal-content {
    flex: 1;
  }
  
  .notification-modal-content strong {
    display: block;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .notification-modal-content p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .notification-modal-time {
    font-size: 12px;
    color: var(--text-muted);
  }
  
  /* Fix for 100% width */
  html, body {
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  
  .dashboard-container {
    max-width: 100% !important;
  }
  
  /* Smooth transitions for mobile */
  .sidebar {
    transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  /* Prevent text overflow */
  .text-overflow-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
document.head.appendChild(style);