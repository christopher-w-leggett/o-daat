'use strict'

const axios = require('axios')
const url = 'http://checkip.amazonaws.com/';

exports.helloWorld = async (event, context, callback) => {
    try {
        const ret = await axios(url);
        return {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
                location: ret.data.trim()
            })
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
};
