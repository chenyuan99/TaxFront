require('es6-promise').polyfill();
require('isomorphic-fetch')

const url = path => `http://localhost:3000${path}`
var cookie;

describe('Validate Articles functionality', () => {

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

    it('Unit test to validate GET /articles', (done) => {
        fetch(url("/articles"), {
            "method": 'GET',
            "headers": {'cookie': cookie}
        })
            .then(res => {
                expect(res.status).toEqual(200)
            })
            .then(done)
            .catch(done)
    }, 200)


    it('Unit test to validate GET /articles/id', (done) => {
        fetch(url("/articles/testUser"), {
            "method": 'GET',
            "headers": {'cookie': cookie}
        })
            .then(res => {
                expect(res.status).toEqual(200)
            })
            .then(done)
            .catch(done)
    }, 200)


    it('Unit test to validate POST /article', (done) => {
        fetch(url("/article"), {
            "method": 'POST',
            "headers": {'Content-Type': 'application/json','cookie': cookie},
            "body": JSON.stringify({text:"test-balabala"})
        })
            .then(res => {
                expect(res.status).toEqual(200)
            })
            .then(done)
            .catch(done)
    }, 200)
});