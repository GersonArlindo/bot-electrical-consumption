const { SMART_METER_USER, SMART_METER_PASS } = require('../utils/config');

async function clearUsagesInSMT(browser) {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    await page.goto('https://www.smartmetertexas.com/home', { waitUntil: 'networkidle2' });

    // Login
    await page.type('#userid', SMART_METER_USER);
    await page.type('#password', SMART_METER_PASS);
    await page.click('button.btn.btn-large.btn-block.btn-primary');

    await page.waitForSelector('.navigation');
    await page.click('a[href="/smartmeters/"]');

    try {
        await page.waitForSelector('.ReactTable.meter-search-results', { timeout: 30000 });

        let hasRows = await page.evaluate(() => {
            return document.querySelectorAll('.rt-tr-group').length > 0;
        });

        if (!hasRows) {
            console.log('No se encontraron registros para eliminar');
            return;
        }

        console.log('Tabla encontrada, procediendo a eliminar registros...');

        while (hasRows) {
            // Marcar checkbox
            await page.evaluate(() => {
                const firstCheckbox = document.querySelector('.rt-tr-group input[type="checkbox"]');
                if (firstCheckbox) firstCheckbox.click();
            });

            // Click botón Remove
            await page.evaluate(() => {
                const removeButtons = Array.from(document.querySelectorAll('.rt-td span[role="button"]'));
                const removeButton = removeButtons.find(el => el.textContent.includes('Remove'));
                if (removeButton) removeButton.click();
            });

            // Esperar a que aparezca el modal
            await page.waitForSelector('.ReactModal__Content', { visible: true, timeout: 10000 });

            // Click Confirm
            await page.evaluate(() => {
                const confirmButton = document.querySelector('.ReactModal__Content .btn.meter-search-button');
                if (confirmButton) confirmButton.click();
            });

            // Esperar a que aparezca el mensaje de éxito
            await page.waitForSelector('.alert.alert-success', { timeout: 10000 });

            // Esperar un poco para asegurar que tabla se actualizó
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verificar si aún hay registros
            hasRows = await page.evaluate(() => {
                return document.querySelectorAll('.rt-tr-group').length > 0;
            });
        }

        console.log('Todos los registros han sido eliminados exitosamente');
    } catch (error) {
        console.error('Error al intentar limpiar los registros:', error);
    }
}


module.exports = clearUsagesInSMT;
