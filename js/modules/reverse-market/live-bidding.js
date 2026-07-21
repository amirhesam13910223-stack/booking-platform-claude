 /* ============================================
   LIVE-BIDDING.JS - پیشنهاددهی زنده در حراج
   ============================================ */

const LiveBidding = {
    // اتصال WebSocket برای پیشنهادات زنده
    wsConnection: null,
    
    // حراج فعال فعلی
    currentAuction: null,
    
    // وضعیت اتصال
    isConnected: false,
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.attachEvents();
        console.log('⚡ سیستم پیشنهاددهی زنده راه‌اندازی شد');
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('live-bidding:connect', (data) => {
            this.connectToAuction(data.auctionId);
        });
        
        App.on('live-bidding:disconnect', () => {
            this.disconnect();
        });
        
        App.on('live-bidding:place-bid', (data) => {
            this.placeLiveBid(data.auctionId, data.businessId, data.businessName, data.price);
        });
    },
    
    // ===== اتصال به حراج زنده =====
    connectToAuction: function(auctionId) {
        if (this.wsConnection) {
            this.disconnect();
        }
        
        this.currentAuction = ReverseAuction.getAuction(auctionId);
        if (!this.currentAuction) {
            InAppAlert.error('حراج مورد نظر یافت نشد');
            return;
        }
        
        // شبیه‌سازی اتصال WebSocket (در حالت واقعی به سرور متصل می‌شود)
        this.isConnected = true;
        this.startLiveUpdates();
        
        App.emit('live-bidding:connected', { auctionId });
        InAppAlert.success('به حراج زنده متصل شدید', 'اتصال برقرار شد');
    },
    
    // ===== قطع اتصال =====
    disconnect: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.isConnected = false;
        this.currentAuction = null;
        App.emit('live-bidding:disconnected');
    },
    
    // ===== شروع بروزرسانی زنده =====
    startLiveUpdates: function() {
        this.updateInterval = setInterval(() => {
            if (!this.currentAuction) return;
            
            // بروزرسانی حراج
            const updatedAuction = ReverseAuction.getAuction(this.currentAuction.id);
            if (updatedAuction) {
                this.currentAuction = updatedAuction;
                App.emit('live-bidding:updated', { auction: this.currentAuction });
            }
        }, 2000); // هر 2 ثانیه بروزرسانی
    },
    
    // ===== ثبت پیشنهاد زنده =====
    placeLiveBid: function(auctionId, businessId, businessName, price) {
        if (!this.isConnected || this.currentAuction?.id !== auctionId) {
            InAppAlert.error('لطفاً ابتدا به حراج متصل شوید');
            return;
        }
        
        const result = BidHandler.placeBid(this.currentAuction, businessId, businessName, price);
        
        if (result.success) {
            App.emit('live-bidding:bid-placed', {
                auctionId,
                businessId,
                businessName,
                price,
                timestamp: new Date().toISOString()
            });
        }
        
        InAppAlert[result.success ? 'success' : 'error'](result.message);
    },
    
    // ===== نمایش پنل پیشنهاددهی زنده =====
    showLivePanel: function(auctionId) {
        const auction = ReverseAuction.getAuction(auctionId);
        if (!auction) {
            InAppAlert.error('حراج یافت نشد');
            return;
        }
        
        const user = StateManager.get('user');
        const isBusiness = user?.role === 'business';
        
        const modal = ModalFactory.createModal({
            title: `🔥 پیشنهاددهی زنده - ${auction.title}`,
            content: `
                <div class="live-bidding-panel">
                    <div class="auction-info">
                        <p><strong>بودجه اعلامی:</strong> ${auction.budget.toLocaleString('fa-IR')} تومان</p>
                        <p><strong>بهترین پیشنهاد:</strong> <span id="bestBid">${auction.bids[0]?.price?.toLocaleString('fa-IR') || 'هنوز پیشنهادی ثبت نشده'}</span></p>
                        <p><strong>تعداد پیشنهادات:</strong> <span id="bidCount">${auction.bids.length}</span></p>
                    </div>
                    
                    <div id="liveBidsList" class="live-bids-list">
                        ${this.renderLiveBids(auction.bids)}
                    </div>
                    
                    ${isBusiness ? `
                        <div class="bid-input-area">
                            <div class="form-group">
                                <label>قیمت پیشنهادی (تومان)</label>
                                <input type="number" id="liveBidPrice" class="form-control" placeholder="مقدار را وارد کنید">
                            </div>
                            <button class="btn btn-primary" id="submitLiveBid">ثبت پیشنهاد</button>
                        </div>
                    ` : '<p class="info-text">💡 برای ثبت پیشنهاد باید وارد حساب کسب‌وکار شوید</p>'}
                    
                    <div class="live-status">
                        <span class="live-dot"></span> اتصال زنده برقرار است
                    </div>
                </div>
            `,
            size: 'lg',
            onOpen: () => {
                this.connectToAuction(auctionId);
                
                // بروزرسانی لحظه‌ای
                const updateInterval = setInterval(() => {
                    const updated = ReverseAuction.getAuction(auctionId);
                    if (updated) {
                        document.getElementById('bestBid').textContent = updated.bids[0]?.price?.toLocaleString('fa-IR') || 'هنوز پیشنهادی ثبت نشده';
                        document.getElementById('bidCount').textContent = updated.bids.length;
                        document.getElementById('liveBidsList').innerHTML = this.renderLiveBids(updated.bids);
                    }
                }, 1000);
                
                const submitBtn = document.getElementById('submitLiveBid');
                if (submitBtn) {
                    submitBtn.addEventListener('click', () => {
                        const price = parseInt(document.getElementById('liveBidPrice').value);
                        if (isNaN(price) || price <= 0) {
                            InAppAlert.error('لطفاً قیمت معتبر وارد کنید');
                            return;
                        }
                        this.placeLiveBid(auctionId, user.id, user.businessName, price);
                        document.getElementById('liveBidPrice').value = '';
                    });
                }
                
                // ذخیره interval برای بستن
                modal.closeHandler = () => {
                    clearInterval(updateInterval);
                    this.disconnect();
                };
            },
            onClose: () => {
                if (modal.closeHandler) modal.closeHandler();
            }
        });
    },
    
    // ===== رندر پیشنهادات زنده =====
    renderLiveBids: function(bids) {
        if (bids.length === 0) {
            return '<div class="empty-state">هنوز پیشنهادی ثبت نشده است</div>';
        }
        
        return `
            <div class="bids-header">
                <span>کسب‌وکار</span>
                <span>قیمت</span>
                <span>زمان</span>
            </div>
            ${bids.slice(0, 10).map(bid => `
                <div class="bid-row ${bid.isNew ? 'new-bid' : ''}">
                    <span>${bid.businessName}</span>
                    <span class="bid-price">${bid.price.toLocaleString('fa-IR')} تومان</span>
                    <span class="bid-time">${new Date(bid.time).toLocaleTimeString('fa-IR')}</span>
                </div>
            `).join('')}
        `;
    }
};

