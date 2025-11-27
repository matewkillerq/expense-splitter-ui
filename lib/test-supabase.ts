// Test Supabase connection
import { createClient } from '@/lib/supabase/client'

export async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase connection...')

    // Check environment variables
    console.log('Environment variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

    try {
        const supabase = createClient()

        // Test 1: Check if we can connect
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('Auth check:', authError ? '❌ Error' : '✅ OK')
        if (authError) console.error('Auth error:', authError)

        // Test 2: Try to query profiles table
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        console.log('Database query:', error ? '❌ Error' : '✅ OK')
        if (error) {
            console.error('Database error:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
        }

        console.log('✅ Supabase connection test complete')
    } catch (error) {
        console.error('❌ Connection test failed:', error)
    }
}
