#!/usr/bin/env node

const {execSync: exec} = require('child_process')
const {ESLint} = require('eslint')

async function main() {
  // Load stashed git files
  const files = exec('git diff --cached --name-status')
  .toString('utf8')
  .split('\n')
  .filter(s => /^(M|A)/.test(s))
  .filter(s => /\.js$/.test(s))
  .map(s => s.slice(2))

  if (! files.length) {
    return 0
  }

  // Create linter instance
  const eslint = new ESLint()
  // Create formatter instance
  const formatter = await eslint.loadFormatter('stylish')

  // Lint files
  let hasErrors = false
  for (const file of files) {
    const code = exec(`git show :${file}`).toString('utf8')
    const result = await eslint.lintText(code, {
      filePath: file,
    })

    for (const record of result) {
      if (record.errorCount > 0) {
        hasErrors = true
        break
      }
    }

    const report = formatter.format(result)
    if (report.length) {
      console.log(report)
    }
  }

  if (hasErrors === true) {
    return 1
  }
  else {
    return 0
  }
}

main()
.catch(error => {
  console.error(error)

  return 1
})
.then((code = 0) => process.exit(code))
