const fs = require('fs')
const path = require('path')
const {createHash} = require('crypto')

function calcHash(filepath) {
  const hash = createHash('sha384')
  const stream = fs.createReadStream(filepath)

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => {
      resolve(hash.digest())
    })
  })
}

async function calcHashes(dir, files) {
  dir = path.resolve(dir)
  const result = await Promise.all(files.map(async (relPath) => {
    const absPath = path.resolve(relPath)
    const digest = await calcHash(absPath)

    return {
      filepath: path.relative(dir, absPath),
      digest,
    }
  }))

  for (const {filepath, digest} of result) {
    console.log('%s %s', digest.toString('base64'), filepath)
  }
}

calcHashes(process.argv[2], process.argv.slice(3))
.catch((error) => {
  console.error(error)

  return 1
})
.then((code = 0) => process.exit(code))
