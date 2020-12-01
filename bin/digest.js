#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const {createHash} = require('crypto')

const fsp = fs.promises

function calcHash(alg, filepath) {
  const hash = createHash(alg)

  const stream = fs.createReadStream(filepath)

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => {
      resolve(hash.digest())
    })
  })
}

async function calcHashes(alg, dir, files) {
  dir = path.resolve(dir)
  const result = await Promise.all(files.map(async (relPath) => {
    const filepath = path.resolve(relPath)
    const digest = await calcHash(alg, filepath)

    const content = {
      manifest: 'digest-json/v1',
      alg,
      digest: `${alg}-${digest.toString('base64')}`,
    }

    await fsp.writeFile(`${relPath}.digest.json`, JSON.stringify(content, null, 2))

    return [relPath, content]
  }))

  for (const [file, {digest}] of result) {
    console.log('%s %s', file, digest)
  }
}

calcHashes(process.argv[2], process.cwd(), process.argv.slice(3))
.catch((error) => {
  console.error(error)

  return 1
})
.then((code = 0) => process.exit(code))
