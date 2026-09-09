import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lqrkgdmnkarmjdvkvkds.supabase.co/rest/v1/'
const supabaseKey = 'sb_publishable_V-_IscTqQN7nrRKXWEazEA_JNnkIz2E'

export const supabase = createClient(supabaseUrl, supabaseKey)