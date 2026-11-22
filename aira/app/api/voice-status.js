const { key, send } = require('./_sarvam');

// Tells the app whether Sarvam voice is switched on (a key is configured). Never returns the key.
module.exports = (req, res) => send(res, 200, { sarvam: !!key() });
