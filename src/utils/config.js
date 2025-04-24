require('dotenv').config();

module.exports = {
    SMART_METER_USER: process.env.SMART_METER_USER,
    SMART_METER_PASS: process.env.SMART_METER_PASS,
    REPCARD_USER: process.env.REPCARD_USER,
    REPCARD_PASSWORD: process.env.REPCARD_PASSWORD,
    REPCARD_API_KEY: process.env.REPCARD_API_KEY
};
