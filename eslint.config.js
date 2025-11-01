import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  ignores: ['dist', 'node_modules', 'coverage', '.worktrees', 'docs'],
})
