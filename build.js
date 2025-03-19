const { minify } = require('terser');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const path = require('path');

async function build() {
    // Create dist directory
    await fs.emptyDir('./dist');

    // Copy all files to dist
    await fs.copy('./src', './dist');
    await fs.copy('./icons', './dist/icons').catch(err => {
        console.warn('Warning: icons folder not found');
    });

    // Read and modify manifest - bulk replace all src/ occurrences
    const manifest = await fs.readJson('./manifest.json');
    const manifestStr = JSON.stringify(manifest, null, 2).replace(/src\//g, '');
    await fs.writeFile('./dist/manifest.json', manifestStr);

    // Minify all JS files
    const jsFiles = await fs.readdir('./dist');
    for (const file of jsFiles) {
        if (file.endsWith('.js')) {
            const filePath = path.join('./dist', file);
            const code = await fs.readFile(filePath, 'utf-8');
            const minified = await minify(code, {
                compress: true,
                mangle: true
            });
            await fs.writeFile(filePath, minified.code);
        }
    }

    // Create ZIP file
    const zip = new AdmZip();
    zip.addLocalFolder('./dist');
    zip.writeZip('./auto-tab-close.zip');

    console.log('Build complete! Check auto-tab-close.zip');
}

build().catch(console.error);
