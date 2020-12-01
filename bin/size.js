#!/usr/bin/env node

const zlib = require('zlib')
const fs = require('fs')
const bytes = require('pretty-bytes')

const file = process.argv[2]
let size = 0
fs.createReadStream(file)
.pipe(zlib.createGzip())
.on('data', (chunk) => {
  size += chunk.length
})
.on('end', () => {
  console.log('%s: %s', file, bytes(size))
})
