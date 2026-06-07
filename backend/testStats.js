import axios from 'axios';

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/admin/login', {
            email: 'admin@DigiEats.com',
            password: 'password123'
        });
        console.log('Login OK:', loginRes.data.token.slice(0, 10) + '...');

        const statsRes = await axios.get('http://localhost:8080/api/admin/dashboard-stats', {
            headers: { Authorization: 'Bearer ' + loginRes.data.token }
        });
        console.log('STATS OK:', statsRes.data);
    } catch (err) {
        if (err.response) {
            console.log('API ERROR RESPONSE:', err.response.data);
        } else {
            console.log('API ERROR MESSAGE:', err.message);
        }
    }
}
test();
