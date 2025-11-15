/**
 * Script to add ProtectedRoute to all pages except auth pages
 * Run: node scripts/add-protected-route.js
 */

const fs = require('fs')
const path = require('path')

const protectedPages = [
  'app/page.tsx',
  'app/profile/page.tsx',
  'app/messages/page.tsx',
  'app/friends/page.tsx',
  'app/favorites/page.tsx',
  'app/saved/page.tsx',
  'app/trending/page.tsx',
  'app/notifications/page.tsx',
  'app/settings/page.tsx',
]

const excludePages = [
  'app/login/page.tsx',
  'app/signup/page.tsx',
  'app/forgot-password/page.tsx',
  'app/reset-password/page.tsx',
]

function addProtectedRoute(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')

  // Check if already has ProtectedRoute
  if (content.includes('ProtectedRoute')) {
    console.log(`✓ Already protected: ${filePath}`)
    return
  }

  // Add import
  if (!content.includes("from '@/components/auth/ProtectedRoute'")) {
    const importMatch = content.match(/(import.*from '@/components/layout/GlobalLayout')/)
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}\nimport { ProtectedRoute } from '@/components/auth/ProtectedRoute'`
      )
    }
  }

  // Wrap GlobalLayout with ProtectedRoute
  content = content.replace(
    /return \(\s*<GlobalLayout>/g,
    'return (\n    <ProtectedRoute>\n      <GlobalLayout>'
  )

  content = content.replace(
    /<\/GlobalLayout>\s*\)\s*}$/m,
    '      </GlobalLayout>\n    </ProtectedRoute>\n  )\n}'
  )

  fs.writeFileSync(fullPath, content, 'utf8')
  console.log(`✓ Added ProtectedRoute to: ${filePath}`)
}

console.log('Adding ProtectedRoute to pages...\n')

protectedPages.forEach((page) => {
  addProtectedRoute(page)
})

console.log('\n✓ Done!')

