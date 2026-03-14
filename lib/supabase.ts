import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pjrvjlpjyfvlkobzkhtp.supabase.co'
const SUPABASE_ANON_KEY = 'вставьте_сюда_anon_key_из_supabase'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || ''
)
