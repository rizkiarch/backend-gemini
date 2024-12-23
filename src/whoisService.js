const whois = require('whois');
const util = require('util');

const lookupPromise = util.promisify(whois.lookup);

const checkDomain = async (domain) => {
    try {
        const result = await lookupPromise(domain);
        return {
            domain: domain,
            data: result,
            available: !result.includes('Registered')
        };
    } catch (error) {
        throw new Error(`WHOIS lookup failed: ${error.message}`);
    }
};

module.exports = { checkDomain };