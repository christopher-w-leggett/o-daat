'use strict';

const app = require('../main');
const chai = require('chai');
const expect = chai.expect;

let event, context;

describe('Tests Hello World', function () {
    it('verifies successful response', async () => {
        const result = await app.helloWorld(event, context);

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        let response = JSON.parse(result.body);

        expect(response).to.be.an('object');
        expect(response.message).to.equal("hello world");
        expect(response.location).to.be.an("string");
    });
});
