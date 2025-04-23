//const { ONCOR_USER, ONCOR_PASS } = require('../utils/config');

async function obtenerMeterNumber(esid, browser) {
    //try {
        const last7 = esid.slice(-7);
        const page = await browser.newPage();

        await page.goto('https://eepm.oncor.com/spportal/esiid-validation.aspx?p=login', { waitUntil: 'networkidle2' });

        // Login
        //await page.type('#usernameInput', ONCOR_USER);
        //await page.type('#passwordInput', ONCOR_PASS);
        //await page.click('#loginButton');
        //await page.waitForNavigation();

        // Colocar los últimos 7 dígitos del ESID
        await page.type('#essid-meter-no', last7);
        await page.click('#textsearch');

        // Esperar a que aparezca la tabla con el resultado
        await page.waitForSelector('.k-master-row', { timeout: 10000 });

        // Capturar el valor de la tercera celda (índice 2) del primer row
        const meterNumber = await page.$eval('.k-master-row td:nth-child(4)', el => el.innerText);

        const address = await page.$eval('.k-master-row td:nth-child(3)', el => el.innerText)

        await page.close();
        return {meterNumber, address};
    // } catch (error) {
    //     //console.error('Ocurrió un error:', error);
    //     return { success: false, error: error.message };
    // }
}

module.exports = obtenerMeterNumber;
