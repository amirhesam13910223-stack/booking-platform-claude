 /* ============================================
   WINNER-SELECTOR.JS - انتخاب برنده حراج
   ============================================ */

const WinnerSelector = {
    // ===== انتخاب برنده =====
    selectWinner: function(auction) {
        if (auction.bids.length === 0) {
            return { success: false, message: 'هیچ پیشنهادی ثبت نشده است', winner: null };
        }
        
        // مرتب‌سازی بر اساس قیمت (ارزان‌ترین اول)
        const sortedBids = [...auction.bids].sort((a, b) => a.price - b.price);
        const winner = sortedBids[0];
        
        return {
            success: true,
            winner: winner,
            message: `برنده: ${winner.businessName} با قیمت ${winner.price.toLocaleString('fa-IR')} تومان`
        };
    },
    
    // ===== اعلام برنده =====
    announceWinner: function(auction, winner) {
        // ارسال نوتیفیکیشن به کاربر
        if (window.PushNotification) {
            window.PushNotification.sendNotification('🎉 برنده حراج مشخص شد!', {
                body: `حراج "${auction.title}" با قیمت ${winner.price.toLocaleString('fa-IR')} تومان به ${winner.businessName} رسید.`,
                data: { url: '/reverse-market' }
            });
        }
        
        // ارسال ایمیل (در صورت وجود)
        if (window.EmailSender) {
            // TODO: ارسال ایمیل به کاربر
        }
        
        App.emit('winner:selected', { auction, winner });
        
        InAppAlert.success(`حراج "${auction.title}" به پایان رسید. برنده: ${winner.businessName}`, 'پایان حراج');
    },
    
    // ===== تأیید نهایی نوبت =====
    confirmBooking: function(auction, winner) {
        const booking = {
            id: 'BK' + Date.now(),
            business: { id: winner.businessId, name: winner.businessName },
            service: { name: auction.title, price: winner.price },
            date: auction.date,
            customer: { id: auction.userId, name: auction.userName },
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        // ذخیره نوبت
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('user_bookings', JSON.stringify(bookings));
        
        App.emit(SystemEvents.BOOKING_CREATED, booking);
        
        return booking;
    },
    
    // ===== نمایش نتایج حراج =====
    showWinnerModal: function(auction) {
        const result = this.selectWinner(auction);
        
        const modal = ModalFactory.createModal({
            title: '🏆 نتیجه حراج',
            content: `
                <div class="winner-container">
                    ${result.success ? `
                        <div class="winner-info">
                            <div class="winner-icon">🏆</div>
                            <h3>${result.winner.businessName}</h3>
                            <p>قیمت برنده: ${result.winner.price.toLocaleString('fa-IR')} تومان</p>
                            <p>تعداد پیشنهادات: ${auction.bids.length}</p>
                        </div>
                        <button class="btn btn-primary confirm-booking">تأیید و رزرو نوبت</button>
                    ` : `
                        <div class="no-winner">
                            <p>${result.message}</p>
                        </div>
                    `}
                </div>
            `,
            onOpen: () => {
                const confirmBtn = document.querySelector('.confirm-booking');
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        this.confirmBooking(auction, result.winner);
                        ModalFactory.closeModal();
                        InAppAlert.success('نوبت شما با موفقیت رزرو شد');
                    });
                }
            }
        });
    }
};

window.WinnerSelector = WinnerSelector;
