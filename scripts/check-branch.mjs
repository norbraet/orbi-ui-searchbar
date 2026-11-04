import { execFileSync } from 'node:child_process'

const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
  encoding: 'utf8',
}).trim()

if (branch === 'main' || branch === 'master') {
  process.stderr.write(
    `Direct commits and pushes to ${branch} are forbidden. Use a feature branch.\n`
  )
  process.exitCode = 1
}
