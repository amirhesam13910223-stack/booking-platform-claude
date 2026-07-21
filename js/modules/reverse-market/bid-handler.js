 /* ============================================
   BID-HANDLER.JS - مدیریت پیشنهادات حراج
   ============================================ */

const BidHandler = {
    // ===== اعتبارسنجی پیشنهاد =====
    validateBid: function(auction, businessId, price) {
        // بررسی وجود حراج
        if (!auction) {
            return { valid: false, message: 'حراج یافت نشد' };
        }
        
        // بررسی زمان حراج
        if (new Date(auction.endTime) <= new Date()) {
            return { valid: false, message: 'زمان حراج به پایان رسیده است' };
        }
        
        // بررسی بودجه
        if (price > auction.budget) {
            return { valid: false, message: 'قیمت پیشنهادی بیشتر از بودجه اعلامی است' };
        }
        
        // بررسی قیمت منفی
        if (price <= 0) {
            return { valid: false, message: 'قیمت پیشنهادی باید بیشتر از صفر باشد' };
        }
        
        // بررسی بهترین پیشنهاد فعلی
        const lowestBid = auction.bids.length > 0 ? Math.min(...auction.bids.map(b => b.price)) : Infinity;
        if (price >= lowestBid) {
            return { valid: false, message: 'قیمت پیشنهادی باید کمتر از بهترین پیشنهاد فعلی باشد' };
        }
        
        return { valid: true, message: 'پیشنهاد معتبر است' };
    },
    
    // ===== ثبت پیشنهاد =====
    placeBid: function(auction, businessId, businessName, price) {
        const validation = this.validateBid(auction, businessId, price);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }
        
        const newBid = {
            id: 'BID' + Date.now() + Math.random().toString(36).substr(2, 6),
            businessId: businessId,
            businessName: businessName,
            price: price,
            time: new Date().toISOString(),
            status: 'active'
        };
        
        auction.bids.push(newBid);
        auction.bids.sort((a, b) => a.price - b.price);
        
        return { success: true, message: 'پیشنهاد با موفقیت ثبت شد', bid: newBid };
    },
    
    // ===== حذف پیشنهاد =====
    removeBid: function(auction, bidId, businessId) {
        const bidIndex = auction.bids.findIndex(b => b.id === bidId && b.businessId === businessId);
        if (bidIndex === -1) {
            return { success: false, message: 'پیشنهاد یافت نشد' };
        }
        
        auction.bids.splice(bidIndex, 1);
        
        return { success: true, message: 'پیشنهاد با موفقیت حذف شد' };
    },
    
    // ===== به‌روزرسانی پیشنهاد =====
    updateBid: function(auction, bidId, businessId, newPrice) {
        const bid = auction.bids.find(b => b.id === bidId && b.businessId === businessId);
        if (!bid) {
            return { success: false, message: 'پیشنهاد یافت نشد' };
        }
        
        if (newPrice > auction.budget) {
            return { success: false, message: 'قیمت جدید بیشتر از بودجه است' };
        }
        
        bid.price = newPrice;
        bid.updatedAt = new Date().toISOString();
        auction.bids.sort((a, b) => a.price - b.price);
        
        return { success: true, message: 'پیشنهاد با موفقیت به‌روزرسانی شد', bid: bid };
    },
    
    // ===== دریافت بهترین پیشنهاد =====
    getBestBid: function(auction) {
        if (auction.bids.length === 0) return null;
        return auction.bids[0];
    },
    
    // ===== دریافت پیشنهاد کسب‌وکار =====
    getBusinessBid: function(auction, businessId) {
        return auction.bids.find(b => b.businessId === businessId);
    },
    
    // ===== محاسبه موقعیت پیشنهاد =====
    getBidRank: function(auction, bidId) {
        const index = auction.bids.findIndex(b => b.id === bidId);
        if (index === -1) return null;
        return index + 1;
    },
    
    // ===== نمایش مودال پیشنهاد =====
    showBidModal: function(auction, businessId, businessName) {
        const existingBid = this.getBusinessBid(auction, businessId);
        
        const modal = ModalFactory.createModal({
            title: existingBid ? '✏️ ویرایش پیشنهاد' : '💰 ثبت پیشنهاد جدید',
            content: `
                <form id="bidForm">
                    <div class="form-group">
                        <label>قیمت پیشنهادی (تومان)</label>
                        <input type="number" id="bidPrice" class="form-control" value="${existingBid?.price || ''}" placeholder="مقدار را وارد کنید">
                    </div>
                    <div class="form-group">
                        <label>حداکثر بودجه اعلامی: ${auction.budget.toLocaleString('fa-IR')} تومان</label>
                    </div>
                    <div class="form-group">
                        <label>بهترین پیشنهاد فعلی: ${this.getBestBid(auction)?.price?.toLocaleString('fa-IR') || 'هیچ'}</label>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">${existingBid ? 'به‌روزرسانی' : 'ثبت پیشنهاد'}</button>
                        ${existingBid ? `<button type="button" id="deleteBidBtn" class="btn btn-danger">حذف پیشنهاد</button>` : ''}
                    </div>
                </form>
            `,
            onOpen: () => {
                const form = document.getElementById('bidForm');
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const price = parseInt(document.getElementById('bidPrice').value);
                    if (isNaN(price) || price <= 0) {
                        InAppAlert.error('لطفاً قیمت معتبر وارد کنید');
                        return;
                    }
                    
                    let result;
                    if (existingBid) {
                        result = this.updateBid(auction, existingBid.id, businessId, price);
                    } else {
                        result = this.placeBid(auction, businessId, businessName, price);
                    }
                    
                    InAppAlert[result.success ? 'success' : 'error'](result.message);
                    if (result.success) {
                        ModalFactory.closeModal();
                        App.emit('auction:updated', auction);
                    }
                });
                
                const deleteBtn = document.getElementById('deleteBidBtn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        const result = this.removeBid(auction, existingBid.id, businessId);
                        InAppAlert[result.success ? 'success' : 'error'](result.message);
                        if (result.success) {
                            ModalFactory.closeModal();
                            App.emit('auction:updated', auction);
                        }
                    });
                }
            }
        });
    }
};

window.BidHandler = BidHandler;
