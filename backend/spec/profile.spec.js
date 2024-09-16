// const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

const url = path => `http://localhost:3000${path}`
var cookie;

describe('Validate Profile functionality', () => {

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


    it(': Unit test to validate PUT /headline', (done) => {
        var oldheadline;
        var newheadline = "new headline"
        var username;
        let loginUser = {username: 'testUser', password: '1234'};
        fetch(url("/headline"), {
            "headers": {'Content-Type': 'application/json', 'cookie': cookie},
            "method": 'PUT',
            "body": JSON.stringify({headline: newheadline})
        }).then(res => {
            expect(res.status).toEqual(200)
            return res.json()
        })
            .then((res) => {
                expect(res.headline).toEqual(newheadline)
            })
            // .then(_ => {
            //     return fetch(url("/headline/" + "testUser"), {
            //         "method": 'GET',
            //         "headers": {'Content-Type': 'application/json', 'cookie': 'sid=d3183bde0e6eed8558d87a53ad32917a'}
            //     })
            // })
            // .then(res => {
            //     expect(res.status).toEqual(200)
            //     return res.json()
            // })
            // .then(res => {
            //     expect(res.headline).toEqual(newheadline)
            // })
            .then(done)
            .catch(done)
    }, 200)


    it('Backend: Unit test to validate GET /headline', (done) => {
        fetch(url("/headline/" + "testUser"), {
            "method": 'GET',
            "headers": {'Content-Type': 'application/json', 'cookie': cookie}
        })
            .then(res => {
                expect(res.status).toEqual(200)
                return res.json()
            })
            .then(res => {
                expect(res.headline).toEqual("new headline")
            })
            .then(done)
            .catch(done)
    }, 200)

});