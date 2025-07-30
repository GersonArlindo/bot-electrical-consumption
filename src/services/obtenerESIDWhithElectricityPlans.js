async function obtenerESIDWhithElectricityPlans(address, browser) {
    const page = await browser.newPage();
    await page.goto('https://electricityplans.com/texas/esid-lookup/', { waitUntil: 'networkidle2' });

    // Usar el selector correcto del input
    await page.waitForSelector('.autocomplete__input');
    await page.click('.autocomplete__input');
    await page.type('.autocomplete__input', address, { delay: 100 });

    // Esperar a que aparezcan las coincidencias
    await page.waitForSelector('.autocomplete__option', { timeout: 5000 });

    // Intentar obtener el ESID de la primera coincidencia
    const esid = await page.evaluate(() => {
        const firstOption = document.querySelector('.autocomplete__option');
        if (firstOption) {
            const match = firstOption.innerText.match(/\|\s*(\d{17,})/);
            return match ? match[1] : null;
        }
        return null;
    });

    // Si no se obtuvo el ESID directamente, intentar desde el resultado final
    if (!esid) {
        await page.click('.autocomplete__option');
        await page.waitForSelector('#esiid', { timeout: 5000 });
        const esidFinal = await page.$eval('#esiid', el => el.innerText);
        await page.close();
        return esidFinal;
    }

    await page.close();
    return esid;
}

module.exports = obtenerESIDWhithElectricityPlans;
