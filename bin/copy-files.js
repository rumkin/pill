const copy = require('copy')

copy('dist/pill.js', 'example', () => console.log('copied pill.js build into example'))
