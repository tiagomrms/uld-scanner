import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'COLA_AQUI_O_TEU_PROJECT_URL'
const supabaseKey = 'COLA_AQUI_A_TUA_CHAVE_ANON'

export const supabase = createClient(supabaseUrl, supabaseKey)