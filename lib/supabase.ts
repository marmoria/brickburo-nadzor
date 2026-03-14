import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pjrvjlpjyfvlkobzkhtp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcnZqbHBqeWZ2bGtvYnpraHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjQ2NzksImV4cCI6MjA4OTAwMDY3OX0.hGPjFpMQ7n_xh-XE9qIINFpSPiOrK-zgYn_qY5TPDnY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || ''
