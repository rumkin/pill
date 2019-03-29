const fs = require('fs');
const path = require('path');
const ssri = require('ssri');

async function generateDigests([dir, ...files]) {
  dir = path.resolve(dir) + '/';

  const signatures = await Promise.all(files.map(
    (file) => getDigest(path.resolve(file)))
  )

  for (const {file, digest} of signatures) {
    console.log('%s %s', digest, file.slice(dir.length))
  }
}

async function getDigest(file) {
  const result = await ssri.fromStream(
    fs.createReadStream(file),
    {algorithms: ['sha384']}
  )

  return {file, digest: result.sha384[0].digest}
}

generateDigests(process.argv.slice(2))
.catch((error) => {
  console.error(error)
  return 1
})
.then((code = 0) => process.exit(code))
