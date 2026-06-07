import axios from 'axios';

const test = async () => {
    try {
        const res = await axios.post("http://localhost:8080/api/admin/login", { email: "satyu235@gmail.com", password: "adminpassword123" });
        const token = res.data.token;
        console.log("Logged in");
        const res2 = await axios.get("http://localhost:8080/api/admin/orders", { headers: { Authorization: "Bearer " + token } });
        console.log("Success:", res2.data.orders.length);
    } catch (e) {
        console.error("Error", e.response?.data || e.message);
    }
}
test();
