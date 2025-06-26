// Toggle Menu del Navbar - JavaScript Vanilla
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    // Debug: Log para verificar que los elementos existen
    console.log('Navbar elements:', {
        toggler: !!navbarToggler,
        collapse: !!navbarCollapse,
        links: navLinks.length
    });

    // Asegurar que los elementos existen antes de agregar event listeners
    if (!navbarToggler || !navbarCollapse) {
        console.error('Navbar elements not found');
        return;
    }

    // Toggle del menú móvil
    navbarToggler.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Toggle clicked'); // Debug
        
        // Toggle de la clase show
        const isOpen = navbarCollapse.classList.contains('show');
        
        if (isOpen) {
            navbarCollapse.classList.remove('show');
            navbarToggler.setAttribute('aria-expanded', 'false');
        } else {
            navbarCollapse.classList.add('show');
            navbarToggler.setAttribute('aria-expanded', 'true');
        }
        
        // Cambiar el ícono del toggle
        const icon = navbarToggler.querySelector('.navbar-toggler-icon');
        if (icon) {
            if (navbarCollapse.classList.contains('show')) {
                icon.style.transform = 'rotate(90deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        }
        
        console.log('Menu is now:', navbarCollapse.classList.contains('show') ? 'open' : 'closed'); // Debug
    });
    
    // Cerrar menú al hacer click en un enlace (móvil)
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function() {
            console.log(`Link ${index} clicked`); // Debug
            
            if (window.innerWidth <= 992) { // Solo en móvil/tablet
                navbarCollapse.classList.remove('show');
                navbarToggler.setAttribute('aria-expanded', 'false');
                const icon = navbarToggler.querySelector('.navbar-toggler-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
                console.log('Menu closed via link click'); // Debug
            }
        });
    });

    // Cerrar menú al hacer click fuera de él
    document.addEventListener('click', function(event) {
        if (!navbar.contains(event.target) && navbarCollapse.classList.contains('show')) {
            if (window.innerWidth <= 992) {
                navbarCollapse.classList.remove('show');
                navbarToggler.setAttribute('aria-expanded', 'false');
                const icon = navbarToggler.querySelector('.navbar-toggler-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        }
    });

    // Efecto de scroll en el navbar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });

    // Navegación suave mejorada
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo para enlaces internos (que empiecen con #)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const navbarHeight = navbar.offsetHeight;
                    const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Actualizar enlace activo
                    updateActiveNavLink(this);
                }
            }
        });
    });

    // Función para actualizar el enlace activo
    function updateActiveNavLink(activeLink) {
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    // Detectar sección visible al hacer scroll
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        const navbarHeight = navbar.offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navbarHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        // Actualizar enlace activo basado en la sección visible
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Animación de entrada para las tarjetas
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos para animación
    const animatedElements = document.querySelectorAll(
        '.tarjeta-contenido, .tarjeta-guia, .fase-juego, .paso-compra, .escenario-finalizacion'
    );
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // Efecto parallax sutil en el hero
    const heroSection = document.querySelector('.seccion-hero');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.2;
            
            if (scrolled < heroSection.offsetHeight) {
                heroSection.style.transform = `translateY(${rate}px)`;
            }
        });
    }

    // Cerrar menú al redimensionar ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992 && navbarCollapse.classList.contains('show')) {
            navbarCollapse.classList.remove('show');
            navbarToggler.setAttribute('aria-expanded', 'false');
            const icon = navbarToggler.querySelector('.navbar-toggler-icon');
            if (icon) {
                icon.style.transform = 'rotate(0deg)';
            }
        }
    });
});

// Función para detectar si el dispositivo es móvil
function isMobile() {
    return window.innerWidth <= 768;
}

// Función para detectar si el dispositivo es tablet
function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 992;
}