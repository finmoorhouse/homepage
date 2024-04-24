import { createClient } from '@supabase/supabase-js'

import { WORDS_ENDPOINT } from '$env/static/private'
import { WORDS_KEY } from '$env/static/private'

export const supabase = createClient(WORDS_ENDPOINT, WORDS_KEY)