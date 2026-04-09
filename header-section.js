 document.addEventListener('DOMContentLoaded', function() {
        let offerInterval;
        let countdownElements;
 
        const SALE_END_DATE = new Date(2025, 11, 6, 23, 59, 59); 
        const SALE_END_TIME = SALE_END_DATE.getTime();
        
        function initializeOfferContent() {
            if (Date.now() >= SALE_END_TIME) {
                setDefaultOffer();
                return;
            }
            
            setSaleOfferWithRemainingTime();
            
            startCountdownTimer();
        }
        
        function setSaleOfferWithRemainingTime() {
            const offerContent = document.querySelector('.offer-content');
            const remainingTime = Math.max(0, SALE_END_TIME - Date.now());
            
            const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {

                offerContent.innerHTML = `
                    <span class="offer-tag" style="order: 1;">-50%</span>
                    <div class="countdown" style="order: 2; margin-left: auto;">
                        <span class="time-unit">${days.toString().padStart(2, '0')}d</span>
                        <span class="time-unit">${hours.toString().padStart(2, '0')}h</span>
                        <span class="time-unit">${minutes.toString().padStart(2, '0')}m</span>
                        <span class="time-unit">${seconds.toString().padStart(2, '0')}s</span>
                    </div>
                    <span class="offer-text" style="order: 3; width: 100%; text-align: right; margin-top: 5px; padding-right: 10px;">Up to 50% Black Friday discounts!
                `;
            } else {
                offerContent.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 15px;">
                        <span class="offer-tag">Sale</span>
                        <span class="offer-text">Up to 50% Black Friday discounts!</span>
                        <div class="countdown">
                            <span class="time-unit">${days.toString().padStart(2, '0')}d</span>
                            <span class="time-unit">${hours.toString().padStart(2, '0')}h</span>
                            <span class="time-unit">${minutes.toString().padStart(2, '0')}m</span>
                            <span class="time-unit">${seconds.toString().padStart(2, '0')}s</span>
                        </div>
                    </div>
                `;
            }
            
            countdownElements = document.querySelectorAll('.time-unit');
        }
        
        function setDefaultOffer() {
            const offerContent = document.querySelector('.offer-content');
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                offerContent.innerHTML = `
                    <span class="offer-text" style="width: 100%; text-align: center; order: 1; margin-top: 0;">Up to 10% discounts on all Graphic Design services</span>
                `;
            } else {
                offerContent.innerHTML = `
                    <div style="display: flex; justify-content: center; width: 100%;">
                        <span class="offer-text" style="text-align: center;">Up to 10% discounts on all Graphic Design services</span>
                    </div>
                `;
            }
            
            if (offerInterval) clearInterval(offerInterval);
        }
        
        function startCountdownTimer() {
            if (offerInterval) clearInterval(offerInterval);
            
            offerInterval = setInterval(function() {
                updateCountdown();
                checkIfCountdownExpired();
            }, 1000);
        }
        
        function updateCountdown() {
            if (countdownElements && countdownElements.length === 4) {
                try {
                    const remainingTime = Math.max(0, SALE_END_TIME - Date.now());
                    
                    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                    
                    countdownElements[0].textContent = `${days.toString().padStart(2, '0')}d`;
                    countdownElements[1].textContent = `${hours.toString().padStart(2, '0')}h`;
                    countdownElements[2].textContent = `${minutes.toString().padStart(2, '0')}m`;
                    countdownElements[3].textContent = `${seconds.toString().padStart(2, '0')}s`;
                    
                } catch (error) {
                    console.error('Error updating countdown:', error);
                }
            }
        }
        
        function checkIfCountdownExpired() {
            if (Date.now() >= SALE_END_TIME) {
                setDefaultOffer();
            }
        }
        
        initializeOfferContent();
        
        function handleResize() {

            if (Date.now() < SALE_END_TIME) {
                setSaleOfferWithRemainingTime();
            } else {
                setDefaultOffer();
            }
        }
        
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });
        
        function testCountdown() {

            if (offerInterval) clearInterval(offerInterval);
            
            const testEndTime = Date.now() + (30 * 1000);
            
            const offerContent = document.querySelector('.offer-content');
            const remainingTime = Math.max(0, testEndTime - Date.now());
            
            const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                offerContent.innerHTML = `
                    <span class="offer-tag" style="order: 1;">Sale</span>
                    <div class="countdown" style="order: 2; margin-left: auto;">
                        <span class="time-unit">${days.toString().padStart(2, '0')}d</span>
                        <span class="time-unit">${hours.toString().padStart(2, '0')}h</span>
                        <span class="time-unit">${minutes.toString().padStart(2, '0')}m</span>
                        <span class="time-unit">${seconds.toString().padStart(2, '0')}s</span>
                    </div>
                    <span class="offer-text" style="order: 3; width: 100%; text-align: center; margin-top: 5px;">Up to 50% Black Friday discounts!</span>
                `;
            } else {
                offerContent.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 15px;">
                        <span class="offer-tag">Sale</span>
                        <span class="offer-text">Up to 50% Black Friday discounts!</span>
                        <div class="countdown">
                            <span class="time-unit">${days.toString().padStart(2, '0')}d</span>
                            <span class="time-unit">${hours.toString().padStart(2, '0')}h</span>
                            <span class="time-unit">${minutes.toString().padStart(2, '0')}m</span>
                            <span class="time-unit">${seconds.toString().padStart(2, '0')}s</span>
                        </div>
                    </div>
                `;
            }
            
            countdownElements = document.querySelectorAll('.time-unit');
            
            offerInterval = setInterval(function() {
                const remaining = Math.max(0, testEndTime - Date.now());
                const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
                const h = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((remaining % (1000 * 60)) / 1000);
                
                if (countdownElements.length === 4) {
                    countdownElements[0].textContent = `${d.toString().padStart(2, '0')}d`;
                    countdownElements[1].textContent = `${h.toString().padStart(2, '0')}h`;
                    countdownElements[2].textContent = `${m.toString().padStart(2, '0')}m`;
                    countdownElements[3].textContent = `${s.toString().padStart(2, '0')}s`;
                }
                
                if (remaining <= 0) {
                    clearInterval(offerInterval);
                    setDefaultOffer();
                }
            }, 1000);
        }
        
        const closeOfferBtns = document.querySelectorAll('.close-offer');
        const offerBar = document.getElementById('offerBar');
        
        closeOfferBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                offerBar.style.display = 'none';
            });
        });
        
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
        
        function openMobileMenu() {
            mobileMenu.classList.add('active');
            mobileMenuOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            mobileMenu.classList.remove('active');
            mobileMenuOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        mobileMenuButton.addEventListener('click', openMobileMenu);
        closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
        
        const mobileNavItems = document.querySelectorAll('.nav-item-mobile');
        mobileNavItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                mobileNavItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        const desktopNavLinks = document.querySelectorAll('.nav-link');
        desktopNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                desktopNavLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        function handleGetQuote() {
            alert('Get Quote feature: This would open a quote request form. Your request has been noted!');
        }
        
        document.getElementById('desktopQuoteBtn').addEventListener('click', handleGetQuote);
        document.getElementById('mobileQuoteBtn').addEventListener('click', handleGetQuote);
        document.getElementById('bottomNavQuoteBtn').addEventListener('click', function(e) {
            e.preventDefault();
            handleGetQuote();
        });
        
        function checkScreenSize() {
            const desktopSocial = document.querySelector('.desktop-social');
            if (window.innerWidth <= 768) {
                desktopSocial.style.display = 'none';
            } else {
                desktopSocial.style.display = 'flex';
            }
        }
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
    });