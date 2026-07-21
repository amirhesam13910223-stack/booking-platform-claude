/* ============================================
   RESERVATION.JS - ماژول رزرو نوبت نسخه Ultimate
   ============================================ */

   const BookingReservation = {
    // داده‌های نمونه
    businesses: [
        { id: 1, name: 'سالن زیبایی لیدا', category: 'آرایشگاه', rating: 4.8, address: 'تهران، سعادت‌آباد', phone: '021-12345678', image: '💄' },
        { id: 2, name: 'کلینیک دکتر محمدی', category: 'پزشکی', rating: 4.9, address: 'تهران، ونک', phone: '021-87654321', image: '🏥' },
        { id: 3, name: 'آرایشگاه سارا', category: 'آرایشگاه', rating: 4.7, address: 'تهران، جردن', phone: '021-44332211', image: '✂️' },
        { id: 4, name: 'باشگاه ورزشی المپیک', category: 'ورزشی', rating: 4.6, address: 'تهران، سهروردی', phone: '021-55443322', image: '🏋️' }
    ],
    
    services: [
        { id: 1, businessId: 1, name: 'کوتاهی مو زنانه', duration: 45, price: 250000, description: 'کوتاهی مو با جدیدترین متدها' },
        { id: 2, businessId: 1, name: 'رنگ مو', duration: 120, price: 450000, description: 'رنگ مو با بهترین مواد' },
        { id: 3, businessId: 1, name: 'ماسک مو', duration: 30, price: 150000, description: 'ماسک ترمیم کننده مو' },
        { id: 4, businessId: 1, name: 'حنا گذاری', duration: 60, price: 200000, description: 'حنا گذاری با طرح‌های متنوع' },
        { id: 5, businessId: 2, name: 'ویزیت عمومی', duration: 15, price: 200000, description: 'ویزیت توسط پزشک عمومی' },
        { id: 6, businessId: 2, name: 'ویزیت تخصصی', duration: 30, price: 350000, description: 'ویزیت توسط پزشک متخصص' },
        { id: 7, businessId: 2, name: 'نوار قلب', duration: 20, price: 150000, description: 'انجام نوار قلب' },
        { id: 8, businessId: 3, name: 'کوتاهی مو مردانه', duration: 30, price: 120000, description: 'کوتاهی مو با مدل دلخواه' },
        { id: 9, businessId: 3, name: 'اصلاح صورت', duration: 20, price: 80000, description: 'اصلاح صورت با تیغ استریل' },
        { id: 10, businessId: 3, name: 'کاشت مو', duration: 180, price: 2500000, description: 'کاشت مو به روش FUE' }
    ],
    
    availableTimes: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
    
    currentStep: 1,
    selectedBusiness: null,
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    customerInfo: {},
    discountAmount: 0,
    finalPrice: 0,
    
    init: function() {
        console.log('📅 ماژول Reservation نسخه Ultimate راه‌اندازی شد');
        this.attachGlobalEvents();
    },
    
    attachGlobalEvents: function() {
        if (window.App) {
            window.App.on('booking:open', () => this.openBookingPage());
        }
    },
    
    openBookingPage: function() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
        
        console.log('openBookingPage - token:', !!token, 'user:', user?.name);
        
        if (token && user) {
            this.customerInfo.name = user.name;
            this.customerInfo.phone = user.phone || '';
            this.showBookingModal();
        } else {
            if (window.showToast) {
                window.showToast('لطفاً ابتدا وارد حساب کاربری خود شوید', 'warning');
            } else {
                alert('لطفاً ابتدا وارد حساب کاربری خود شوید');
            }
            if (window.openModal) {
                setTimeout(() => window.openModal('loginModal'), 500);
            }
        }
    },
    
    showBookingModal: function() {
        this.resetBooking();
        this.createModal();
    },
    
    createModal: function() {
        const existingModal = document.getElementById('bookingModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'bookingModal';
        modal.className = 'booking-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); z-index: 100000;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="background: var(--bg-primary, #FFFFFF); border-radius: 20px; max-width: 750px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                <div style="position: sticky; top: 0; background: var(--bg-primary, #FFFFFF); padding: 20px 24px; border-bottom: 1px solid var(--border-color, #E5E7EB); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.5rem;">📅 رزرو نوبت</h2>
                    <button id="closeBookingModal" style="background: none; border: none; font-size: 28px; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;">&times;</button>
                </div>
                
                <div style="padding: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 32px; position: relative;">
                        <div style="flex:1; text-align: center; position: relative; z-index: 1;">
                            <div id="step1Indicator" style="width: 40px; height: 40px; background: #3B82F6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: bold;">1</div>
                            <div style="font-size: 14px; color: #3B82F6; font-weight: bold;">انتخاب سرویس</div>
                        </div>
                        <div style="flex:1; text-align: center; position: relative; z-index: 1;">
                            <div id="step2Indicator" style="width: 40px; height: 40px; background: #E5E7EB; color: #6B7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: bold;">2</div>
                            <div style="font-size: 14px; color: #9CA3AF;">انتخاب زمان</div>
                        </div>
                        <div style="flex:1; text-align: center; position: relative; z-index: 1;">
                            <div id="step3Indicator" style="width: 40px; height: 40px; background: #E5E7EB; color: #6B7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: bold;">3</div>
                            <div style="font-size: 14px; color: #9CA3AF;">اطلاعات شما</div>
                        </div>
                        <div style="flex:1; text-align: center; position: relative; z-index: 1;">
                            <div id="step4Indicator" style="width: 40px; height: 40px; background: #E5E7EB; color: #6B7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: bold;">4</div>
                            <div style="font-size: 14px; color: #9CA3AF;">تأیید نهایی</div>
                        </div>
                        <div style="position: absolute; top: 20px; left: 50px; right: 50px; height: 2px; background: #E5E7EB; z-index: 0;"></div>
                    </div>
                    
                    <!-- Step 1 -->
                    <div id="step1Content">
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">انتخاب کسب‌وکار</label>
                            <select id="businessSelect" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px; font-size: 14px;">
                                <option value="">انتخاب کنید...</option>
                                ${this.businesses.map(b => `<option value="${b.id}">${b.image} ${b.name} - ⭐ ${b.rating} | ${b.address}</option>`).join('')}
                            </select>
                        </div>
                        <div id="servicesContainer" style="display: none;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 14px;">انتخاب خدمت</label>
                            <div id="servicesList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;"></div>
                        </div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div id="step2Content" style="display: none;">
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">انتخاب تاریخ</label>
                            <input type="date" id="dateInput" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px;" min="${this.getMinDate()}">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 14px;">انتخاب ساعت</label>
                            <div id="timeSlots" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px;"></div>
                        </div>
                    </div>
                    
                    <!-- Step 3 -->
                    <div id="step3Content" style="display: none;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">نام کامل</label>
                            <input type="text" id="customerName" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px;" placeholder="نام و نام خانوادگی" value="${this.customerInfo.name || ''}">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">شماره تماس</label>
                            <input type="tel" id="customerPhone" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px;" placeholder="۰۹۱۲۱۲۳۴۵۶۷" value="${this.customerInfo.phone || ''}">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">ایمیل (اختیاری)</label>
                            <input type="email" id="customerEmail" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px;" placeholder="example@gmail.com">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">توضیحات اضافی</label>
                            <textarea id="customerNotes" rows="3" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px;" placeholder="نیازهای خاص..."></textarea>
                        </div>
                    </div>
                    
                    <!-- Step 4 -->
                    <div id="step4Content" style="display: none;">
                        <div id="summaryBox" style="background: #F3F4F6; border-radius: 16px; padding: 20px; margin-bottom: 20px;"></div>
                        <div style="background: #EFF6FF; border-radius: 16px; padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600;">مبلغ قابل پرداخت:</span>
                                <span id="finalPriceDisplay" style="font-size: 24px; font-weight: bold; color: #3B82F6;">0 تومان</span>
                            </div>
                            <div id="discountDisplay" style="font-size: 12px; color: #10B981; margin-top: 4px;"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 32px;">
                        <button id="prevBtn" style="padding: 12px 24px; background: #F3F4F6; border: none; border-radius: 12px; cursor: pointer; font-weight: 500; display: none;">← قبلی</button>
                        <button id="nextBtn" style="padding: 12px 32px; background: #3B82F6; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 500;">ادامه →</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        this.attachModalEvents();
    },
    
    attachModalEvents: function() {
        document.getElementById('closeBookingModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
        
        const businessSelect = document.getElementById('businessSelect');
        businessSelect?.addEventListener('change', (e) => {
            const businessId = parseInt(e.target.value);
            if (businessId) {
                this.selectedBusiness = this.businesses.find(b => b.id === businessId);
                this.loadServices(businessId);
                document.getElementById('servicesContainer').style.display = 'block';
            } else {
                document.getElementById('servicesContainer').style.display = 'none';
                this.selectedService = null;
            }
        });
        
        document.getElementById('dateInput')?.addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
            this.loadTimeSlots();
        });
    },
    
    loadServices: function(businessId) {
        const services = this.services.filter(s => s.businessId === businessId);
        const container = document.getElementById('servicesList');
        
        container.innerHTML = services.map(service => `
            <div class="service-card" data-id="${service.id}" style="padding: 16px; border: 1px solid #E5E7EB; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: bold; font-size: 16px;">${service.name}</div>
                    <div style="font-size: 18px; font-weight: bold; color: #3B82F6;">${service.price.toLocaleString('fa-IR')} تومان</div>
                </div>
                <div style="font-size: 13px; color: #6B7280; margin-bottom: 8px;">${service.description}</div>
                <div style="display: flex; gap: 16px; font-size: 12px; color: #9CA3AF;">
                    <span>⏱️ ${service.duration} دقیقه</span>
                    <span>📋 ${this.selectedBusiness?.name}</span>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.service-card').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.service-card').forEach(s => {
                    s.style.borderColor = '#E5E7EB';
                    s.style.backgroundColor = 'transparent';
                });
                el.style.borderColor = '#3B82F6';
                el.style.backgroundColor = '#EFF6FF';
                this.selectedService = services.find(s => s.id === parseInt(el.dataset.id));
            });
        });
    },
    
    loadTimeSlots: function() {
        const container = document.getElementById('timeSlots');
        const now = new Date();
        const selectedDateTime = new Date(this.selectedDate);
        const isToday = selectedDateTime.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        container.innerHTML = this.availableTimes.map(time => {
            const [hour, minute] = time.split(':').map(Number);
            let isDisabled = false;
            if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
                isDisabled = true;
            }
            return `<div class="time-slot" data-time="${time}" style="padding: 10px; text-align: center; border: 1px solid #E5E7EB; border-radius: 10px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; transition: all 0.2s; opacity: ${isDisabled ? 0.5 : 1};">${time}</div>`;
        }).join('');
        
        document.querySelectorAll('.time-slot:not([style*="not-allowed"])').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => {
                    s.style.borderColor = '#E5E7EB';
                    s.style.backgroundColor = 'transparent';
                });
                el.style.borderColor = '#3B82F6';
                el.style.backgroundColor = '#EFF6FF';
                this.selectedTime = el.dataset.time;
            });
        });
    },
    
    calculateDiscount: function(price) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let discount = 0;
        let discountPercent = 0;
        
        if (user.loyaltyTier === 'bronze') { discountPercent = 5; }
        else if (user.loyaltyTier === 'silver') { discountPercent = 10; }
        else if (user.loyaltyTier === 'gold') { discountPercent = 15; }
        else if (user.loyaltyTier === 'platinum') { discountPercent = 20; }
        else if (user.loyaltyTier === 'diamond') { discountPercent = 25; }
        
        discount = (price * discountPercent) / 100;
        return { discount, discountPercent };
    },
    
    nextStep: function() {
        if (this.currentStep === 1 && !this.selectedService) {
            alert('لطفاً کسب‌وکار و خدمت را انتخاب کنید');
            return;
        }
        if (this.currentStep === 2 && (!this.selectedDate || !this.selectedTime)) {
            alert('لطفاً تاریخ و ساعت را انتخاب کنید');
            return;
        }
        if (this.currentStep === 3) {
            const name = document.getElementById('customerName')?.value;
            const phone = document.getElementById('customerPhone')?.value;
            if (!name || !phone) {
                alert('لطفاً نام و شماره تماس را وارد کنید');
                return;
            }
            this.customerInfo = {
                name: name,
                phone: phone,
                email: document.getElementById('customerEmail')?.value || '',
                notes: document.getElementById('customerNotes')?.value || ''
            };
            
            const { discount, discountPercent } = this.calculateDiscount(this.selectedService.price);
            this.discountAmount = discount;
            this.finalPrice = this.selectedService.price - discount;
            
            this.updateSummary();
        }
        
        if (this.currentStep < 4) {
            this.currentStep++;
            this.updateStepsUI();
            
            if (this.currentStep === 4) {
                document.getElementById('nextBtn').textContent = '✅ تأیید نهایی';
            }
            
            if (this.currentStep === 5) {
                this.confirmBooking();
            }
        } else if (this.currentStep === 4) {
            this.confirmBooking();
        }
        
        document.getElementById('prevBtn').style.display = this.currentStep > 1 ? 'block' : 'none';
    },
    
    prevStep: function() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepsUI();
            document.getElementById('nextBtn').textContent = this.currentStep === 4 ? '✅ تأیید نهایی' : 'ادامه →';
            document.getElementById('prevBtn').style.display = this.currentStep > 1 ? 'block' : 'none';
        }
    },
    
    updateStepsUI: function() {
        const steps = [
            { indicator: 'step1Indicator', content: 'step1Content' },
            { indicator: 'step2Indicator', content: 'step2Content' },
            { indicator: 'step3Indicator', content: 'step3Content' },
            { indicator: 'step4Indicator', content: 'step4Content' }
        ];
        
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            const indicator = document.getElementById(step.indicator);
            const content = document.getElementById(step.content);
            
            if (stepNum === this.currentStep) {
                indicator.style.background = '#3B82F6';
                indicator.style.color = 'white';
                document.querySelector(`#${step.indicator} + div`).style.color = '#3B82F6';
                document.querySelector(`#${step.indicator} + div`).style.fontWeight = 'bold';
                content.style.display = 'block';
            } else if (stepNum < this.currentStep) {
                indicator.style.background = '#10B981';
                indicator.style.color = 'white';
                content.style.display = 'none';
            } else {
                indicator.style.background = '#E5E7EB';
                indicator.style.color = '#6B7280';
                document.querySelector(`#${step.indicator} + div`).style.color = '#9CA3AF';
                document.querySelector(`#${step.indicator} + div`).style.fontWeight = 'normal';
                content.style.display = 'none';
            }
        });
    },
    
    updateSummary: function() {
        const summaryBox = document.getElementById('summaryBox');
        const finalDisplay = document.getElementById('finalPriceDisplay');
        const discountDisplay = document.getElementById('discountDisplay');
        
        summaryBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">کسب‌وکار:</span>
                <strong>${this.selectedBusiness?.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">خدمت:</span>
                <strong>${this.selectedService?.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">تاریخ:</span>
                <strong>${this.selectedDate}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">ساعت:</span>
                <strong>${this.selectedTime}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">مدت زمان:</span>
                <strong>${this.selectedService?.duration} دقیقه</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">نام مشتری:</span>
                <strong>${this.customerInfo.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                <span style="color: #6B7280;">شماره تماس:</span>
                <strong>${this.customerInfo.phone}</strong>
            </div>
            ${this.customerInfo.email ? `<div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid #E5E7EB;"><span style="color: #6B7280;">ایمیل:</span><strong>${this.customerInfo.email}</strong></div>` : ''}
            ${this.customerInfo.notes ? `<div style="padding: 12px 0; border-top: 1px solid #E5E7EB;"><span style="color: #6B7280;">توضیحات:</span><p style="margin: 8px 0 0;">${this.customerInfo.notes}</p></div>` : ''}
        `;
        
        finalDisplay.textContent = this.finalPrice.toLocaleString('fa-IR') + ' تومان';
        
        if (this.discountAmount > 0) {
            discountDisplay.textContent = `✨ شما ${this.discountAmount.toLocaleString('fa-IR')} تومان تخفیف دریافت کردید!`;
        } else {
            discountDisplay.textContent = 'برای دریافت تخفیف، عضو باشگاه وفاداری شوید!';
        }
    },
    
    confirmBooking: function() {
        const bookingId = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
        const booking = {
            id: bookingId,
            business: this.selectedBusiness,
            service: this.selectedService,
            date: this.selectedDate,
            time: this.selectedTime,
            customer: this.customerInfo,
            originalPrice: this.selectedService.price,
            discount: this.discountAmount,
            finalPrice: this.finalPrice,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}`
        };
        
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        this.closeModal();
        
        if (window.showToast) {
            window.showToast(`✅ نوبت شما با کد ${bookingId} با موفقیت رزرو شد!`, 'success');
        } else {
            alert(`نوبت شما با کد ${bookingId} با موفقیت رزرو شد`);
        }
        
        if (window.App) {
            window.App.emit('booking:created', booking);
        }
    },
    
    resetBooking: function() {
        this.currentStep = 1;
        this.selectedBusiness = null;
        this.selectedService = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.discountAmount = 0;
        this.finalPrice = 0;
    },
    
    closeModal: function() {
        const modal = document.getElementById('bookingModal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
        this.resetBooking();
    },
    
    getMinDate: function() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        BookingReservation.init();
    });
}

window.BookingReservation = BookingReservation;