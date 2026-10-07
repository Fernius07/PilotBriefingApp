// Ensure Node.js does not reject FAA / US Government intermediate SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = require('../server/app');

module.exports = app;

