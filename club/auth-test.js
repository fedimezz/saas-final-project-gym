(async () => {
  try {
    const testEmail = `test-login-${Date.now()}@local.test`;
    const registerRes = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Login',
        email: testEmail,
        phone: '+1234567890',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    });
    console.log('REGISTER status', registerRes.status);
    console.log('REGISTER set-cookie', registerRes.headers.get('set-cookie'));
    console.log('REGISTER headers', JSON.stringify(Object.fromEntries(registerRes.headers.entries()), null, 2));
    console.log('REGISTER body', await registerRes.text());

    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' }),
    });
    console.log('LOGIN status', loginRes.status);
    console.log('LOGIN set-cookie', loginRes.headers.get('set-cookie'));
    console.log('LOGIN headers', JSON.stringify(Object.fromEntries(loginRes.headers.entries()), null, 2));
    console.log('LOGIN body', await loginRes.text());
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
