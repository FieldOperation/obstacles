const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uarbweqbrdcqtvmyzmvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcmJ3ZXFicmRjcXR2bXl6bXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDQ5NzYsImV4cCI6MjA4NTk4MDk3Nn0.QAT0FrbSFSmzO_tl0gRcFs-4_NZbUHW0xEpUVh9DuoI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  const email = 'antigravity@obstacles.local';
  const password = 'Password123!';

  console.log('Attempting to sign in/up user...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  let userId;
  if (signInError) {
    console.log('Sign in failed, attempting sign up...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      return;
    }
    userId = authData.user.id;
    console.log('User signed up successfully. ID:', userId);
  } else {
    userId = signInData.user.id;
    console.log('Signed in successfully. ID:', userId);
  }

  await insertUserRecord(userId, email);
}

async function insertUserRecord(userId, email) {
  console.log('Attempting to insert into users table...');
  const { error: dbError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: email,
      name: 'Antigravity Test',
      role: 'ADMIN',
      updated_at: new Date().toISOString()
    });

  if (dbError) {
    console.error('DB Error Detailed:', JSON.stringify(dbError, null, 2));
  } else {
    console.log('User record created/updated in users table.');
  }
}

createTestUser();
