const fs = require('fs');
const libPackage = require('./package.json');

// remove not required fields
delete libPackage.devDependencies;
delete libPackage['size-limit'];
delete libPackage.prettier;
delete libPackage.source;

// use only required temporary script in dist
libPackage.scripts = {
  postversion: 'cd .. && node bump.js',
};

// updates source flags removing 'dist' path
['main', 'types'].forEach((prop) => {
  libPackage[prop] = libPackage[prop].replace('dist/', '');
});

fs.mkdirSync('./dist', { recursive: true });
fs.copyFileSync('README.md', './dist/README.md');
fs.copyFileSync('LICENSE', './dist/LICENSE');
fs.writeFileSync(
  './dist/package.json',
  JSON.stringify(libPackage, undefined, 2)
);
