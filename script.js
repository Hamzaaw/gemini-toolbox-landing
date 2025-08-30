// Email validation and form handling
document.addEventListener('DOMContentLoaded', function() {
    // Handle both email forms
    const heroForm = document.getElementById('hero-email-form');
    const finalForm = document.getElementById('final-email-form');
    
    if (heroForm) {
        heroForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (finalForm) {
        finalForm.addEventListener('submit', handleFormSubmit);
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        const messageDiv = form.id === 'hero-email-form' 
            ? document.getElementById('hero-form-message')
            : document.getElementById('final-form-message');
        
        // Clear previous messages
        messageDiv.className = 'form-message';
        messageDiv.textContent = '';
        
        // Validate email
        if (!validateEmail(email)) {
            showMessage(messageDiv, 'Please enter a valid email address', 'error');
            return;
        }
        
        // Disable form during submission
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        emailInput.disabled = true;
        
        // Simulate API call (replace with actual API endpoint)
        submitToAPI(email)
            .then(() => {
                showMessage(messageDiv, '🎉 Success! You\'re on the list! We\'ll notify you when beta access is ready.', 'success');
                emailInput.value = '';
            })
            .catch(() => {
                showMessage(messageDiv, 'Something went wrong. Please try again.', 'error');
            })
            .finally(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                emailInput.disabled = false;
            });
    }
    
    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    }
    
    function showMessage(messageDiv, text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `form-message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.className = 'form-message';
            }, 5000);
        }
    }
    
    async function submitToAPI(email) {
        // Submit to Getform
        const formData = new FormData();
        formData.append('email', email);
        formData.append('source', 'gemini-toolbox-beta');
        formData.append('timestamp', new Date().toISOString());
        formData.append('_gotcha', ''); // Honeypot field for spam prevention
        
        try {
            const response = await fetch('https://getform.io/f/aqoemxna', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Submission failed');
            }
            
            // Also store locally as backup
            const subscribers = JSON.parse(localStorage.getItem('beta_subscribers') || '[]');
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('beta_subscribers', JSON.stringify(subscribers));
            }
            
            return response;
        } catch (error) {
            console.error('Form submission error:', error);
            // If API fails, just store locally and continue
            const subscribers = JSON.parse(localStorage.getItem('beta_subscribers') || '[]');
            if (subscribers.includes(email)) {
                throw new Error('Already subscribed');
            }
            subscribers.push(email);
            localStorage.setItem('beta_subscribers', JSON.stringify(subscribers));
            return { ok: true };
        }
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Slideshow functionality
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let slideInterval;
    
    function showSlide(n) {
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Wrap around if necessary
        if (n >= slides.length) currentSlide = 0;
        if (n < 0) currentSlide = slides.length - 1;
        
        // Show current slide
        if (slides[currentSlide]) {
            slides[currentSlide].classList.add('active');
        }
        if (dots[currentSlide]) {
            dots[currentSlide].classList.add('active');
        }
    }
    
    function nextSlide() {
        currentSlide++;
        showSlide(currentSlide);
    }
    
    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 4000); // Change slide every 4 seconds
    }
    
    function stopSlideshow() {
        clearInterval(slideInterval);
    }
    
    // Initialize slideshow if elements exist
    if (slides.length > 0) {
        // Add click handlers to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
                stopSlideshow();
                startSlideshow(); // Restart the interval
            });
        });
        
        // Pause on hover
        const slideshowContainer = document.querySelector('.slideshow-container');
        if (slideshowContainer) {
            slideshowContainer.addEventListener('mouseenter', stopSlideshow);
            slideshowContainer.addEventListener('mouseleave', startSlideshow);
        }
        
        // Start the slideshow
        startSlideshow();
    }
    
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 0.6s ease-out both';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe feature cards and stat cards for animations
    document.querySelectorAll('.feature-card, .stat-card').forEach(card => {
        observer.observe(card);
    });
});