#!/usr/bin/env node

const {execSync: exec} = require('child_process')
const fs = require('fs')
const {format} = require('util')

const {bold} = require('chalk')
const picomatch = require('picomatch')

const regularFiles = [
  'package.json',
  'readme.md',
  'license',
]

const changes = exec('git status --short')
.toString('utf8')
.trimEnd()
.split(/\n/g)
.filter(val => val !== '')
.map((change) => {
  const [type, file] = change.trim().split(/\s+/)

  return {type, file}
})

if (!changes.length) {
  process.exit(0)
}

const pkg = require(process.cwd() + '/package.json')
let hasMatch
if (Array.isArray(pkg.files)) {
  hasMatch = getMatcher(pkg.files)
}
else if (fs.existsSync('.npmignore')) {
  hasMatch = getIgnoreMatcher(
    parseIgnoreFile(fs.readFileSync('.npmignore', 'utf8')),
  )
}
else {
  hasMatch = () => true
}

const errors = []

for (const {file} of changes) {
  if (file.startsWith('src')) {
    errors.push(file)
  }
  else if (hasMatch(file)) {
    errors.push(file)
  }
  else if (regularFiles.includes(file)) {
    errors.push(file)
  }
}

if (errors.length) {
  console.error(fmt('ERROR', 'Publishing uncommitted files'))
  console.info(fmt('INFO', 'Try to stash changes before publishing'))
  for (const error of errors) {
    console.debug(fmt('DEBUG', error))
  }
  process.exit(1)
}

function parseIgnoreFile(ignore) {
  return ignore.split('\n')
  .filter((line) => {
    const trimmed = line.trim()

    return trimmed.length && !trimmed.startsWith('#')
  })
}

function getMatcher(masks, positive = true) {
  const matchers = masks.map(mask => picomatch(mask))

  return (value) => {
    for (const matcher of matchers) {
      if (matcher(value) === positive) {
        return true
      }
    }

    return false
  }
}

function getIgnoreMatcher(masks) {
  return getMatcher(masks, false)
}

function fmt(label, message) {
  return format('%s | %s', colorLabel(label), message)
}

function colorLabel(label) {
  switch (label) {
  case 'DEBUG': {
    return bold.yellow(label)
  }
  case 'ERROR': {
    return bold.red(label)
  }
  case 'INFO': {
    return bold.blue(label) + ' '
  }
  default: {
    return bold(label)
  }
  }
}