// استایل‌های پیشنهاددهی زنده
const liveBiddingStyles = `
<style>
.live-bidding-panel {
    padding: 1rem;
}
.live-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    font-size: 0.875rem;
    color: var(--text-tertiary);
}
.live-dot {
    width: 10px;
    height: 10px;
    background: var(--color-success);
    border-radius: 50%;
    animation: live-pulse 1s infinite;
}
@keyframes live-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
}
.live-bids-list {
    max-height: 300px;
    overflow-y: auto;
    margin: 1rem 0;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
}
.bids-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 0.75rem 1rem;
    background: var(--bg-tertiary);
    font-weight: bold;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.bid-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border-color);
}
.bid-row:last-child {
    border-bottom: none;
}
.bid-price {
    font-weight: bold;
    color: var(--color-primary);
}
.bid-time {
    font-size: 0.75rem;
    color: var(--text-tertiary);
}
.new-bid {
    animation: bid-flash 0.5s ease;
}
@keyframes bid-flash {
    0% { background: var(--color-success-soft); }
    100% { background: transparent; }
}
.bid-input-area {
    margin: 1rem 0;
    display: flex;
    gap: 1rem;
    align-items: flex-end;
}
.bid-input-area .form-group {
    flex: 1;
    margin-bottom: 0;
}
.info-text {
    text-align: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
}
</style>
`;

if (!document.querySelector('#live-bidding-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'live-bidding-styles';
    styleSheet.textContent = liveBiddingStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    LiveBidding.init();
});

window.LiveBidding = LiveBidding;
