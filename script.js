// Simulateur de Couleur - JavaScript
class ColorSimulator {
    constructor() {
        this.currentColor = { r: 255, g: 107, b: 107 };
        this.isUpdating = false;
        this.initializeElements();
        this.setupEventListeners();
        this.updateColorPicker();
        this.updateDisplay();
    }

    initializeElements() {
        // Éléments d'affichage
        this.colorPreview = document.getElementById('colorPreview');
        this.colorHex = document.getElementById('colorHex');
        this.colorRgb = document.getElementById('colorRgb');
        this.colorHsl = document.getElementById('colorHsl');
        this.contrastScore = document.getElementById('contrastScore');
        this.accessibility = document.getElementById('accessibility');

        // Sélecteur de couleur
        this.colorPicker = document.getElementById('colorPicker');
        this.hueSlider = document.getElementById('hueSlider');

        // Contrôles numériques
        this.redInput = document.getElementById('redInput');
        this.greenInput = document.getElementById('greenInput');
        this.blueInput = document.getElementById('blueInput');
        this.hueInput = document.getElementById('hueInput');
        this.saturationInput = document.getElementById('saturationInput');
        this.lightnessInput = document.getElementById('lightnessInput');
        this.hexInput = document.getElementById('hexInput');

        // Boutons
        this.copyHex = document.getElementById('copyHex');
        this.randomColor = document.getElementById('randomColor');
        this.copyAll = document.getElementById('copyAll');
        this.resetColor = document.getElementById('resetColor');

        // Palettes
        this.palettes = document.querySelectorAll('.palette');
        this.paletteColors = document.querySelectorAll('.palette-color');
    }

    setupEventListeners() {
        // Sélecteur de couleur
        this.colorPicker.addEventListener('click', (e) => this.handleColorPickerClick(e));
        this.hueSlider.addEventListener('input', () => this.handleHueChange());

        // Contrôles RGB
        [this.redInput, this.greenInput, this.blueInput].forEach(input => {
            input.addEventListener('input', () => this.handleRgbChange());
        });

        // Contrôles HSL
        [this.hueInput, this.saturationInput, this.lightnessInput].forEach(input => {
            input.addEventListener('input', () => this.handleHslChange());
        });

        // Contrôle hexadécimal
        this.hexInput.addEventListener('input', () => this.handleHexChange());

        // Boutons
        this.copyHex.addEventListener('click', () => this.copyToClipboard(this.hexInput.value));
        this.randomColor.addEventListener('click', () => this.generateRandomColor());
        this.copyAll.addEventListener('click', () => this.copyAllValues());
        this.resetColor.addEventListener('click', () => this.resetToDefault());

        // Palettes
        this.paletteColors.forEach(color => {
            color.addEventListener('click', (e) => this.selectPaletteColor(e));
        });
    }

    // Conversion de couleurs
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Mise à jour du sélecteur de couleur
    updateColorPicker() {
        const ctx = this.colorPicker.getContext('2d');
        const width = this.colorPicker.width;
        const height = this.colorPicker.height;
        const hue = this.hueSlider.value;

        // Créer le gradient de saturation/luminosité
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const saturation = (x / width) * 100;
                const lightness = 100 - (y / height) * 100;
                const rgb = this.hslToRgb(hue, saturation, lightness);
                
                const index = (y * width + x) * 4;
                data[index] = rgb.r;     // R
                data[index + 1] = rgb.g; // G
                data[index + 2] = rgb.b; // B
                data[index + 3] = 255;   // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Gestionnaires d'événements
    handleColorPickerClick(e) {
        if (this.isUpdating) return;
        
        const rect = this.colorPicker.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const saturation = (x / rect.width) * 100;
        const lightness = 100 - (y / rect.height) * 100;
        const hue = this.hueSlider.value;
        
        this.updateColorFromHsl(hue, saturation, lightness);
    }

    handleHueChange() {
        if (this.isUpdating) return;
        this.updateColorPicker();
        
        const hue = this.hueSlider.value;
        const hsl = this.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        this.updateColorFromHsl(hue, hsl.s, hsl.l);
    }

    handleRgbChange() {
        if (this.isUpdating) return;
        
        const r = parseInt(this.redInput.value) || 0;
        const g = parseInt(this.greenInput.value) || 0;
        const b = parseInt(this.blueInput.value) || 0;
        
        this.updateColorFromRgb(r, g, b);
    }

    handleHslChange() {
        if (this.isUpdating) return;
        
        const h = parseInt(this.hueInput.value) || 0;
        const s = parseInt(this.saturationInput.value) || 0;
        const l = parseInt(this.lightnessInput.value) || 0;
        
        this.updateColorFromHsl(h, s, l);
    }

    handleHexChange() {
        if (this.isUpdating) return;
        
        const hex = this.hexInput.value;
        if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
            const rgb = this.hexToRgb(hex);
            if (rgb) {
                this.updateColorFromRgb(rgb.r, rgb.g, rgb.b);
            }
        }
    }

