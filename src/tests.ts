import * as http from 'http';

const BASE_URL = 'http://localhost:4000/users';

async function testGetAllUsers() {
    const response = await fetch(BASE_URL);
    const users = await response.json();
    console.log('Get all users:', users);
}

async function testCreateUser () {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'John', age: 30, hobbies: ['reading', 'gaming'] }),
    });
    const newUser  = await response.json();
    console.log('Created user:', newUser );
}

async function testGetUser ById(userId: string) {
    const response = await fetch(`${BASE_URL}/${userId}`);
    const user = await response.json();
    console.log('Get user by ID:', user);
}

(async () => {
    await testGetAllUsers();
    await testCreateUser ();
})();