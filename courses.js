// ===== CONFIGURATION =====
const CONFIG = {
  apiBaseUrl: 'http://localhost:5000/api',
  currentSemester: 'Fall 2024'
};

// ===== STATE MANAGEMENT =====
let state = {
  userData: null,
  theme: localStorage.getItem('theme') || 'dark',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  courses: [],
  filteredCourses: [],
  currentView: 'grid', // 'grid' or 'list'
  filters: {
    search: '',
    department: '',
    semester: '',
    type: '',
    status: ''
  },
  courseStats: {
    total: 0,
    completed: 0,
    inProgress: 0,
    creditsEarned: 0
  }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Courses Page...');
  
  // Check authentication
  checkAuthentication();
  
  // Initialize theme
  initTheme();
  
  // Load user data
  loadUserData();
  
  // Initialize components
  initComponents();
  
  // Load courses
  loadCourses();
  
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
      const response = await fetch(`${CONFIG.apiBaseUrl}/student/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        state.userData = data;
        console.log('✅ Live data loaded');
        updateUserInfo();
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
        department: "Software Engineering",
        semester: 4,
        batch: "23FA",
        cgpa: 3.42,
        creditHours: 18,
        attendanceRate: 92.5,
        classRank: 12,
        totalStudents: 85
      },
      enrolledCourses: [],
      academicHistory: []
    };
    
    console.log('🔄 Demo data loaded');
    updateUserInfo();
    
  } catch (error) {
    console.log('❌ Error loading data:', error.message);
    showToast('Error loading user data', 'danger');
  }
}

function updateUserInfo() {
  const user = state.userData?.student;
  if (!user) return;
  
  // Update header info
  const elements = {
    'miniName': `${user.firstName} ${user.lastName}`,
    'miniRoll': user.rollNumber,
    'userName': `${user.firstName} ${user.lastName}`,
    'miniAvatar': user.firstName.charAt(0)
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
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

// ===== LOAD COURSES =====
async function loadCourses() {
  try {
    showLoading(true);
    
    const token = localStorage.getItem('token');
    let courses = [];
    let academicHistory = [];
    
    if (token && token !== 'demo-token') {
      // Try to fetch from backend
      const response = await fetch(`${CONFIG.apiBaseUrl}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        courses = await response.json();
      }
      
      // Also get academic history for completed courses
      const historyResponse = await fetch(`${CONFIG.apiBaseUrl}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (historyResponse.ok) {
        const profileData = await historyResponse.json();
        academicHistory = profileData.academicHistory || [];
      }
    }
    
    // Use demo courses if backend fails
    if (courses.length === 0) {
      courses = getDemoCourses();
      academicHistory = getDemoAcademicHistory();
    }
    
    state.courses = courses;
    state.filteredCourses = courses;
    
    // Calculate stats
    calculateCourseStats(courses, academicHistory);
    
    renderCourses();
    updateCourseStats();
    
  } catch (error) {
    console.log('❌ Error loading courses:', error.message);
    showToast('Error loading courses', 'danger');
  } finally {
    showLoading(false);
  }
}

function getDemoCourses() {
  return [
    // Computer Science Courses
    {
      id: 1,
      code: 'CS101',
      title: 'Introduction to Programming',
      description: 'Fundamentals of programming using Python. Learn basic programming concepts, data types, control structures, and problem-solving techniques.',
      credits: 3,
      type: 'CORE',
      department: 'Computer Science',
      semester: 1,
      instructor: 'Dr. Sarah Johnson',
      maxStudents: 60,
      currentStudents: 45,
      prerequisites: 'None',
      objectives: 'Understand programming fundamentals and develop problem-solving skills',
      outcomes: 'Ability to write basic programs and understand software development concepts',
      status: 'completed'
    },
    {
      id: 2,
      code: 'CS102',
      title: 'Data Structures',
      description: 'Advanced data structures and algorithms. Study arrays, linked lists, stacks, queues, trees, and graphs.',
      credits: 4,
      type: 'CORE',
      department: 'Computer Science',
      semester: 2,
      instructor: 'Dr. Michael Chen',
      maxStudents: 50,
      currentStudents: 38,
      prerequisites: 'CS101',
      objectives: 'Master fundamental data structures and their applications',
      outcomes: 'Ability to implement and use various data structures efficiently',
      status: 'completed'
    },
    {
      id: 3,
      code: 'CS201',
      title: 'Object-Oriented Programming',
      description: 'OOP concepts with Java/C++. Learn encapsulation, inheritance, polymorphism, and abstraction.',
      credits: 4,
      type: 'CORE',
      department: 'Computer Science',
      semester: 2,
      instructor: 'Dr. Emily Rodriguez',
      maxStudents: 50,
      currentStudents: 42,
      prerequisites: 'CS101',
      objectives: 'Understand object-oriented programming principles',
      outcomes: 'Ability to design and implement object-oriented solutions',
      status: 'completed'
    },
    {
      id: 4,
      code: 'CS202',
      title: 'Database Systems',
      description: 'Database design and SQL. Learn relational database concepts, normalization, and query languages.',
      credits: 3,
      type: 'CORE',
      department: 'Computer Science',
      semester: 3,
      instructor: 'Dr. Robert Kim',
      maxStudents: 45,
      currentStudents: 35,
      prerequisites: 'CS102',
      objectives: 'Understand database management systems and SQL',
      outcomes: 'Ability to design and query relational databases',
      status: 'in-progress'
    },
    {
      id: 5,
      code: 'CS203',
      title: 'Web Development',
      description: 'Frontend and backend web technologies. Learn HTML, CSS, JavaScript, and server-side programming.',
      credits: 3,
      type: 'CORE',
      department: 'Computer Science',
      semester: 3,
      instructor: 'Dr. Lisa Anderson',
      maxStudents: 40,
      currentStudents: 32,
      prerequisites: 'CS101',
      objectives: 'Master web development technologies',
      outcomes: 'Ability to create full-stack web applications',
      status: 'in-progress'
    },
    {
      id: 6,
      code: 'CS301',
      title: 'Software Engineering',
      description: 'Software development methodologies. Learn requirements analysis, design patterns, testing, and project management.',
      credits: 4,
      type: 'CORE',
      department: 'Computer Science',
      semester: 4,
      instructor: 'Dr. Sarah Johnson',
      maxStudents: 35,
      currentStudents: 28,
      prerequisites: 'CS201, CS202',
      objectives: 'Understand software engineering principles and practices',
      outcomes: 'Ability to work in teams to develop software projects',
      status: 'registered'
    },
    {
      id: 7,
      code: 'CS302',
      title: 'Computer Networks',
      description: 'Network protocols and architectures. Study TCP/IP, routing, and network security.',
      credits: 3,
      type: 'CORE',
      department: 'Computer Science',
      semester: 4,
      instructor: 'Dr. Michael Chen',
      maxStudents: 40,
      currentStudents: 25,
      prerequisites: 'CS102',
      objectives: 'Understand computer networks and protocols',
      outcomes: 'Ability to design and troubleshoot network systems',
      status: 'registered'
    },
    {
      id: 8,
      code: 'CS401',
      title: 'Artificial Intelligence',
      description: 'AI and machine learning fundamentals. Study neural networks, deep learning, and AI applications.',
      credits: 3,
      type: 'ELECTIVE',
      department: 'Computer Science',
      semester: 6,
      instructor: 'Dr. Robert Kim',
      maxStudents: 30,
      currentStudents: 22,
      prerequisites: 'CS301, MATH201',
      objectives: 'Understand AI concepts and machine learning algorithms',
      outcomes: 'Ability to implement AI solutions for real-world problems',
      status: 'available'
    },
    // Mathematics Courses
    {
      id: 9,
      code: 'MATH101',
      title: 'Calculus I',
      description: 'Differential and integral calculus. Study limits, derivatives, and integrals.',
      credits: 4,
      type: 'CORE',
      department: 'Mathematics',
      semester: 1,
      instructor: 'Dr. John Taylor',
      maxStudents: 60,
      currentStudents: 48,
      prerequisites: 'None',
      objectives: 'Master fundamental calculus concepts',
      outcomes: 'Ability to solve calculus problems and apply to real-world scenarios',
      status: 'completed'
    },
    {
      id: 10,
      code: 'MATH102',
      title: 'Linear Algebra',
      description: 'Matrix theory and linear transformations. Study vectors, matrices, and linear systems.',
      credits: 3,
      type: 'CORE',
      department: 'Mathematics',
      semester: 2,
      instructor: 'Dr. Maria Garcia',
      maxStudents: 50,
      currentStudents: 35,
      prerequisites: 'None',
      objectives: 'Understand linear algebra concepts',
      outcomes: 'Ability to solve linear systems and apply transformations',
      status: 'completed'
    }
  ];
}

function getDemoAcademicHistory() {
  return [
    {
      course: 'CS101',
      status: 'COMPLETED',
      grade: 'A',
      credits: 3,
      semester: 'Fall 2023'
    },
    {
      course: 'CS102',
      status: 'COMPLETED',
      grade: 'A-',
      credits: 4,
      semester: 'Spring 2024'
    },
    {
      course: 'CS201',
      status: 'COMPLETED',
      grade: 'B+',
      credits: 4,
      semester: 'Spring 2024'
    },
    {
      course: 'MATH101',
      status: 'COMPLETED',
      grade: 'B',
      credits: 4,
      semester: 'Fall 2023'
    },
    {
      course: 'MATH102',
      status: 'COMPLETED',
      grade: 'A-',
      credits: 3,
      semester: 'Spring 2024'
    }
  ];
}

function calculateCourseStats(courses, academicHistory) {
  // Reset stats
  state.courseStats = {
    total: courses.length,
    completed: 0,
    inProgress: 0,
    creditsEarned: 0
  };
  
  // Count completed courses from academic history
  academicHistory.forEach(record => {
    if (record.status === 'COMPLETED') {
      state.courseStats.completed++;
      state.courseStats.creditsEarned += record.credits || 0;
    }
  });
  
  // Count current courses
  courses.forEach(course => {
    if (course.status === 'in-progress') {
      state.courseStats.inProgress++;
    }
  });
  
  // Add current in-progress credits
  courses.forEach(course => {
    if (course.status === 'in-progress') {
      state.courseStats.creditsEarned += course.credits || 0;
    }
  });
}

// ===== FILTER AND SEARCH =====
function initFilters() {
  // Search input
  const searchInput = document.getElementById('courseSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  // Filter dropdowns
  const departmentFilter = document.getElementById('departmentFilter');
  const semesterFilter = document.getElementById('semesterFilter');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  [departmentFilter, semesterFilter, typeFilter, statusFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', handleFilterChange);
    }
  });
  
  // View toggle buttons
  const gridView = document.getElementById('gridView');
  const listView = document.getElementById('listView');
  
  if (gridView) {
    gridView.addEventListener('click', () => setView('grid'));
  }
  
  if (listView) {
    listView.addEventListener('click', () => setView('list'));
  }
}

function handleSearch(event) {
  state.filters.search = event.target.value.toLowerCase();
  applyFilters();
}

function handleFilterChange() {
  state.filters.department = document.getElementById('departmentFilter').value;
  state.filters.semester = document.getElementById('semesterFilter').value;
  state.filters.type = document.getElementById('typeFilter').value;
  state.filters.status = document.getElementById('statusFilter').value;
  applyFilters();
}

function applyFilters() {
  let filtered = [...state.courses];
  
  // Apply search filter
  if (state.filters.search) {
    filtered = filtered.filter(course => 
      course.code.toLowerCase().includes(state.filters.search) ||
      course.title.toLowerCase().includes(state.filters.search) ||
      course.description.toLowerCase().includes(state.filters.search) ||
      course.instructor.toLowerCase().includes(state.filters.search)
    );
  }
  
  // Apply department filter
  if (state.filters.department) {
    filtered = filtered.filter(course => course.department === state.filters.department);
  }
  
  // Apply semester filter
  if (state.filters.semester) {
    filtered = filtered.filter(course => course.semester === parseInt(state.filters.semester));
  }
  
  // Apply type filter
  if (state.filters.type) {
    filtered = filtered.filter(course => course.type === state.filters.type);
  }
  
  // Apply status filter
  if (state.filters.status) {
    filtered = filtered.filter(course => course.status === state.filters.status);
  }
  
  state.filteredCourses = filtered;
  renderCourses();
}

function setView(view) {
  state.currentView = view;
  
  // Update button states
  const gridView = document.getElementById('gridView');
  const listView = document.getElementById('listView');
  
  if (view === 'grid') {
    gridView.classList.add('active');
    listView.classList.remove('active');
  } else {
    listView.classList.add('active');
    gridView.classList.remove('active');
  }
  
  renderCourses();
}

// ===== RENDER COURSES =====
function renderCourses() {
  const container = document.getElementById('coursesContainer');
  if (!container) return;
  
  if (state.filteredCourses.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No courses found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }
  
  const viewClass = state.currentView === 'grid' ? 'courses-grid' : 'courses-list';
  container.innerHTML = `<div class="${viewClass}">${state.filteredCourses.map(course => renderCourseCard(course)).join('')}</div>`;
  
  // Add event listeners to course cards
  addCourseCardListeners();
}

function renderCourseCard(course) {
  const statusClass = course.status ? `status-${course.status.replace('_', '-')}` : '';
  const statusText = course.status ? course.status.replace('_', ' ').toUpperCase() : 'AVAILABLE';
  
  if (state.currentView === 'grid') {
    return `
      <div class="course-card" data-course-id="${course.id}">
        <div class="course-header">
          <div>
            <div class="course-code">${course.code}</div>
            <div class="course-title">${course.title}</div>
          </div>
          <div class="course-credits">
            <i class="fas fa-star"></i>
            ${course.credits} credits
          </div>
        </div>
        
        <div class="course-details">
          <div class="course-instructor">
            <i class="fas fa-user-tie"></i>
            ${course.instructor}
          </div>
          <div class="course-description">${course.description}</div>
          <div class="course-type course-badge ${course.type.toLowerCase()}">${course.type}</div>
        </div>
        
        <div class="course-meta">
          <div class="course-status ${statusClass}">${statusText}</div>
          <div class="course-actions">
            <button class="course-action-btn view-details-btn" onclick="showCourseDetails(${course.id})">
              <i class="fas fa-info-circle"></i>
              Details
            </button>
            <button class="course-action-btn view-resources-btn" onclick="viewCourseResources(${course.id})">
              <i class="fas fa-external-link-alt"></i>
              Resources
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="course-card" data-course-id="${course.id}">
        <div class="course-main">
          <div class="course-info">
            <div class="course-code">${course.code}</div>
            <div class="course-title">${course.title}</div>
            <div class="course-instructor">
              <i class="fas fa-user-tie"></i>
              ${course.instructor}
            </div>
            <div class="course-description">${course.description}</div>
            <div class="course-type course-badge ${course.type.toLowerCase()}">${course.type}</div>
          </div>
          <div class="course-credits">
            <i class="fas fa-star"></i>
            ${course.credits} credits
          </div>
        </div>
        
        <div class="course-meta">
          <div class="course-status ${statusClass}">${statusText}</div>
          <div class="course-actions">
            <button class="course-action-btn view-details-btn" onclick="showCourseDetails(${course.id})">
              <i class="fas fa-info-circle"></i>
              Details
            </button>
            <button class="course-action-btn view-resources-btn" onclick="viewCourseResources(${course.id})">
              <i class="fas fa-external-link-alt"></i>
              Resources
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

function addCourseCardListeners() {
  // Add click listeners to course cards for showing details
  const courseCards = document.querySelectorAll('.course-card');
  courseCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Only show details if not clicking on action buttons
      if (!e.target.closest('.course-actions')) {
        const courseId = parseInt(card.dataset.courseId);
        showCourseDetails(courseId);
      }
    });
  });
}

