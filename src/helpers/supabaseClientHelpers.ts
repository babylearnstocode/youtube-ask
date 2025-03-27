import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wyzlmlzxhzkidvlcosmo.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

export const createSupabaseClient = () => createClient(supabaseUrl, supabaseKey)
