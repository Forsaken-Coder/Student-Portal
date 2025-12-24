// Initialize particles.js
particlesJS("particles-js", {
  "particles": {
    "number": {
      "value": 80,
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": "#ffffff"
    },
    "shape": {
      "type": "circle",
      "stroke": {
        "width": 0,
        "color": "#000000"
      },
      "polygon": {
        "nb_sides": 5
      }
    },
    "opacity": {
      "value": 0.5,
      "random": false,
      "anim": {
        "enable": false,
        "speed": 1,
        "opacity_min": 0.1,
        "sync": false
      }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": {
        "enable": false,
        "speed": 40,
        "size_min": 0.1,
        "sync": false
      }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#ffffff",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 4,
      "direction": "none",
      "random": false,
      "straight": false,
      "out_mode": "out",
      "bounce": false,
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": {
        "enable": true,
        "mode": "grab"
      },
      "onclick": {
        "enable": true,
        "mode": "push"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 200,
        "line_linked": {
          "opacity": 1
        }
      },
      "bubble": {
        "distance": 400,
        "size": 40,
        "duration": 2,
        "opacity": 8,
        "speed": 3
      },
      "repulse": {
        "distance": 200,
        "duration": 0.4
      },
      "push": {
        "particles_nb": 4
      },
      "remove": {
        "particles_nb": 2
      }
    }
  },
  "retina_detect": true
});

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Error message element
  const errorMsg = document.getElementById("errorMsg");

  // Main Login Handler
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const rollInput = document.getElementById("roll");
    const passwordInput = document.getElementById("password");
    const loginButton = loginForm.querySelector(".login-button");

    const roll_no = rollInput.value.trim();
    const password = passwordInput.value;

    if (!roll_no || !password) {
      showError("❌ Please fill both fields.");
      return;
    }

    // Show loading state
    loginButton.classList.add("loading");
    loginButton.disabled = true;
    showError("Attempting login...");

    try {
      // Try to connect to backend
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: roll_no, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store authentication data
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(data.student));
        localStorage.setItem("token", data.token);

        showSuccess("✓ Login successful! Redirecting...");
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }
    } catch (err) {
      console.warn("Backend not reachable. Using demo mode.", err.message);

      // Demo mode fallback
      if (roll_no === "23FA-003-SE" && password === "12345678") {
        const demoStudent = {
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
        };

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(demoStudent));
        localStorage.setItem("token", "demo-token");

        showSuccess("✓ [DEMO] Login successful! Redirecting...");
        
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        showError("❌ Invalid credentials. Use: 23FA-003-SE / 12345678");
        passwordInput.value = "";
        passwordInput.focus();
      }
    } finally {
      // Remove loading state
      loginButton.classList.remove("loading");
      loginButton.disabled = false;
    }
  });

  // Enter key support for password field
  document.getElementById("password")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loginForm.dispatchEvent(new Event("submit"));
    }
  });

  // Helper functions
  function showError(message) {
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.className = "";
      errorMsg.style.color = "#e74c3c";
    }
  }

  function showSuccess(message) {
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.className = "success-message";
      errorMsg.style.color = "#2ecc71";
    }
  }
});

// Add some interactive effects
document.addEventListener("DOMContentLoaded", function() {
  // Add hover effect to input fields
  const inputs = document.querySelectorAll("input[type='text'], input[type='password']");
  inputs.forEach(input => {
    input.addEventListener("focus", function() {
      this.parentElement.style.transform = "scale(1.02)";
    });
    
    input.addEventListener("blur", function() {
      this.parentElement.style.transform = "scale(1)";
    });
  });

  // Add ripple effect to button
  const loginButton = document.querySelector(".login-button");
  if (loginButton) {
    loginButton.addEventListener("click", function(e) {
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }
});

// Add ripple animation
const style = document.createElement("style");
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);