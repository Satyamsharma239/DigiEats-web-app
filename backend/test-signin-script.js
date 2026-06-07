import axios from 'axios';

async function testSignIn() {
    try {
        const res = await axios.post('http://127.0.0.1:8000/api/auth/signin', {
            email: 'test@test.com',
            password: 'testpassword123'
        });
        console.log('Success:', res.data);
    } catch (e) {
        console.error('Error string:', e.toString());
        if (e.response) {
            console.error('Response status:', e.response.status);
            console.error('Response data:', e.response.data);
        }
    }
}
testSignIn();
