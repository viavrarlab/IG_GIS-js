const fs = require('fs');
const path = require('path');

const { Resolver } = require('@parcel/plugin');

module.exports = new Resolver({
    async resolve({ specifier }) {
        if (!specifier.startsWith('http') || !specifier.endsWith('.css')) return null;
        const response = await fetch(specifier);
        const css = await response.text();
        const filePath = path.join(...__filename.split(path.sep).slice(0, -2), '.parcel-cache', specifier.split('/').at(-1));
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, css);
        return { filePath: filePath, css };
    }
});
