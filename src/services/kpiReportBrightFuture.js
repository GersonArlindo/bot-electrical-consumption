const path = require('path');

async function obtenerKpiReport(browser, opcionFecha = 'hoy') {
    const page = await browser.newPage();
    await page.goto('https://lookerstudio.google.com/u/0/reporting/49a074c1-11a5-4c0a-b0e3-00b20ca23f83/page/xVqYE', { waitUntil: 'networkidle2' });
    // Esperar a que la página cargue completamente (opcional, puedes ajustar el selector)
    await page.waitForSelector('body', { timeout: 10000 });

    //await page.waitForSelector('button.mat-mdc-button-base.mat-mdc-tooltip-trigger.ng2-date-picker-button[aria-label="getDateText()"]', { timeout: 5000 });
    //await page.click('button.mat-mdc-button-base.mat-mdc-tooltip-trigger.ng2-date-picker-button[aria-label="getDateText()"]');

    // 1. Abrir el selector de rango de fechas
    //await page.waitForSelector('button[aria-label="getDateText()"]', { timeout: 10000 });
    //await page.click('button[aria-label="getDateText()"]');

    // Generar el nombre de la captura basado en la fecha actual
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kpi-report-${timestamp}.png`;

    // Definir la ruta de guardado
    const downloadsDir = path.resolve(__dirname, '../../public/kpi-report');
    const filePath = path.join(downloadsDir, filename);

    // Tomar la captura de pantalla
    await page.screenshot({
        path: filePath,
        fullPage: true
    });

    return filePath;
}

module.exports = obtenerKpiReport;
