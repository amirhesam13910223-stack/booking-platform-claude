/* ============================================
   AUCTION.JS - ماژول بازار معکوس
   ============================================ */

   const ReverseAuction = {
    init: function() {
        console.log('✅ ماژول Auction راه‌اندازی شد');
    },
    
    showAuctionsModal: function() {
        if (window.showToast) {
            window.showToast('🎯 بازار معکوس: شما پیشنهاد می‌دهید، کسب‌وکارها رقابت می‌کنند!', 'info');
        } else {
            alert('بازار معکوس: شما پیشنهاد می‌دهید، کسب‌وکارها رقابت می‌کنند!');
        }
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        ReverseAuction.init();
    });
}

window.ReverseAuction = ReverseAuction;