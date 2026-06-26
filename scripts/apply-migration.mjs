import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const sql = readFileSync(join(__dirname, '..', 'supabase', 'migration_username.sql'), 'utf-8')

const { error } = await supabase.rpc('exec_sql', { sql })

if (error) {
  console.error('Migration error:', error.message)
  process.exit(1)
}

console.log('Migration applied successfully')
