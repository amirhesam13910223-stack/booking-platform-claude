 /* ============================================
   COMPETITOR-ANALYSIS.JS - تحلیل رقبا
   ============================================ */

const CompetitorAnalysis = {
    // داده‌های رقبا
    competitors: [
        {
            id: 'comp1',
            name: 'پلتفرم آچاره',
            website: 'achareh.ir',
            specialty: ['خدمات منزل', 'تعمیرات'],
            pricing: 'متوسط',
            marketShare: 25,
            rating: 4.2,
            features: ['رزرو فوری', 'پرداخت آنلاین', 'گارانتی']
        },
        {
            id: 'comp2',
            name: 'پلتفرم کارینو',
            website: 'karino.ir',
            specialty: ['آرایشگاه', 'سالن زیبایی'],
            pricing: 'ارزان',
            marketShare: 18,
            rating: 4.0,
            features: ['تخفیف ویژه', 'نوبت دهی سریع']
        },
        {
            id: 'comp3',
            name: 'پلتفرم تریبون',
            website: 'tribun.ir',
            specialty: ['پزشکی', 'مشاوره'],
            pricing: 'گران',
            marketShare: 15,
            rating: 4.5,
            features: ['مشاوره تخصصی', 'نوبت اورژانسی']
        },
        {
            id: 'comp4',
            name: 'پلتفرم اسنپ‌سرویس',
            website: 'snappservice.ir',
            specialty: ['خدمات منزل', 'آرایشگاه', 'پزشکی'],
            pricing: 'متوسط',
            marketShare: 30,
            rating: 4.3,
            features: ['اپلیکیشن موبایل', 'پشتیبانی ۲۴/۷', 'تخفیف اول']
        }
    ],
    
    // ===== مقداردهی اولیه =====
    init: function() {
        this.loadCompetitors();
        this.attachEvents();
        console.log('📊 ماژول تحلیل رقبا راه‌اندازی شد');
    },
    
    // ===== بارگذاری رقبا =====
    loadCompetitors: function() {
        const saved = localStorage.getItem('competitors_data');
        if (saved) {
            try {
                this.competitors = JSON.parse(saved);
            } catch(e) {}
        }
    },
    
    // ===== ذخیره رقبا =====
    saveCompetitors: function() {
        localStorage.setItem('competitors_data', JSON.stringify(this.competitors));
    },
    
    // ===== اتصال رویدادها =====
    attachEvents: function() {
        App.on('competitor:analyze', () => {
            return this.analyzeCompetitors();
        });
    },
    
    // ===== تحلیل رقبا =====
    analyzeCompetitors: function() {
        const ourMetrics = this.getOurMetrics();
        const competitorMetrics = this.competitors.map(c => ({
            name: c.name,
            marketShare: c.marketShare,
            rating: c.rating,
            pricing: c.pricing,
            strengths: this.getCompetitorStrengths(c),
            weaknesses: this.getCompetitorWeaknesses(c)
        }));
        
        // مرتب‌سازی بر اساس سهم بازار
        competitorMetrics.sort((a, b) => b.marketShare - a.marketShare);
        
        // تحلیل SWOT
        const swot = {
            strengths: [
                'سیستم تخفیف هوشمند',
                'بازار معکوس',
                'پشتیبانی ۲۴/۷',
                'برنامه وفاداری مشتریان'
            ],
            weaknesses: [
                'عدم وجود اپلیکیشن موبایل',
                'برندینگ ضعیف‌تر نسبت به رقبای بزرگ'
            ],
            opportunities: [
                'توسعه اپلیکیشن موبایل',
                'همکاری با کسب‌وکارهای جدید',
                'بازاریابی در شبکه‌های اجتماعی'
            ],
            threats: [
                'رقابت شدید در حوزه قیمت',
                'ورود رقبای جدید با سرمایه بالا'
            ]
        };
        
        return {
            ourMetrics: ourMetrics,
            competitors: competitorMetrics,
            marketPosition: this.getMarketPosition(ourMetrics.marketShare),
            swot: swot,
            recommendations: this.getRecommendations(ourMetrics, competitorMetrics)
        };
    },
    
    // ===== دریافت متریک‌های خودمان =====
    getOurMetrics: function() {
        const businesses = JSON.parse(localStorage.getItem('businesses_list') || '[]');
        const verified = businesses.filter(b => b.status === 'verified').length;
        const bookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        
        // محاسبه سهم بازار تخمینی
        const totalMarket = this.competitors.reduce((sum, c) => sum + c.marketShare, 0);
        const ourEstimate = Math.max(5, Math.min(20, verified / 10));
        
        // میانگین امتیاز
        const reviews = JSON.parse(localStorage.getItem('business_reviews') || '[]');
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 4.0;
        
        return {
            name: 'پلتفرم ما',
            marketShare: ourEstimate,
            rating: avgRating,
            pricing: 'متوسط',
            totalBookings: bookings.length,
            activeBusinesses: verified
        };
    },
    
    // ===== دریافت نقاط قوت رقیب =====
    getCompetitorStrengths: function(competitor) {
        const strengths = [];
        
        if (competitor.marketShare > 20) strengths.push('سهم بازار بالا');
        if (competitor.rating > 4.3) strengths.push('رضایت مشتری بالا');
        if (competitor.pricing === 'ارزان') strengths.push('قیمت رقابتی');
        if (competitor.features.includes('اپلیکیشن موبایل')) strengths.push('اپلیکیشن موبایل');
        if (competitor.features.includes('پشتیبانی ۲۴/۷')) strengths.push('پشتیبانی شبانه‌روزی');
        
        return strengths;
    },
    
    // ===== دریافت نقاط ضعف رقیب =====
    getCompetitorWeaknesses: function(competitor) {
        const weaknesses = [];
        
        if (competitor.marketShare < 15) weaknesses.push('سهم بازار پایین');
        if (competitor.rating < 4.0) weaknesses.push('امتیاز پایین کاربران');
        if (competitor.pricing === 'گران') weaknesses.push('قیمت بالا');
        if (!competitor.features.includes('تخفیف')) weaknesses.push('عدم ارائه تخفیف');
        
        return weaknesses;
    },
    
    // ===== دریافت موقعیت بازار =====
    getMarketPosition: function(marketShare) {
        if (marketShare >= 25) return 'رهبر بازار';
        if (marketShare >= 15) return 'رقابت کننده قوی';
        if (marketShare >= 8) return 'رقابت کننده متوسط';
        return 'رقابت کننده ضعیف';
    },
    
    // ===== دریافت توصیه‌ها =====
    getRecommendations: function(ourMetrics, competitors) {
        const recommendations = [];
        
        // تحلیل قیمت
        const avgCompetitorRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
        if (ourMetrics.rating < avgCompetitorRating) {
            recommendations.push('برای بهبود امتیاز کاربران، کیفیت خدمات را افزایش دهید');
        }
        
        // تحلیل سهم بازار
        const topCompetitor = competitors[0];
        if (topCompetitor && ourMetrics.marketShare < topCompetitor.marketShare) {
            recommendations.push(`افزایش بودجه بازاریابی برای رقابت با ${topCompetitor.name}`);
        }
        
        // پیشنهادات ویژه
        recommendations.push('توسعه اپلیکیشن موبایل برای رقابت بهتر');
        recommendations.push('برنامه تخفیف ویژه برای مشتریان جدید');
        recommendations.push('همکاری با اینفلوئنسرهای معتبر برای افزایش برندینگ');
        
        return recommendations;
    },
    
    // ===== نمایش داشبورد تحلیل رقبا =====
    showCompetitorDashboard: function() {
        const analysis = this.analyzeCompetitors();
        
        const modal = document.createElement('div');
        modal.id = 'competitorDashboard';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h3>📊 تحلیل رقبا</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="market-position">
                        <div class="position-card">
                            <div class="position-value">${analysis.marketPosition}</div>
                            <div class="position-label">موقعیت بازار</div>
                        </div>
                        <div class="position-card">
                            <div class="position-value">${analysis.ourMetrics.marketShare}%</div>
                            <div class="position-label">سهم بازار ما</div>
                        </div>
                    </div>
                    
                    <div class="competitor-stats">
                        <div class="stat-card">
                            <div class="stat-value">${analysis.ourMetrics.rating.toFixed(1)}</div>
                            <div class="stat-label">امتیاز ما</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${analysis.competitors[0]?.rating.toFixed(1) || '-'}</div>
                            <div class="stat-label">امتیاز رقیب برتر</div>
                        </div>
                    </div>
                    
                    <div class="market-share-chart">
                        <h4>سهم بازار رقبا</h4>
                        <canvas id="marketShareChart" width="500" height="250"></canvas>
                    </div>
                    
                    <div class="competitors-list">
                        <h4>لیست رقبا</h4>
                        <div class="competitor-table">
                            <div class="table-header">
                                <span>نام</span>
                                <span>سهم بازار</span>
                                <span>امتیاز</span>
                                <span>قیمت</span>
                            </div>
                            ${analysis.competitors.map(c => `
                                <div class="table-row">
                                    <span>${c.name}</span>
                                    <span>${c.marketShare}%</span>
                                    <span>${c.rating.toFixed(1)}</span>
                                    <span>${c.pricing}</span>
                                </div>
                            `).join('')}
                            <div class="table-row our-row">
                                <span><strong>${analysis.ourMetrics.name}</strong></span>
                                <span><strong>${analysis.ourMetrics.marketShare}%</strong></span>
                                <span><strong>${analysis.ourMetrics.rating.toFixed(1)}</strong></span>
                                <span><strong>${analysis.ourMetrics.pricing}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="swot-analysis">
                        <h4>تحلیل SWOT</h4>
                        <div class="swot-grid">
                            <div class="swot-card strengths">
                                <h5>✅ نقاط قوت</h5>
                                <ul>${analysis.swot.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                            </div>
                            <div class="swot-card weaknesses">
                                <h5>❌ نقاط ضعف</h5>
                                <ul>${analysis.swot.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul>
                            </div>
                            <div class="swot-card opportunities">
                                <h5>📈 فرصت‌ها</h5>
                                <ul>${analysis.swot.opportunities.map(s => `<li>${s}</li>`).join('')}</ul>
                            </div>
                            <div class="swot-card threats">
                                <h5>⚠️ تهدیدها</h5>
                                <ul>${analysis.swot.threats.map(s => `<li>${s}</li>`).join('')}</ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recommendations-box">
                        <h4>💡 توصیه‌های استراتژیک</h4>
                        <ul>
                            ${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="this.closest('.modal').remove()">بستن</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (window.ChartRenderer) {
                const allCompetitors = [...analysis.competitors, analysis.ourMetrics];
                window.ChartRenderer.renderPieChart('marketShareChart', {
                    labels: allCompetitors.map(c => c.name),
                    values: allCompetitors.map(c => c.marketShare),
                    title: 'سهم بازار'
                });
            }
        }, 100);
    }
};

// استایل‌های تحلیل رقبا
const competitorStyles = `
<style>
.market-position {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.position-card {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
}

.position-value {
    font-size: 24px;
    font-weight: bold;
}

.competitor-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.our-row {
    background: var(--color-primary-soft);
    font-weight: bold;
}

.swot-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin: 15px 0;
}

.swot-card {
    padding: 15px;
    border-radius: var(--radius-md);
}

.swot-card.strengths {
    background: var(--color-success-soft);
    border-right: 4px solid var(--color-success);
}

.swot-card.weaknesses {
    background: var(--color-danger-soft);
    border-right: 4px solid var(--color-danger);
}

.swot-card.opportunities {
    background: var(--color-primary-soft);
    border-right: 4px solid var(--color-primary);
}

.swot-card.threats {
    background: var(--color-warning-soft);
    border-right: 4px solid var(--color-warning);
}

.swot-card ul {
    margin: 10px 0 0;
    padding-right: 20px;
}

.swot-card li {
    margin-bottom: 5px;
    font-size: 13px;
}

.recommendations-box {
    background: var(--color-info-soft);
    border-radius: var(--radius-md);
    padding: 15px;
    margin: 20px 0;
}

.recommendations-box ul {
    margin: 10px 0 0;
    padding-right: 20px;
}

.recommendations-box li {
    margin-bottom: 5px;
}
</style>
`;

if (!document.querySelector('#competitor-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'competitor-styles';
    styleSheet.textContent = competitorStyles;
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    CompetitorAnalysis.init();
});

window.CompetitorAnalysis = CompetitorAnalysis;
