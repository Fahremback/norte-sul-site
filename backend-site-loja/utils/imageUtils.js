
// backend-site-loja/utils/imageUtils.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function saveImageFromBase64(imageBase64) {
    if (!imageBase64) return null;
    
    try {
        const buffer = Buffer.from(imageBase64, 'base64');
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(buffer)
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);
        
        const imageUrl = `/uploads/${filename}`;

        return imageUrl;
    } catch (error) {
        console.error("Failed to save image from base64:", error);
        return null;
    }
}

module.exports = { saveImageFromBase64 };
