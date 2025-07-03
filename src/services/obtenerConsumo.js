//const { SMART_METER_USER_1, SMART_METER_PASS_1 } = require('../utils/config');
const ExcelJS = require('exceljs');
const path = require('path');
const energy_providers = require('../utils/energy_providers');

// Helper functions
async function login(page, user, pass) {
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
  await page.goto('https://www.smartmetertexas.com/home', { waitUntil: 'networkidle2' });

  await page.type('#userid', user);
  await page.type('#password', pass);
  await page.click('button.btn.btn-large.btn-block.btn-primary');
}

async function navigateToSmartMeters(page) {
  await page.waitForSelector('.navigation');
  await page.click('a[href="/smartmeters/"]');
  await page.waitForSelector('.add-meter-button');
  await page.click('.add-meter-button');
}

async function addMeter(page, esid, meterNumber) {
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
  return uniqueDescription;
}

async function selectEnergyProvider(page, provider) {
  await page.waitForSelector('#selectRep', { visible: true });
  await page.click('#selectRep');
  await page.waitForSelector('#search_input');

  await page.evaluate(() => document.querySelector('#search_input').value = '');
  await page.click('#search_input', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#search_input', provider);
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.click('button.meter-search-button.meter-search-dashboard-button');
}

async function handleProviderSelection(page) {
  const radioExists = await page.$('input[type="radio"][name="selectedREP"]');
  if (!radioExists) return false;

  await page.click('input[type="radio"][name="selectedREP"]');
  console.log('✔️ Radio button seleccionado');

  await page.waitForSelector("button.meter-search-button", { visible: true });
  
  // Click Select button
  await page.evaluate(() => {
    const selectButton = Array.from(document.querySelectorAll('button.meter-search-button'))
      .find(btn => btn.textContent.includes('Select'));
    selectButton?.click();
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Click Add Smart Meter button
  await page.evaluate(() => {
    const addMeterButton = Array.from(document.querySelectorAll('button.meter-search-button'))
      .find(btn => btn.textContent.includes('Add Smart Meter'));
    addMeterButton?.click();
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
}

async function checkForAlert(page) {
  const alertExists = await page.$('.alert.alert-danger');
  if (!alertExists) return null;
  
  return await page.evaluate(el => el.innerText, alertExists);
}

async function selectMeterAndViewData(page, uniqueDescription) {
  await page.waitForFunction((desc) => {
    const rows = Array.from(document.querySelectorAll('.rt-tbody .rt-tr-group'));
    return rows.some(row => {
      const descriptionDiv = row.querySelector('div[headers="description"]');
      return descriptionDiv && descriptionDiv.textContent.trim() === desc;
    });
  }, { timeout: 10000 }, uniqueDescription);

  return await page.evaluate((desc) => {
    const rows = Array.from(document.querySelectorAll('.rt-tbody .rt-tr-group'));
    for (const row of rows) {
      const descriptionDiv = row.querySelector('div[headers="description"]');
      if (descriptionDiv?.textContent.trim() === desc) {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.click();
          const buttons = document.querySelectorAll('button.meter-search-button');
          for (const button of buttons) {
            if (button.textContent.trim() === 'View Energy Data') {
              button.click();
              return true;
            }
          }
        }
      }
    }
    return false;
  }, uniqueDescription);
}

// Report generation functions
async function generateMonthlyReport(page, uniqueDescription, provider) {
  await page.waitForSelector('#reporttype_input');
  await page.select('#reporttype_input', 'MONTHLY');
  console.log('✅ Seleccionado Monthly Billing Information');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const currentDate = new Date();
  const fromDate = new Date(currentDate);
  fromDate.setFullYear(fromDate.getFullYear() - 1);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const from = `${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
  const to = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  await page.evaluate((from, to) => {
    const forceInputValue = (selector, value) => {
      const input = document.querySelector(selector);
      if (!input) return false;
      Object.defineProperty(input, 'value', { value });
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    forceInputValue('#startdatefield', from);
    forceInputValue('#enddatefield', to);
  }, from, to);

  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.click('.updreport-button');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tableData = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table[data-testid="table"] tbody tr')).map(row => {
      return Array.from(row.querySelectorAll('td')).slice(0, 3).map(cell => {
        const text = cell.innerText.trim();
        return text.match(/(\d{2}\/\d{2}\/\d{4})/)?.[0] || text.match(/(\d+)/)?.[0] || text;
      });
    });
  });

  return await createExcelFile(uniqueDescription, tableData.slice(-12), provider, ['Start date', 'End date', 'Actual kWh']);
}

async function generateIntervalReport(page, uniqueDescription, provider) {
  await page.waitForSelector('#reporttype_input');
  await page.select('#reporttype_input', 'INTERVAL');
  console.log('✅ Seleccionado Energy Data Table (15 Minute Intervals)');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const currentDate = new Date();
  const fromDate = new Date(currentDate);
  fromDate.setDate(fromDate.getDate() - 365);

  const formatDate = (date) => {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const from = formatDate(fromDate);
  const to = formatDate(currentDate);

  await page.evaluate((from, to) => {
    const forceInputValue = (selector, value) => {
      const input = document.querySelector(selector);
      if (!input) return false;
      Object.defineProperty(input, 'value', { value });
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    forceInputValue('#startdatefield', from);
    forceInputValue('#enddatefield', to);
  }, from, to);

  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.click('.updreport-button');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const allTableData = await extractAllTableData(page);
  return await createExcelFile(uniqueDescription, allTableData, provider, ['Date', 'Start date', 'End date', 'Actual kWh']);
}

async function extractAllTableData(page) {
  const allData = [];
  let iterationCount = 0;
  const maxIterations = 365;

  while (iterationCount < maxIterations) {
    iterationCount++;
    const tableData = await extractSingleTableData(page);
    if (tableData.data.length === 0) break;
    
    allData.push(tableData);

    const nextButton = await page.$('div.col-lg-2.col-xs-12.next-link span[style*="cursor: pointer"]');
    if (!nextButton) break;

    await nextButton.click();
    try {
      await page.waitForSelector('table[data-testid="table"]', { timeout: 25000, visible: true });
    } catch (e) {
      console.log('No apareció la nueva tabla después de 25 segundos');
      break;
    }
  }

  return allData.flatMap(table => 
    table.data.map(row => [table.date || '', ...row])
  );
}

async function extractSingleTableData(page) {
  const dateHeader = await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2'));
    for (const h2 of h2s) {
      const text = h2.innerText.trim();
      const match = text.match(/\d{2}\/\d{2}\/\d{4}/);
      if (text.includes('Kilowatt Hours for') && match) return match[0];
    }
    return null;
  });

  const tableData = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table[data-testid="table"] tbody tr')).map(row => {
      return Array.from(row.querySelectorAll('td')).slice(0, 3).map(cell => {
        return cell.lastChild.textContent.trim();
      });
    });
  });

  return { date: dateHeader, data: tableData };
}

async function createExcelFile(uniqueDescription, data, provider, headers) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');
  
  worksheet.addRow(headers);
  let totalKWh = 0;

  data.forEach(row => {
    worksheet.addRow(row);
    const kwhIndex = headers.includes('Date') ? 3 : 2;
    const kwhValue = parseFloat(row[kwhIndex]?.replace(/[^0-9.-]+/g, '') || '0');
    if (!isNaN(kwhValue)) totalKWh += kwhValue;
  });

  worksheet.addRow([]);
  const totalRow = worksheet.addRow([...Array(headers.length - 1).fill(''), totalKWh.toFixed(2)]);
  
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true };
    cell.border = { top: { style: 'thin' } };
  });

  const downloadsDir = path.resolve(__dirname, '../../public/downloads');
  const fileName = `${uniqueDescription}.xlsx`;
  const filePath = path.join(downloadsDir, fileName);

  await workbook.xlsx.writeFile(filePath);
  console.log(`📄 Excel generado: ${filePath}`);

  return {
    consumo: `/downloads/${fileName}`,
    energyProvider: provider,
    uniqueDescription,
    meterTotal: totalKWh.toFixed(2)
  };
}

// Main function
async function obtenerConsumo(esid, meterNumber, browser, energy_provider = null, type, account) {
  const page = await browser.newPage();
  try {
    await login(page, account.user, account.pass)
    await navigateToSmartMeters(page);
    const uniqueDescription = await addMeter(page, esid, meterNumber);

    const providers = energy_provider ? [energy_provider] : energy_providers;
    
    for (const provider of providers) {
      console.log(`Probando con REP: ${provider}`);
      await selectEnergyProvider(page, provider);
      
      if (!await handleProviderSelection(page)) {
        console.log(`No Retail Electric Provider found with name: ${provider}`);
        continue;
      }

      const alertText = await checkForAlert(page);
      if (alertText) {
        if (alertText.includes('No Such ESIID exists for this REP')) {
          console.log(`El REP ${provider} ya estaba asociado. Probando con otro...`);
          continue;
        }
        return { 
          consumo: alertText, 
          energyProvider: energy_provider ? provider : null, 
          uniqueDescription, 
          meterTotal: 0 
        };
      }

      console.log(`Se agregó correctamente con ${provider}`);
      if (!await selectMeterAndViewData(page, uniqueDescription)) {
        return { 
          consumo: "❌ No file was downloaded in the expected time", 
          energyProvider: null, 
          uniqueDescription, 
          meterTotal: 0 
        };
      }

      if (type === "monthly") {
        return await generateMonthlyReport(page, uniqueDescription, provider);
      } else if (type === "interval") {
        return await generateIntervalReport(page, uniqueDescription, provider);
      }
    }

    return { 
      consumo: "Could not add smart meter with any of the Retail Electric Provider.", 
      energyProvider: null, 
      uniqueDescription, 
      meterTotal: 0 
    };
  } finally {
    await page.close();
  }
}

module.exports = obtenerConsumo;