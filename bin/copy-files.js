const copy = require('copy')

copy('dist/*.js', 'example', () => console.log('copied pill.js build into example'))
