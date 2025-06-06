const fs = require('fs');
const path = require('path');

// Create a simple HTML/Canvas based icon generator
const createAppIconHTML = () => {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>App Icon Generator</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #f0f0f0; 
        }
        canvas { 
            border: 1px solid #ccc; 
            margin: 10px; 
            border-radius: 20px;
        }
        .icon-preview {
            display: inline-block;
            margin: 10px;
            text-align: center;
        }
        .size-label {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>Subliminals App Icon Generator</h1>
    <p>This will generate your app icon with the S logo and gradient background.</p>
    
    <button onclick="generateIcons()">Generate App Icons</button>
    <div id="preview"></div>
    
    <script>
        // App gradient colors from the app
        const gradientColors = {
            start: '#0A0A0A',
            end: '#141414'
        };
        
        // Standard app icon sizes
        const iconSizes = [
            { size: 1024, name: 'icon-1024.png', label: '1024x1024 (App Store)' },
            { size: 512, name: 'icon-512.png', label: '512x512 (General)' },
            { size: 180, name: 'icon-180.png', label: '180x180 (iPhone)' },
            { size: 167, name: 'icon-167.png', label: '167x167 (iPad Pro)' },
            { size: 152, name: 'icon-152.png', label: '152x152 (iPad)' },
            { size: 120, name: 'icon-120.png', label: '120x120 (iPhone)' },
            { size: 87, name: 'icon-87.png', label: '87x87 (iPhone)' },
            { size: 80, name: 'icon-80.png', label: '80x80 (iPad)' },
            { size: 76, name: 'icon-76.png', label: '76x76 (iPad)' },
            { size: 60, name: 'icon-60.png', label: '60x60 (iPhone)' },
            { size: 58, name: 'icon-58.png', label: '58x58 (iPhone)' },
            { size: 40, name: 'icon-40.png', label: '40x40 (iPhone/iPad)' },
            { size: 29, name: 'icon-29.png', label: '29x29 (iPhone/iPad)' },
            { size: 20, name: 'icon-20.png', label: '20x20 (iPhone/iPad)' }
        ];
        
        function createGradient(ctx, size) {
            const gradient = ctx.createLinearGradient(0, 0, 0, size);
            gradient.addColorStop(0, gradientColors.start);
            gradient.addColorStop(1, gradientColors.end);
            return gradient;
        }
        
        function generateIcon(size) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Create gradient background
            const gradient = createGradient(ctx, size);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            
            // Draw S logo (we'll simulate it with text for now)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = \`bold \${size * 0.6}px Arial\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', size / 2, size / 2);
            
            return canvas;
        }
        
        function generateIcons() {
            const preview = document.getElementById('preview');
            preview.innerHTML = '<h2>Generated Icons Preview:</h2>';
            
            iconSizes.forEach(iconConfig => {
                const canvas = generateIcon(iconConfig.size);
                
                // Create preview container
                const previewDiv = document.createElement('div');
                previewDiv.className = 'icon-preview';
                
                // Scale down large icons for preview
                const previewSize = Math.min(iconConfig.size, 100);
                canvas.style.width = previewSize + 'px';
                canvas.style.height = previewSize + 'px';
                
                const label = document.createElement('div');
                label.className = 'size-label';
                label.textContent = iconConfig.label;
                
                previewDiv.appendChild(canvas);
                previewDiv.appendChild(label);
                preview.appendChild(previewDiv);
                
                // Create download link
                const link = document.createElement('a');
                link.download = iconConfig.name;
                link.href = canvas.toDataURL('image/png');
                link.textContent = 'Download ' + iconConfig.name;
                link.style.display = 'block';
                link.style.marginTop = '5px';
                link.style.fontSize = '10px';
                previewDiv.appendChild(link);
            });
            
            // Generate main icon.png (1024x1024)
            const mainIcon = generateIcon(1024);
            const mainLink = document.createElement('a');
            mainLink.download = 'icon.png';
            mainLink.href = mainIcon.toDataURL('image/png');
            mainLink.innerHTML = '<h3>📱 Download Main App Icon (icon.png)</h3>';
            mainLink.style.display = 'block';
            mainLink.style.textDecoration = 'none';
            mainLink.style.background = '#007AFF';
            mainLink.style.color = 'white';
            mainLink.style.padding = '15px';
            mainLink.style.borderRadius = '10px';
            mainLink.style.marginTop = '20px';
            mainLink.style.textAlign = 'center';
            preview.appendChild(mainLink);
        }
    </script>
</body>
</html>
  `;
};

// Create the scripts directory if it doesn't exist
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Write the HTML file
const htmlContent = createAppIconHTML();
fs.writeFileSync(path.join(scriptsDir, 'app-icon-generator.html'), htmlContent);

console.log('✅ App icon generator created!');
console.log('📁 Open scripts/app-icon-generator.html in your browser to generate the app icon');
console.log('🎨 The icon will use:');
console.log('   - Background: Linear gradient from #0A0A0A to #141414');
console.log('   - Logo: White "S" (you can replace with actual logo)');
console.log('   - Sizes: All required iOS/Android app icon sizes');
 