// ===== UPDATE COURSE STATS =====
function updateCourseStats() {
  document.getElementById('totalCourses').textContent = state.courseStats.total;
  document.getElementById('completedCourses').textContent = state.courseStats.completed;
  document.getElementById('inProgressCourses').textContent = state.courseStats.inProgress;
  document.getElementById('creditsEarned').textContent = state.courseStats.creditsEarned;
}

// ===== COURSE DETAILS MODAL =====
function showCourseDetails(courseId) {
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return;
  
  const modal = document.getElementById('courseModal');
  const modalTitle = document.getElementById('modalCourseTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = `${course.code}: ${course.title}`;
  
  modalContent.innerHTML = `
    <div class="course-detail-section">
      <h4><i class="fas fa-info-circle"></i> Course Information</h4>
      <p><strong>Code:</strong> ${course.code}</p>
      <p><strong>Title:</strong> ${course.title}</p>
      <p><strong>Credits:</strong> ${course.credits}</p>
      <p><strong>Type:</strong> <span class="course-badge ${course.type.toLowerCase()}">${course.type}</span></p>
      <p><strong>Department:</strong> ${course.department}</p>
      <p><strong>Semester:</strong> ${course.semester}</p>
      <p><strong>Status:</strong> <span class="course-status status-${course.status?.replace('_', '-') || 'available'}">${course.status ? course.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}</span></p>
    </div>
    
    <div class="course-detail-section">
      <h4><i class="fas fa-user-tie"></i> Instructor</h4>
      <p>${course.instructor}</p>
    </div>
    
    <div class="course-detail-section">
      <h4><i class="fas fa-align-left"></i> Description</h4>
      <p>${course.description}</p>
    </div>
    
    <div class="course-detail-section">
      <h4><i class="fas fa-bullseye"></i> Objectives</h4>
      <p>${course.objectives || 'To be updated'}</p>
    </div>
    
    <div class="course-detail-section">
      <h4><i class="fas fa-trophy"></i> Learning Outcomes</h4>
      <p>${course.outcomes || 'To be updated'}</p>
    </div>
    
    ${course.prerequisites ? `
      <div class="course-detail-section">
        <h4><i class="fas fa-lock"></i> Prerequisites</h4>
        <p>${course.prerequisites}</p>
      </div>
    ` : ''}
    
    <div class="course-detail-section">
      <h4><i class="fas fa-users"></i> Enrollment</h4>
      <p><strong>Current Students:</strong> ${course.currentStudents}</p>
      <p><strong>Maximum Capacity:</strong> ${course.maxStudents}</p>
      <p><strong>Available Seats:</strong> ${course.maxStudents - course.currentStudents}</p>
    </div>
    
    ${course.status === 'in-progress' ? `
      <div class="course-detail-section">
        <h4><i class="fas fa-chart-line"></i> Progress</h4>
        <div class="progress-indicator">
          <div class="progress-label">
            <span>Course Progress</span>
            <span>75%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-fill" style="width: 75%; background: linear-gradient(to right, #10b981, #34d399);"></div>
          </div>
        </div>
      </div>
    ` : ''}
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCourseModal() {
  const modal = document.getElementById('courseModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function viewCourseResources(courseId) {
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return;
  
  showToast(`Opening resources for ${course.code}: ${course.title}`, 'info');
  
  // Simulate opening resources
  setTimeout(() => {
    showToast('Resources loaded successfully!', 'success');
  }, 1000);
}

// ===== INITIALIZATION =====
function initComponents() {
  initThemeToggle();
  initSidebar();
  initFilters();
  initModals();
  initLogout();
}

function initModals() {
  // Close modal buttons
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalX = document.getElementById('closeModal');
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCourseModal);
  }
  
  if (closeModalX) {
    closeModalX.addEventListener('click', closeCourseModal);
  }
  
  // Close on overlay click
  const modal = document.getElementById('courseModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeCourseModal();
      }
    });
  }
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCourseModal();
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

// ===== UTILITY FUNCTIONS =====
function showLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

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
window.addEventListener('resize', debounce(() => {
  handleResize();
}, 250));

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
  console.error('Courses page error:', e.error);
  showToast('An error occurred. Some features may not work properly.', 'danger');
});

// ===== ADDITIONAL STYLES =====
const style = document.createElement('style');
style.textContent = `
  .course-modal .modal-btn.primary {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
  }
`;
document.head.appendChild(style);