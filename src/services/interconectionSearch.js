const puppeteer = require("puppeteer");
const { INTERCONECTION_USER, INTERCONECTION_PASSWORD } = require('../utils/config');

async function interconectionSearch(nombre, browser) {
    const page = await browser.newPage();
    try {
        // Navegar a la página de login
        await page.goto("https://plus.anbetrack.com/oncor-dg/#/workarea/dashboard", { waitUntil: "networkidle2" });

        // Ingresar credenciales
        await page.type("input[placeholder=\"Enter your User ID\"]", INTERCONECTION_USER);
        await page.type("input[placeholder=\"Enter your password\"]", INTERCONECTION_PASSWORD);

        // Hacer clic en el botón de Sign In usando el índice del elemento
        await page.click('button.login-sign-bnt');

        // Esperar a que la navegación post-login se complete
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        // Navegar a la sección de Proyectos
        await page.goto("https://plus.anbetrack.com/oncor-dg/#/workarea/modelgrid/project", { waitUntil: "networkidle2" });

        // Esperar el dropdown para seleccionar "Project Name"
        await page.waitForSelector('.el-input-group__prepend .el-select');
        await page.click('.el-input-group__prepend .el-select'); // Abrir dropdown

        // Esperar opciones del dropdown
        await page.waitForSelector('.el-select-dropdown__item');

        // Buscar y seleccionar "Project Name"
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
            const projectOption = items.find(el => el.textContent.trim() === 'Project Name');
            if (projectOption) projectOption.click();
        });

        // Escribir el nombre a buscar
        const inputSelector = 'input[placeholder="Type here to search"]';
        await page.waitForSelector(inputSelector);
        await page.click(inputSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type(inputSelector, nombre);

        // Hacer clic en el botón Search
        const searchButtonSelector = '.el-input-group__append button';
        await page.click(searchButtonSelector);

        // Esperar a que los resultados se carguen
        await new Promise(resolve => setTimeout(resolve, 8000)); // espera 2 segundos

        // Extraer la información de la tabla
        const data = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("table tbody tr"));
                // Filtrar solo filas realmente visibles
            const visibleRows = rows.filter(row => 
                row.style.display !== 'none' && 
                row.offsetHeight > 0 &&
                row.offsetWidth > 0
            );
            return visibleRows.map(row => {
                const columns = Array.from(row.querySelectorAll("td"));
                const code = columns[0] ? columns[0].innerText.trim() : "";
                // Construir el enlace directo al proyecto usando el código
                return {
                    code: code,
                    projectName: columns[1] ? columns[1].innerText.trim() : "",
                    workflowStatus: columns[2] ? columns[2].innerText.trim() : "",
                    exportTotalInverterCapacity: columns[3] ? columns[3].innerText.trim() : "",
                    connectedCapacity: columns[4] ? columns[4].innerText.trim() : "",
                    dcCapacity: columns[5] ? columns[5].innerText.trim() : "",
                    statusDate: columns[6] ? columns[6].innerText.trim() : "",
                    technology: columns[7] ? columns[7].innerText.trim() : "",
                    fuel: columns[8] ? columns[8].innerText.trim() : "",
                    createdBy: columns[9] ? columns[9].innerText.trim() : "",
                    createdAt: columns[10] ? columns[10].innerText.trim() : "",
                    updatedBy: columns[11] ? columns[11].innerText.trim() : "",
                    updatedAt: columns[12] ? columns[12].innerText.trim() : ""
                };
            });
        });

        // Filtrar los resultados por el nombre o similar
        const filteredData = data.filter(item => item.projectName.toLowerCase().includes(nombre.toLowerCase()));

        // Eliminar duplicados por projectName
        const uniqueData = Array.from(
            new Map(filteredData.map(item => [item.projectName, item])).values()
        );

        return { success: true, data: uniqueData };

    } catch (error) {
        console.error("Ocurrió un error:", error);
        return { success: false, error: error.message };
    } finally {
        await page.close();
    }
}

module.exports = interconectionSearch;