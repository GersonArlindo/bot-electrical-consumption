const { SMART_METER_USER, SMART_METER_PASS } = require('../utils/config');
const ExcelJS = require('exceljs');
const path = require('path');

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
  await page.type('#esiid', esid);
  await page.type('#meterNumber', meterNumber);
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
                // Buscar el botón con texto 'View Energy Data' y hacer click
                const buttons = document.querySelectorAll('button.meter-search-button');
                for (const button of buttons) {
                  if (button.textContent.trim() === 'View Energy Data') {
                    button.click();
                    break;
                  }
                }
                return true;
              }
            }
          }
          return false;
        }, uniqueDescription);

        if (recordFound) {
          console.log(`✔️ Registro con descripción '${uniqueDescription}' encontrado y seleccionado`);

          // Esperar a que cargue el select y seleccionar 'Monthly Billing Information'
          await page.waitForSelector('#reporttype_input');
          await page.select('#reporttype_input', 'MONTHLY');
          console.log('✅ Seleccionado Monthly Billing Information');
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Calcular las fechas
          const currentDate = new Date();
          const fromDate = new Date(currentDate);
          // Restar 1 año
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          // Sumar 1 mes
          // fromDate.setMonth(fromDate.getMonth() + 1);

          // // Manejar desbordamiento de mes a año siguiente
          // if (fromDate.getMonth() > 11) {
          //   fromDate.setMonth(0);
          //   fromDate.setFullYear(fromDate.getFullYear() + 1);
          // }

          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const from = `${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
          const to = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
          console.log(`Rango de fechas: desde ${from} hasta ${to}`);

          // Intenta sobrescribir los valores directamente en el DOM
          await page.evaluate((from, to) => {
            // Definir una función que sobrescriba el campo y evite que React lo restaure
            const forceInputValue = (selector, value) => {
              const input = document.querySelector(selector);
              if (!input) return false;
              
              // Sobrescribir propiedades getter/setter del value
              Object.defineProperty(input, 'value', {
                writable: false,
                configurable: true,
                value: value
              });
              
              // Disparar eventos necesarios
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              
              return true;
            };
            
            forceInputValue('#startdatefield', from);
            forceInputValue('#enddatefield', to);
            
            // También podemos intentar modificar el estado interno de React
            // Esto es más experimental y podría no funcionar
            const reactRoot = document.querySelector('#form');
            if (reactRoot && reactRoot._reactRootContainer) {
              console.log('React root encontrado, intentando modificar estado interno');
            }
          }, from, to);


          console.log('✅ Fechas seteadas');
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Hacer click en el botón 'Submit Update'
          await page.click('.updreport-button');

          console.log('✅ Boton de Submit clickedo');
          await new Promise(resolve => setTimeout(resolve, 2000));


          // Esperar a que cargue la tabla
          await page.waitForSelector('table[data-testid="table"]');

          // Extraer datos de la tabla desde el navegador (solo las primeras 3 columnas)
          const tableData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table[data-testid="table"] tbody tr'));
            return rows.map(row => {
              const cells = Array.from(row.querySelectorAll('td'));
              // Tomar solo las primeras 3 columnas de cada fila
              return cells.slice(0, 3).map(cell => cell.innerText.trim());
            });
          });

          console.log('✅ Datos extraídos de la tabla (solo primeras 3 columnas)');

          // Crear el Excel
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Reporte');

          // Agregar solo los encabezados que necesitas
          worksheet.addRow(['Start date', 'End date', 'Actual kWh']);

          // Agregar los datos y sumar la columna Actual kWh (tercera columna)
          let totalKWh = 0;
          tableData.forEach(row => {
            worksheet.addRow(row);
            
            // Convertir el valor a número y sumarlo al total
            // Eliminar posibles caracteres no numéricos (como comas o símbolos de moneda)
            const kwhValue = parseFloat(row[2].replace(/[^0-9.-]+/g, ''));
            if (!isNaN(kwhValue)) {
              totalKWh += kwhValue;
            }
          });

          // Agregar una fila en blanco
          worksheet.addRow([]);

          // Agregar fila con el total
          const totalRow = worksheet.addRow(['Total', '', totalKWh.toFixed(2)]);
          // Dar formato al total (negritas y borde superior)
          totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.font = { bold: true };
            cell.border = {
              top: { style: 'thin' }
            };
          });

          // Definir ruta absoluta al directorio de descargas
          const downloadsDir = path.resolve(__dirname, '../../public/downloads');

          // Definir nombre del archivo
          const fileName = `${uniqueDescription}.xlsx`;
          const filePath = path.join(downloadsDir, fileName);

          // Guardar el archivo
          await workbook.xlsx.writeFile(filePath);

          console.log(`📄 Excel generado: ${filePath}`);
          // Definir la ruta pública o la ruta relativa desde tu servidor
          const publicUrl = `/downloads/${fileName}`;

          // Retornar la dirección donde quedó alojado
          return publicUrl;


          

        } else {
          console.log('❌ No se descargó ningún archivo en el tiempo esperado');
        }
        // Espera para ver resultados o continuar
        await new Promise(resolve => setTimeout(resolve, 2000));
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
