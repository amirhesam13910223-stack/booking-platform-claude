 /* ============================================
   GROUP-BOOKING.JS - رزرو گروهی
   ============================================ */

const BookingGroup = {
    // رزرو گروهی فعلی
    currentGroupBooking: null,
    participants: [],
    
    // تخفیف گروهی
    groupDiscounts: {
        '2': 5,   // 2 نفر: 5% تخفیف
        '3': 10,  // 3-4 نفر: 10% تخفیف
        '5': 15,  // 5-6 نفر: 15% تخفیف
        '7': 20   // 7+ نفر: 20% تخفیف
    },
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('👥 ماژول GroupBooking راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('booking:group-request', () => {
            this.showGroupBookingModal();
        });
    },
    
    // ===== نمایش مودال رزرو گروهی =====
    showGroupBookingModal: function() {
        this.resetGroupBooking();
        
        const modal = document.createElement('div');
        modal.id = 'groupBookingModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>👥 رزرو گروهی</h3>
                    <button class="modal-close" onclick="BookingGroup.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="group-info">
                        <p>با رزرو گروهی، از تخفیف‌های ویژه بهره‌مند شوید!</p>
                        <div class="discount-table">
                            <div class="discount-row">۲ نفر → ۵٪ تخفیف</div>
                            <div class="discount-row">۳-۴ نفر → ۱۰٪ تخفیف</div>
                            <div class="discount-row">۵-۶ نفر → ۱۵٪ تخفیف</div>
                            <div class="discount-row">۷+ نفر → ۲۰٪ تخفیف</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>انتخاب کسب‌وکار</label>
                        <select id="groupBusiness" class="form-control">
                            <option value="">انتخاب کنید...</option>
                            ${BookingReservation.businesses.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>انتخاب خدمت</label>
                        <select id="groupService" class="form-control" disabled>
                            <option value="">ابتدا کسب‌وکار را انتخاب کنید</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>تعداد نفرات</label>
                        <input type="number" id="groupCount" class="form-control" min="2" max="20" value="2">
                    </div>
                    
                    <div class="form-group">
                        <label>انتخاب تاریخ</label>
                        <input type="date" id="groupDate" class="form-control" min="${this.getMinDate()}">
                    </div>
                    
                    <div id="participantsContainer" style="display: none;">
                        <h4>اطلاعات شرکت‌کنندگان</h4>
                        <div id="participantsList"></div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="BookingGroup.closeModal()">انصراف</button>
                        <button class="btn btn-primary" id="createGroupBtn">ایجاد رزرو گروهی</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        this.attachGroupEvents();
    },
    
    // ===== اتصال رویدادهای مودال گروهی =====
    attachGroupEvents: function() {
        const businessSelect = document.getElementById('groupBusiness');
        const serviceSelect = document.getElementById('groupService');
        const groupCount = document.getElementById('groupCount');
        
        businessSelect?.addEventListener('change', (e) => {
            const businessId = parseInt(e.target.value);
            if (businessId) {
                const services = BookingReservation.services.filter(s => s.businessId === businessId);
                serviceSelect.innerHTML = '<option value="">انتخاب کنید...</option>' + 
                    services.map(s => `<option value="${s.id}">${s.name} - ${BookingReservation.formatPrice(s.price)}</option>`).join('');
                serviceSelect.disabled = false;
            } else {
                serviceSelect.disabled = true;
            }
        });
        
        groupCount?.addEventListener('change', (e) => {
            const count = parseInt(e.target.value);
            this.showParticipantsForm(count);
        });
        
        document.getElementById('createGroupBtn')?.addEventListener('click', () => {
            this.createGroupBooking();
        });
    },
    
    // ===== نمایش فرم شرکت‌کنندگان =====
    showParticipantsForm: function(count) {
        const container = document.getElementById('participantsContainer');
        const list = document.getElementById('participantsList');
        
        if (count >= 2) {
            container.style.display = 'block';
            
            let html = '';
            for (let i = 1; i <= count; i++) {
                html += `
                    <div class="participant-card">
                        <h5>شرکت‌کننده ${i}</h5>
                        <div class="form-group">
                            <input type="text" class="form-control" placeholder="نام کامل" id="participantName_${i}">
                        </div>
                        <div class="form-group">
                            <input type="tel" class="form-control" placeholder="شماره تماس" id="participantPhone_${i}">
                        </div>
                    </div>
                `;
            }
            list.innerHTML = html;
        } else {
            container.style.display = 'none';
        }
    },
    
    // ===== ایجاد رزرو گروهی =====
    createGroupBooking: async function() {
        const businessId = document.getElementById('groupBusiness')?.value;
        const serviceId = document.getElementById('groupService')?.value;
        const count = parseInt(document.getElementById('groupCount')?.value);
        const date = document.getElementById('groupDate')?.value;
        
        if (!businessId || !serviceId || !date || count < 2) {
            App.showToast('لطفاً تمام اطلاعات را کامل کنید', 'warning');
            return;
        }
        
        // جمع‌آوری اطلاعات شرکت‌کنندگان
        const participants = [];
        for (let i = 1; i <= count; i++) {
            const name = document.getElementById(`participantName_${i}`)?.value;
            const phone = document.getElementById(`participantPhone_${i}`)?.value;
            
            if (!name || !phone) {
                App.showToast(`لطفاً اطلاعات شرکت‌کننده ${i} را کامل کنید`, 'warning');
                return;
            }
            
            participants.push({ name, phone });
        }
        
        // محاسبه تخفیف
        const discount = this.getGroupDiscount(count);
        
        // دریافت اطلاعات خدمت و کسب‌وکار
        const business = BookingReservation.businesses.find(b => b.id === parseInt(businessId));
        const service = BookingReservation.services.find(s => s.id === parseInt(serviceId));
        const totalPrice = service.price * count;
        const discountedPrice = totalPrice * (100 - discount) / 100;
        
        App.showToast('در حال ایجاد رزرو گروهی...', 'info');
        
        await this.delay(1500);
        
        const groupId = 'GRP' + Date.now() + Math.floor(Math.random() * 1000);
        
        const groupBooking = {
            id: groupId,
            business: business,
            service: service,
            date: date,
            participants: participants,
            totalCount: count,
            originalPrice: totalPrice,
            discount: discount,
            finalPrice: discountedPrice,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        // ذخیره در localStorage
        const groupBookings = JSON.parse(localStorage.getItem('group_bookings') || '[]');
        groupBookings.push(groupBooking);
        localStorage.setItem('group_bookings', JSON.stringify(groupBookings));
        
        App.showToast(`✅ رزرو گروهی با ${discount}% تخفیف ثبت شد! مبلغ کل: ${this.formatPrice(discountedPrice)}`, 'success');
        
        this.closeModal();
    },
    
    // ===== دریافت تخفیف گروهی =====
    getGroupDiscount: function(count) {
        if (count >= 7) return this.groupDiscounts['7'];
        if (count >= 5) return this.groupDiscounts['5'];
        if (count >= 3) return this.groupDiscounts['3'];
        return this.groupDiscounts['2'];
    },
    
    // ===== ریست رزرو گروهی =====
    resetGroupBooking: function() {
        this.currentGroupBooking = null;
        this.participants = [];
    },
    
    // ===== بستن مودال =====
    closeModal: function() {
        const modal = document.getElementById('groupBookingModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        this.resetGroupBooking();
    },
    
    // ===== توابع کمکی =====
    getMinDate: function() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },
    
    formatPrice: function(price) {
        if (!price) return '۰ تومان';
        return price.toLocaleString('fa-IR') + ' تومان';
    },
    
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// استایل‌های مودال گروهی
const groupStyles = `
<style>
.group-info {
    background: var(--color-primary-soft);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
    text-align: center;
}

.discount-table {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
    margin-top: 10px;
}

.discount-row {
    background: var(--bg-primary);
    padding: 5px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: bold;
}

.participant-card {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 15px;
}

.participant-card h5 {
    margin-bottom: 10px;
    color: var(--color-primary);
}
</style>
`;

if (!document.querySelector('#group-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'group-styles';
    styleSheet.textContent = groupStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    BookingGroup.init();
});

window.BookingGroup = BookingGroup;
