import axios from 'axios';

const api = axios.create({
    baseURL: 'http://91.208.197.169:3001',  // Your server IP
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 seconds timeout
});

export const verifyEmail = async (email) => {
    try {
        const response = await api.post('/api/verify', { email });
        console.log('API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error.response?.data || error.message;
    }
};