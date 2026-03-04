/**
 * One-off migration: move content/<cat>/<subcat>/*.md to content/<cat>/<file>.md
 * and set frontmatter.subcategory to the path subfolder name for stable ids.
 * Run from repo root: node scripts/migrate-content-flat.js
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, '..', 'content')

function getAllMdPaths(dir, base = dir, acc = []) {
  const entries = readdirSync(dir)
  for (const name of entries) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      getAllMdPaths(full, base, acc)
    } else if (name.endsWith('.md')) {
      acc.push(relative(base, full).replace(/\\/g, '/'))
    }
  }
  return acc
}

const all = getAllMdPaths(contentDir)
const toMigrate = all.filter((p) => p.split('/').length === 3)

if (toMigrate.length === 0) {
  console.log('No files to migrate (expected content/category/subcategory/file.md).')
  process.exit(0)
}

let moved = 0
for (const rel of toMigrate) {
  const [cat, subcat, file] = rel.split('/')
  const oldPath = join(contentDir, rel)
  const newRel = `${cat}/${file}`
  const newPath = join(contentDir, newRel)
  const raw = readFileSync(oldPath, 'utf-8')
  const { data: fm, content } = matter(raw)
  fm.subcategory = subcat
  if (fm.id) delete fm.id
  const newRaw = matter.stringify(content, fm, { lineWidth: -1 })
  const newDir = dirname(newPath)
  if (!existsSync(newDir)) mkdirSync(newDir, { recursive: true })
  writeFileSync(newPath, newRaw, 'utf-8')
  unlinkSync(oldPath)
  moved++
  console.log(`${rel} -> ${newRel} (subcategory: ${subcat})`)
}

console.log(`Migrated ${moved} files. Remove empty subcategory dirs manually if desired.`)
