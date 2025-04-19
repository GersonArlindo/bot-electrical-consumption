const puppeteer = require('puppeteer');

async function obtenerESID(address, browser) {
    //try {
        const page = await browser.newPage();
        await page.goto('https://www.energybot.com/esid-lookup.html', { waitUntil: 'networkidle2' });

        await page.waitForSelector('#esid-search-input');
        await page.type('#esid-search-input', address);
        await page.waitForSelector('#autoComplete_result_0');
        await page.click('#autoComplete_result_0');
        await page.waitForSelector('.ml-2.eb-app-description-text');

        const esidResult = await page.$eval('.ml-2.eb-app-description-text', el => el.innerText);
        await page.close();
        return esidResult;
    // } catch (error) {
    //     console.error('Ocurrió un error:', error);
    //     return { success: false, error: error.message };
    // }
}

module.exports = obtenerESID;
