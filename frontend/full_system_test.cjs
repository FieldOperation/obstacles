const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uarbweqbrdcqtvmyzmvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcmJ3ZXFicmRjcXR2bXl6bXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDQ5NzYsImV4cCI6MjA4NTk4MDk3Nn0.QAT0FrbSFSmzO_tl0gRcFs-4_NZbUHW0xEpUVh9DuoI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
    const email = 'antigravity@obstacles.local';
    const password = 'Password123!';

    console.log('--- SYSTEM TEST START ---');

    // 1. Test Authentication
    console.log('\n1. Testing Authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Auth Test Failed:', authError.message);
        return;
    }
    console.log('✅ Auth Test Passed: Signed in as', authData.user.email);
    const userId = authData.user.id;

    // 2. Test Data Access (RLS)
    console.log('\n2. Testing Data Access (RLS)...');
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error('❌ User Data Access Failed:', userError.message);
    } else {
        console.log('✅ User Data Access Passed: Role is', userData.role);
    }

    // 3. Test Core Functionality: Creating a Case
    console.log('\n3. Testing Case Creation...');

    // First, get a zone and road to link the case
    const { data: zones } = await supabase.from('zones').select('id').limit(1);
    const { data: roads } = await supabase.from('roads').select('id').limit(1);

    if (!zones || zones.length === 0 || !roads || roads.length === 0) {
        console.warn('⚠️ Skipping Case Creation: No zones or roads found in database.');
    } else {
        const { data: newCase, error: caseError } = await supabase
            .from('cases')
            .insert({
                type: 'OBSTACLE',
                status: 'OPEN',
                zone_id: zones[0].id,
                road_id: roads[0].id,
                description: 'Test obstacle created by Antigravity',
                latitude: 24.7136,
                longitude: 46.6753,
                created_by_id: userId
            })
            .select()
            .single();

        if (caseError) {
            console.error('❌ Case Creation Failed:', caseError.message);
        } else {
            console.log('✅ Case Creation Passed: Case ID', newCase.id);

            // 4. Test Case Update (Closing)
            console.log('\n4. Testing Case Update (Closing)...');
            const { data: updatedCase, error: updateError } = await supabase
                .from('cases')
                .update({
                    status: 'CLOSED',
                    closed_by_id: userId,
                    closed_at: new Date().toISOString(),
                    closure_notes: 'Closed by automated test'
                })
                .eq('id', newCase.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Case Update Failed:', updateError.message);
            } else {
                console.log('✅ Case Update Passed: Status is', updatedCase.status);
            }
        }
    }

    // 5. Test Dashboard/Stats
    console.log('\n5. Testing Dashboard Stats...');
    const { count, error: countError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Dashboard Stats Failed:', countError.message);
    } else {
        console.log('✅ Dashboard Stats Passed: Total cases found:', count);
    }

    console.log('\n--- SYSTEM TEST COMPLETE ---');
}

runTests();
