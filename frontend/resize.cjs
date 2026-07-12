const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function processImages() {
  try {
    const srcPath = 'C:\\Users\\deiby\\.gemini\\antigravity\\brain\\865ca9b3-8482-49a0-a150-b076087917f0\\media__1783863801122.jpg';
    const image = await Jimp.read(srcPath);

    if (!fs.existsSync('./assets')) {
      fs.mkdirSync('./assets');
    }

    // Guardar original en public/logo.jpg (para usarlo en la web como banner si queremos)
    await image.clone().write('public/logo.jpg');

    // 1. Icono para Android/PWA (1024x1024)
    // Hacemos cover para llenar el cuadrado.
    const icon = await image.clone().cover({ w: 1024, h: 1024 });
    await icon.write('assets/icon.png');
    
    // Icono para la web (192x192)
    const iconWeb = await image.clone().cover({ w: 192, h: 192 });
    await iconWeb.write('public/icon-192.png');
    
    // Icono para la web (512x512)
    const iconWeb512 = await image.clone().cover({ w: 512, h: 512 });
    await iconWeb512.write('public/icon-512.png');

    // 2. Splash screen para Android (2732x2732)
    const splash = await image.clone().contain({ w: 2732, h: 2732, background: '#111827' }); // bg-gray-900 approx
    await splash.write('assets/splash.png');

    console.log('¡Imágenes generadas correctamente!');
  } catch (error) {
    console.error('Error generando imágenes:', error);
  }
}

processImages();
