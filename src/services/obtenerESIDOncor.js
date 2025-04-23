//const { ONCOR_USER, ONCOR_PASS } = require('../utils/config');

async function obtenerESIDWithOncor(meter_number, browser) {
        const page = await browser.newPage();

        await page.goto('https://eepm.oncor.com/spportal/esiid-validation.aspx?p=login', { waitUntil: 'networkidle2' });

        // Colocar los últimos 7 dígitos del ESID
        await page.type('#essid-meter-no', meter_number);
        await page.click('#textsearch');

        // Esperar a que aparezca la tabla con el resultado
        await page.waitForSelector('.k-master-row', { timeout: 10000 });

        // Capturar el valor de la tercera celda (índice 2) del primer row
        const esIID = await page.$eval('.k-master-row td:nth-child(2)', el => el.innerText);

        const address = await page.$eval('.k-master-row td:nth-child(3)', el => el.innerText)

        await page.close();

        return {esIID, address};

}

module.exports = obtenerESIDWithOncor;
