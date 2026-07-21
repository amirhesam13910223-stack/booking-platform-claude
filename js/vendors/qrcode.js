 /* ============================================
   QRCODE.JS - کتابخانه تولید QR Code
   ============================================ */

class QRCodeGenerator {
    constructor(options = {}) {
        this.options = {
            width: options.width || 200,
            height: options.height || 200,
            colorDark: options.colorDark || '#000000',
            colorLight: options.colorLight || '#FFFFFF',
            errorCorrection: options.errorCorrection || 'M', // L, M, Q, H
            ...options
        };
    }
    
    // ===== تولید QR Code =====
    generate(text, onComplete) {
        // شبیه‌سازی تولید QR Code با استفاده از API خارجی
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.options.width}x${this.options.height}&data=${encodeURIComponent(text)}&ecc=${this.options.errorCorrection}`;
        
        const img = new Image();
        img.onload = () => {
            if (onComplete) onComplete(img);
        };
        img.src = qrUrl;
        
        return img;
    }
    
    // ===== تولید و نمایش در canvas =====
    renderToCanvas(canvasId, text) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.options.width}x${this.options.height}&data=${encodeURIComponent(text)}`;
        
        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            canvas.width = this.options.width;
            canvas.height = this.options.height;
            ctx.drawImage(img, 0, 0, this.options.width, this.options.height);
        };
        img.src = qrUrl;
    }
    
    // ===== تولید و نمایش در عنصر =====
    renderToElement(elementId, text) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.options.width}x${this.options.height}&data=${encodeURIComponent(text)}`;
        
        element.innerHTML = `<img src="${qrUrl}" width="${this.options.width}" height="${this.options.height}" alt="QR Code">`;
    }
    
    // ===== تولید با لوگو =====
    generateWithLogo(text, logoUrl, onComplete) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.options.width}x${this.options.height}&data=${encodeURIComponent(text)}`;
        
        const canvas = document.createElement('canvas');
        canvas.width = this.options.width;
        canvas.height = this.options.height;
        const ctx = canvas.getContext('2d');
        
        const qrImg = new Image();
        qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0, this.options.width, this.options.height);
            
            const logo = new Image();
            logo.onload = () => {
                const logoSize = this.options.width * 0.25;
                const logoX = (this.options.width - logoSize) / 2;
                const logoY = (this.options.height - logoSize) / 2;
                
                ctx.fillStyle = this.options.colorLight;
                ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
                
                if (onComplete) onComplete(canvas);
            };
            logo.src = logoUrl;
        };
        qrImg.src = qrUrl;
    }
    
    // ===== تولید کد رهگیری =====
    generateBookingQR(bookingId, bookingData) {
        const qrData = JSON.stringify({
            id: bookingId,
            business: bookingData.businessName,
            date: bookingData.date,
            time: bookingData.time,
            service: bookingData.serviceName
        });
        
        return this.generate(qrData);
    }
    
    // ===== تولید کد تخفیف =====
    generateCouponQR(couponCode, discount) {
        const qrData = JSON.stringify({
            code: couponCode,
            discount: discount,
            type: 'coupon'
        });
        
        return this.generate(qrData);
    }
    
    // ===== اسکن QR Code (شبیه‌سازی) =====
    static scanFromImage(imageFile, onComplete) {
        // شبیه‌سازی اسکن
        setTimeout(() => {
            onComplete({
                success: true,
                data: 'scanned_data_' + Date.now()
            });
        }, 1000);
    }
    
    // ===== تولید QR Code به صورت DataURL =====
    toDataURL(text, callback) {
        const img = this.generate(text, (image) => {
            const canvas = document.createElement('canvas');
            canvas.width = this.options.width;
            canvas.height = this.options.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            callback(canvas.toDataURL());
        });
    }
}

// ===== تابع کمکی برای تولید سریع QR Code =====
function generateQRCode(text, options = {}) {
    const qr = new QRCodeGenerator(options);
    return qr.generate(text);
}

// در دسترس قرار دادن
window.QRCodeGenerator = QRCodeGenerator;
window.generateQRCode = generateQRCode;
