//const { ONCOR_USER, ONCOR_PASS } = require('../utils/config');

async function obtenerESIDWithOncor(meter_number, browser) {
        const page = await browser.newPage();

        await page.goto('https://eepm.oncor.com/spportal/esiid-validation.aspx?p=login', { waitUntil: 'networkidle2' });

        // Colocar los últimos 7 dígitos del ESID
        await page.type('#essid-meter-no', meter_number);
        await page.click('#textsearch');

        try {
                // Esperar que cargue ya sea un resultado válido o el mensaje de error
                await page.waitForSelector('tbody tr', { timeout: 10000 });

                // Verificar si existe el row con clase .k-master-row (éxito)
                const rowExists = await page.$('.k-master-row');

                if (rowExists) {
                        const esIID = await page.$eval('.k-master-row td:nth-child(2)', el => el.innerText.trim());
                        const address = await page.$eval('.k-master-row td:nth-child(3)', el => el.innerText.trim());
                        if (!page.isClosed()) {
                                await page.close();
                        }
                        return { esIID, address };
                } else {
                        // Si no hay resultados válidos, extraer mensaje del segundo <td>
                        const errorMsg = await page.$eval('tbody tr td:nth-child(2)', el => el.innerText.trim());
                        if (!page.isClosed()) {
                                await page.close();
                        }
                        throw new Error(errorMsg);
                }

        } catch (e) {
                if (!page.isClosed()) {
                        await page.close();
                }
                throw new Error(e.message || 'Unknown error occurred');
        }
}

module.exports = obtenerESIDWithOncor;
