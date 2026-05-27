document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Dark / Light Theme Toggle System
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleIcon = themeToggleBtn.querySelector('i');
    
    // Synced initialization of button state
    if (document.body.classList.contains('dark-mode')) {
        themeToggleIcon.classList.remove('fa-moon');
        themeToggleIcon.classList.add('fa-sun');
    }
    
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            themeToggleIcon.classList.remove('fa-moon');
            themeToggleIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggleIcon.classList.remove('fa-sun');
            themeToggleIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (mobileMenu.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Smooth Scrolling for Anchor Links (fallback/enhancement)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for fade-in elements on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply observer to section titles and some cards
    const animatedElements = document.querySelectorAll('.section-title, .skill-card, .timeline-item, .service-hud-card');
    
    animatedElements.forEach(el => {
        // Initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        
        // Observe
        observer.observe(el);
    });

    // Animate HUD Skill Progress Indicators on scroll
    const diagContainer = document.querySelector('.hud-diagnostics-container');
    if (diagContainer) {
        const diagObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const barWrappers = entry.target.querySelectorAll('.diagnostic-bar-wrapper');
                    barWrappers.forEach(bar => {
                        const fill = bar.querySelector('.bar-fill');
                        const percentSpan = bar.querySelector('.bar-percentage');
                        const target = parseInt(percentSpan.getAttribute('data-target'), 10);
                        
                        // 1. Animate progress bar width
                        fill.style.width = target + '%';
                        
                        // 2. Animate numerical counter up from 0%
                        let current = 0;
                        const duration = 1800; // matching CSS transition duration (1.8s)
                        const startTime = performance.now();
                        
                        function countUp(timestamp) {
                            const elapsed = timestamp - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            
                            // Easing function (easeOutQuad)
                            const easedProgress = progress * (2 - progress);
                            current = Math.floor(easedProgress * target);
                            
                            percentSpan.textContent = current + '%';
                            
                            if (progress < 1) {
                                requestAnimationFrame(countUp);
                            } else {
                                percentSpan.textContent = target + '%';
                            }
                        }
                        
                        requestAnimationFrame(countUp);
                    });
                    
                    // Stop observing once triggered
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        diagObserver.observe(diagContainer);
    }

    // Live GitHub Integration
    const githubUser = 'sankaadikaramNW';
    
    async function loadGitHubStats() {
        try {
            // Fetch profile data
            const userResponse = await fetch(`https://api.github.com/users/${githubUser}`);
            if (!userResponse.ok) throw new Error('Profile fetch failed');
            const userData = await userResponse.json();
            
            // Update UI elements if response is valid
            if (userData) {
                document.getElementById('github-repos').textContent = userData.public_repos || 12;
                document.getElementById('github-followers').textContent = userData.followers !== undefined ? userData.followers : '--';
                if (userData.avatar_url) {
                    document.getElementById('github-avatar').src = userData.avatar_url;
                }
                if (userData.name) {
                    document.getElementById('github-name').textContent = userData.name;
                }
                if (userData.bio) {
                    document.getElementById('github-bio').textContent = userData.bio;
                }
            }
            
            // Fetch repositories to calculate stars and top languages
            const reposResponse = await fetch(`https://api.github.com/users/${githubUser}/repos?per_page=100`);
            if (reposResponse.ok) {
                const reposData = await reposResponse.json();
                
                // 1. Calculate total stars received across repos
                let totalStars = 0;
                const langCounts = {};
                
                reposData.forEach(repo => {
                    totalStars += repo.stargazers_count || 0;
                    if (repo.language) {
                        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
                    }
                });
                
                document.getElementById('github-stars').textContent = totalStars;
                
                // 2. Aggregate and sort top languages
                const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0);
                if (totalLangs > 0) {
                    const sortedLangs = Object.entries(langCounts)
                        .map(([name, count]) => ({
                            name,
                            percentage: Math.round((count / totalLangs) * 100)
                        }))
                        .sort((a, b) => b.percentage - a.percentage)
                        .slice(0, 4); // Show top 4 languages
                    
                    // Render language progress bars
                    const langColors = {
                        'Python': '#3572A5',
                        'JavaScript': '#f1e05a',
                        'PHP': '#4F5D95',
                        'HTML': '#e34c26',
                        'CSS': '#563d7c',
                        'C++': '#f34b7d',
                        'TypeScript': '#3178c6',
                        'Shell': '#89e051'
                    };
                    
                    const langContainer = document.getElementById('github-languages');
                    langContainer.innerHTML = ''; // clear default fallbacks
                    
                    sortedLangs.forEach(lang => {
                        const color = langColors[lang.name] || '#64748b';
                        const barHTML = `
                            <div class="lang-bar-item">
                                <div class="lang-info">
                                    <span class="lang-name">${lang.name}</span>
                                    <span class="lang-pct">${lang.percentage}%</span>
                                </div>
                                <div class="lang-progress-bg">
                                    <div class="lang-progress-fill" style="width: ${lang.percentage}%; background: ${color};"></div>
                                </div>
                            </div>
                        `;
                        langContainer.innerHTML += barHTML;
                    });
                }
            }
        } catch (error) {
            console.warn('GitHub API Rate Limited or Offline. Using elegant CSS fallback placeholders.', error);
        }
    }
    
    loadGitHubStats();

    // ----------------------------------------------------
    // Premium FormSubmit AJAX Submission & Toast Alert System
    // ----------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    
    // Helper function to show modern glassmorphic toast notification
    function showToast(message, type = 'success') {
        // Create or get toast container
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Set icon based on type
        const iconHTML = type === 'success' 
            ? '<i class="fas fa-check-circle"></i>' 
            : '<i class="fas fa-exclamation-circle"></i>';
            
        toast.innerHTML = `
            <div class="toast-icon">${iconHTML}</div>
            <div class="toast-message">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Force reflow and display transition
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                // Clean up container if empty
                if (toastContainer.childNodes.length === 0) {
                    toastContainer.remove();
                }
            }, 400); // matching CSS transition duration
        }, 5000);
    }

    // OPTIONAL: Set your Google Sheets Web App URL here to automatically log submissions in a Google Sheet
    const GOOGLE_SHEET_URL = ''; 

    // OPTIONAL: Set your MySQL PHP connector URL here to save submissions in a MySQL database (e.g. 'save_lead.php')
    const MYSQL_DB_URL = 'save_lead.php';

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Sending...';
            
            const formData = new FormData(contactForm);
            
            try {
                // 1. Log to Google Sheet (if GOOGLE_SHEET_URL is configured)
                if (GOOGLE_SHEET_URL) {
                    try {
                        await fetch(GOOGLE_SHEET_URL, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: formData.get('name'),
                                email: formData.get('email'),
                                message: formData.get('message')
                            })
                        });
                    } catch (sheetError) {
                        console.warn('Google Sheets logging failed, continuing:', sheetError);
                    }
                }

                // 2. Submit to the PHP Backend Controller (which securely saves to DB and sends Email notification)
                const response = await fetch(MYSQL_DB_URL, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok && result.status === 'success') {
                    showToast('Message sent! I will receive and review it shortly.', 'success');
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Contact Form Error:', error);
                showToast('Unable to send. Please try again later.', 'error');
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
});
