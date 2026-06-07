const axios = require('axios');
axios.post('http://localhost:8000/api/auth/signup', {
    fullName: "Test User",
    email: "test12345@test.com",
    password: "password123",
    mobile: "0987654321",
    role: "user"
}).then(res => console.log("Success", res.data))
    .catch(err => console.log("Error:", err.response ? err.response.data : err.message));