    // Mise à jour des couleurs
    updateColorFromRgb(r, g, b) {
        this.currentColor = { r, g, b };
        this.updateDisplay();
        this.updateControls();
    }

    updateColorFromHsl(h, s, l) {
        const rgb = this.hslToRgb(h, s, l);
        this.currentColor = rgb;
        this.updateDisplay();
        this.updateControls();
    }

    updateDisplay() {
        const { r, g, b } = this.currentColor;
        const hsl = this.rgbToHsl(r, g, b);
        const hex = this.rgbToHex(r, g, b);
        
        // Mise à jour de l'aperçu
        this.colorPreview.style.background = `rgb(${r}, ${g}, ${b})`;
        
        // Mise à jour des informations
        this.colorHex.textContent = hex;
        this.colorRgb.textContent = `rgb(${r}, ${g}, ${b})`;
        this.colorHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        
        // Mise à jour du contraste
        this.updateContrastInfo();
    }

    updateControls() {
        this.isUpdating = true;
        
        const { r, g, b } = this.currentColor;
        const hsl = this.rgbToHsl(r, g, b);
        const hex = this.rgbToHex(r, g, b);
        
        // Mise à jour des contrôles RGB
        this.redInput.value = r;
        this.greenInput.value = g;
        this.blueInput.value = b;
        
        // Mise à jour des contrôles HSL
        this.hueInput.value = hsl.h;
        this.saturationInput.value = hsl.s;
        this.lightnessInput.value = hsl.l;
        
        // Mise à jour du contrôle hexadécimal
        this.hexInput.value = hex;
        
        // Mise à jour du slider de teinte
        this.hueSlider.value = hsl.h;
        
        this.isUpdating = false;
    }

    // Calcul du contraste
    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    getContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(color1.r, color1.g, color1.b);
        const lum2 = this.getLuminance(color2.r, color2.g, color2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    updateContrastInfo() {
        const white = { r: 255, g: 255, b: 255 };
        const black = { r: 0, g: 0, b: 0 };
        
        const contrastWhite = this.getContrastRatio(this.currentColor, white);
        const contrastBlack = this.getContrastRatio(this.currentColor, black);
        const contrast = Math.max(contrastWhite, contrastBlack);
        
        this.contrastScore.textContent = contrast.toFixed(2) + ":1";
        
        // Mise à jour de l'indicateur d'accessibilité
        if (contrast >= 7) {
            this.accessibility.textContent = "✅ Excellent";
            this.accessibility.className = "accessibility";
        } else if (contrast >= 4.5) {
            this.accessibility.textContent = "✅ Accessible";
            this.accessibility.className = "accessibility";
        } else if (contrast >= 3) {
            this.accessibility.textContent = "⚠️ Limité";
            this.accessibility.className = "accessibility warning";
        } else {
            this.accessibility.textContent = "❌ Non accessible";
            this.accessibility.className = "accessibility error";
        }
    }

    // Fonctions utilitaires
    selectPaletteColor(e) {
        const color = e.target.style.background;
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            this.updateColorFromRgb(r, g, b);
        }
    }

    generateRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        this.updateColorFromRgb(r, g, b);
    }

    resetToDefault() {
        this.updateColorFromRgb(255, 107, 107);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback(this.copyHex, "Copié !");
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    }

    async copyAllValues() {
        const { r, g, b } = this.currentColor;
        const hsl = this.rgbToHsl(r, g, b);
        const hex = this.rgbToHex(r, g, b);
        
        const allValues = `HEX: ${hex}
RGB: rgb(${r}, ${g}, ${b})
HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        
        try {
            await navigator.clipboard.writeText(allValues);
            this.showCopyFeedback(this.copyAll, "Tout copié !");
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    }

    showCopyFeedback(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.style.background = "#10b981";
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = "";
        }, 2000);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new ColorSimulator();
});

// Gestion des erreurs
window.addEventListener('error', (e) => {
    console.error('Erreur dans le simulateur de couleur:', e.error);
});

// Service Worker pour le mode hors ligne (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW enregistré avec succès:', registration);
            })
            .catch(registrationError => {
                console.log('Échec de l\'enregistrement du SW:', registrationError);
            });
    });
}
