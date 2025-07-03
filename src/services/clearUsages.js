const puppeteer = require('puppeteer');

async function clearUsagesInSMT(uniqueDescription, user, pass) {
    if(!uniqueDescription){
        console.log(`El uniqueDescription es posiblemente Null: ${uniqueDescription}`);
        return;
    }
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-http2'],
        defaultViewport: null,
        //args: ['--start-maximized'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    await page.goto('https://www.smartmetertexas.com/home', { waitUntil: 'networkidle2' });

    // Login
    await page.type('#userid', user);
    await page.type('#password', pass);
    await page.click('button.btn.btn-large.btn-block.btn-primary');

    await page.waitForSelector('.navigation');
    await page.click('a[href="/smartmeters/"]');

    try {
        await page.waitForSelector('.ReactTable.meter-search-results', { timeout: 30000 });

        // Verificar si existe una fila que coincida con uniqueDescription
        const foundMatch = await page.evaluate((uniqueDesc) => {
            const rows = document.querySelectorAll('.rt-tr-group');

            for (const row of rows) {
                const descriptionCell = row.querySelector('.rt-td[headers="description"]');
                if (descriptionCell && descriptionCell.textContent === uniqueDesc) {
                    // Si encuentra coincidencia, marca el checkbox de esa fila
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    if (checkbox) checkbox.click();

                    // Encuentra y hace clic en el botón Remove de esa fila
                    const removeSpans = row.querySelectorAll('.rt-td span[role="button"] span');
                    for (const span of removeSpans) {
                        if (span.textContent === 'Remove') {
                            span.parentElement.click();
                            return true;
                        }
                    }
                    return true;
                }
            }
            return false;
        }, uniqueDescription);

        if (!foundMatch) {
            console.log(`No se encontró ningún registro con la descripción: ${uniqueDescription}`);
            if (page && !page.isClosed()) {
                await page.close();
            }
            return;
        }

        console.log(`Registro encontrado con descripción: ${uniqueDescription}, procediendo a eliminar...`);

        // Esperar a que aparezca el modal
        await page.waitForSelector('.ReactModal__Content', { visible: true, timeout: 10000 });

        // Click Confirm
        await page.evaluate(() => {
            const confirmButton = document.querySelector('.ReactModal__Content .btn.meter-search-button');
            if (confirmButton) confirmButton.click();
        });

        // Esperar a que aparezca el mensaje de éxito
        await page.waitForSelector('.alert.alert-success', { timeout: 10000 });

        console.log(`Registro con descripción ${uniqueDescription} ha sido eliminado exitosamente`);
    } catch (error) {
        console.error('Error al intentar eliminar el registro:', error);
    } finally {
        if (page && !page.isClosed()) {
            await page.close();
        }
        await browser.close(); // Añade esta línea para cerrar el navegado
    }
}

module.exports = clearUsagesInSMT;
