/*
 * Test suite for articles
 */
require('es6-promise').polyfill();
require('isomorphic-fetch');

const url = path => `http://localhost:3000${path}`;
var cookie;

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}


describe('Validate Registration and Login functionality', () => {
    const newUser = generateString(5);
    it('register new user', (done) => {
        let regUser = {username: newUser, password: '1234',email:"yc149@rice.edu", dob:128999122000, zipcode:"77030",};
        fetch(url('/register'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(regUser)
        }).then(res => res.json()).then(res => {
            // expect(res.username).toEqual('mrj3');
            expect(res.result).toEqual('success');
            done();
        });
    });

    it('login user', (done) => {
        let loginUser = {username: 'testUser', password: '1234'};
        fetch(url('/login'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(loginUser)
        }).then(res => {
            cookie = res.headers.get("set-cookie");
            return res.json()
        }).then(res => {
            expect(res.username).toEqual('testUser');
            expect(res.result).toEqual('success');
            done();
        });
    });

    it('logout', (done) => {
        // console.log(cookie)
        fetch(url('/logout'), {
            method: 'PUT',
            headers: {'Content-Type': 'application/json','cookie':cookie},
        }).then(res => {
            expect(res.status).toEqual(200);
            done();
        });
    });

});