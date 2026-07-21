 /* ============================================
   PRICE-COMPARATOR.JS - مقایسه قیمت پیشنهادات
   ============================================ */

const PriceComparator = {
    // ===== مقایسه قیمت‌ها =====
    comparePrices: function(auction) {
        if (auction.bids.length === 0) {
            return { hasComparison: false, message: 'هیچ پیشنهادی موجود نیست' };
        }
        
        const sorted = [...auction.bids].sort((a, b) => a.price - b.price);
        const lowest = sorted[0];
        const highest = sorted[sorted.length - 1];
        const average = sorted.reduce((sum, b) => sum + b.price, 0) / sorted.length;
        const savings = auction.budget - lowest.price;
        const savingsPercent = (savings / auction.budget) * 100;
        
        return {
            hasComparison: true,
            lowest: lowest,
            highest: highest,
            average: average,
            savings: savings,
            savingsPercent: savingsPercent,
            totalBids: auction.bids.length,
            priceRange: {
                min: lowest.price,
                max: highest.price,
                spread: highest.price - lowest.price
            }
        };
    },
    
    // ===== دریافت پیشنهادات مرتب شده =====
    getSortedBids: function(auction, order = 'asc') {
        const sorted = [...auction.bids];
        if (order === 'asc') {
            return sorted.sort((a, b) => a.price - b.price);
        } else {
            return sorted.sort((a, b) => b.price - a.price);
        }
    },
    
    // ===== دریافت بهترین پیشنهاد در محدوده =====
    getBestBidInRange: function(auction, minPrice, maxPrice) {
        return auction.bids
            .filter(b => b.price >= minPrice && b.price <= maxPrice)
            .sort((a, b) => a.price - b.price)[0] || null;
    },
    
    // ===== محاسبه میانگین وزنی =====
    getWeightedAverage: function(auction) {
        if (auction.bids.length === 0) return 0;
        
        // وزن‌دهی به پیشنهادات (پیشنهادات جدیدتر وزن بیشتری دارند)
        const now = new Date();
        let totalWeight = 0;
        let weightedSum = 0;
        
        auction.bids.forEach(bid => {
            const bidTime = new Date(bid.time);
            const ageHours = (now - bidTime) / (1000 * 60 * 60);
            const weight = Math.exp(-ageHours / 24); // وزن بر اساس زمان (کاهش نمایی)
            
            weightedSum += bid.price * weight;
            totalWeight += weight;
        });
        
        return weightedSum / totalWeight;
    },
    
    // ===== نمایش جدول مقایسه =====
    showComparisonTable: function(auction) {
        const comparison = this.comparePrices(auction);
        const sortedBids = this.getSortedBids(auction);
        
        const modal = ModalFactory.createModal({
            title: '📊 مقایسه پیشنهادات',
            content: `
                <div class="comparison-container">
                    <div class="stats-summary">
                        <div class="stat">
                            <span>کل پیشنهادات:</span>
                            <strong>${comparison.totalBids}</strong>
                        </div>
                        <div class="stat">
                            <span>ارزان‌ترین:</span>
                            <strong>${comparison.lowest?.price.toLocaleString('fa-IR') || '-'} تومان</strong>
                        </div>
                        <div class="stat">
                            <span>گران‌ترین:</span>
                            <strong>${comparison.highest?.price.toLocaleString('fa-IR') || '-'} تومان</strong>
                        </div>
                        <div class="stat">
                            <span>میانگین:</span>
                            <strong>${Math.round(comparison.average).toLocaleString('fa-IR')} تومان</strong>
                        </div>
                        <div class="stat">
                            <span>صرفه‌جویی:</span>
                            <strong class="text-success">${comparison.savings.toLocaleString('fa-IR')} تومان (${comparison.savingsPercent.toFixed(1)}%)</strong>
                        </div>
                    </div>
                    
                    <div class="bids-table">
                        <div class="table-header">
                            <span>رتبه</span>
                            <span>کسب‌وکار</span>
                            <span>قیمت</span>
                            <span>زمان</span>
                        </div>
                        ${sortedBids.map((bid, index) => `
                            <div class="table-row ${index === 0 ? 'winner' : ''}">
                                <span>${index + 1}</span>
                                <span>${bid.businessName}</span>
                                <span class="price">${bid.price.toLocaleString('fa-IR')} تومان</span>
                                <span class="time">${new Date(bid.time).toLocaleString('fa-IR')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            size: 'lg'
        });
    }
};

window.PriceComparator = PriceComparator;
