const { SMART_METER_USER, SMART_METER_PASS } = require('../utils/config');
const energy_providers = require('../utils/energy_providers');

async function obtenerConsumo(esid, meterNumber, browser) {
    const page = await browser.newPage();
    await page.goto('https://www.smartmetertexas.com/home', { waitUntil: 'networkidle2' });

    await page.type('#userid', SMART_METER_USER);
    await page.type('#password', SMART_METER_PASS);
    await page.click('button.btn.btn-large.btn-block.btn-primary');

    await page.waitForSelector('.navigation');
    await page.click('a[href="/smartmeters/"]');

    await page.waitForSelector('.add-meter-button');
    await page.click('.add-meter-button');

    await page.waitForSelector('#description');
    await page.waitForSelector('#esiid');
    await page.waitForSelector('#meterNumber');
    await page.waitForSelector('#tnccheck');

    const uniqueDescription = `Consumption-${Date.now()}`;

    await page.type('#description', uniqueDescription);
    await page.type('#esiid', '10443720003966454');
    await page.type('#meterNumber', '147285914LG');
    await page.click('#tnccheck');

    await new Promise(resolve => setTimeout(resolve, 3000));

    let addedSuccessfully = false;

    for (const rep of energy_providers) {
        console.log(`Probando con REP: ${rep}`);
        await page.waitForSelector('#selectRep', { visible: true });
        // Clic al botón para seleccionar REP
        await page.click('#selectRep');
        await page.waitForSelector('#search_input');

        // Escribimos el nombre del REP
        await page.evaluate(() => document.querySelector('#search_input').value = '');
        await page.click('#search_input', { clickCount: 3 }); // selecciona todo
        await page.keyboard.press('Backspace'); // lo borra
        await page.type('#search_input', rep);
        await new Promise(resolve => setTimeout(resolve, 2000)); // para esperar resultados
        await page.click('button.meter-search-button.meter-search-dashboard-button'); // botón Select
        // Esperamos a que aparezca la opción y la seleccionamos
        const radioExists = await page.$('input[type="radio"][name="selectedREP"]');
        if (radioExists) {
            await page.click('input[type="radio"][name="selectedREP"]');
            console.log('✔️ Radio button seleccionado');
            
            await page.waitForSelector("button.meter-search-button", { visible: true });
            console.log('✔️ Botones con clase meter-search-button visibles');
            
            // Verificamos qué botones hay con esa clase y sus textos
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button.meter-search-button'));
              buttons.forEach(btn => console.log('🖲️ Botón encontrado con texto:', btn.textContent.trim()));
            });
            
            // Ahora click al de "Select"
            await page.evaluate(() => {
              const selectButton = Array.from(document.querySelectorAll('button.meter-search-button'))
                .find(btn => btn.textContent.includes('Select'));
              if (selectButton) {
                console.log('👉 Botón Select encontrado y cliqueado');
                selectButton.click();
              } else {
                console.log('❌ No se encontró el botón Select');
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Para ver bien el cambio
            
            // Ahora mismo con Add Smart Meter
            await page.evaluate(() => {
              const addMeterButton = Array.from(document.querySelectorAll('button.meter-search-button'))
                .find(btn => btn.textContent.includes('Add Smart Meter'));
              if (addMeterButton) {
                console.log('👉 Botón Add Smart Meter encontrado y cliqueado');
                addMeterButton.click();
              } else {
                console.log('❌ No se encontró el botón Add Smart Meter');
              }
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verificar si apareció la alerta
            const alertExists = await page.$('.alert.alert-danger');

            if (alertExists) {
                console.log(`El REP ${rep} ya estaba asociado. Probando con otro...`);
                continue;
            } else {
                console.log(`Se agregó correctamente con ${rep}`);
                addedSuccessfully = true;
                const recordFound = await page.evaluate((desc) => {
                    const rows = Array.from(document.querySelectorAll('.rt-tbody .rt-tr-group'));
                    
                    for (const row of rows) {
                      const descriptionDiv = row.querySelector('div[headers="description"]');
                      if (descriptionDiv && descriptionDiv.textContent.trim() === desc) {
                        const checkbox = row.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                          checkbox.click();
                          return true;
                        }
                      }
                    }
                    return false;
                  }, uniqueDescription);
                  
                  if (recordFound) {
                    console.log(`✔️ Registro con descripción '${uniqueDescription}' encontrado y seleccionado`);
                    
                  } else {
                    console.log(`❌ No se encontró registro con descripción '${uniqueDescription}'`);
                  }
                break;
            }
        } else {
            console.log(`No se encontró REP con nombre: ${rep}`);
        }
    }
    await page.close();

    if (addedSuccessfully) {
        return "Smart meter agregado exitosamente.";
    } else {
        return "No se pudo agregar smart meter con ninguno de los REP.";
    }
}
module.exports = obtenerConsumo;
