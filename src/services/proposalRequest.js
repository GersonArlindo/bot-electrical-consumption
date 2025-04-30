const { AURORA_LIGHTREACH_USER, AURORA_LIGHTREACH_PASSWORD } = require('../utils/config');

async function getProposalAuroraLightreach(customer_name, address, annual_energy_estimate, browser) {
    const page = await browser.newPage();
    // Configura la zona horaria a nivel de página
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    await page.goto('https://v2.aurorasolar.com/login', { waitUntil: 'networkidle2' });

    // Login
    await page.type('input[name="email"]', AURORA_LIGHTREACH_USER);
    await page.type('input[name="password"]', AURORA_LIGHTREACH_PASSWORD);
    await page.click('button[data-testid="log-in-button"]');
    await page.waitForNavigation();

    //Haciendo click en el boton para crear un nuevo proyecto
    await page.waitForSelector('[data-testid="project-create-button"]');
    await page.click('[data-testid="project-create-button"]');

    // Esperar que aparezca el input de address
    await page.waitForSelector('[data-testid="address-input"] input');

    // Escribir el address
    await page.type('[data-testid="address-input"] input', address, { delay: 100 }); // escribe con un pequeño delay para que cargue bien

    // Esperar a que aparezcan las sugerencias (aparece un listado)
    await page.waitForSelector('[role="listbox"] [role="option"]');

    // Hacer click en la primera sugerencia
    await page.click('[role="listbox"] [role="option"]:first-child');

    // Esperar el input de Project Name
    await page.waitForSelector('input[placeholder="Project name"]');

    // Escribir el customer_name
    await page.type('input[placeholder="Project name"]', customer_name, { delay: 100 });

    // Esperar que el botón "Create" esté habilitado
    await page.waitForFunction(() => {
        const btn = document.querySelector('button[data-testid="create-new-project-btn-test-id"]');
        return btn && !btn.disabled;
    });

    // Hacer click en el botón "Create"
    await page.click('button[data-testid="create-new-project-btn-test-id"]');

    await new Promise(resolve => setTimeout(resolve, 1000)); // 
    // Verificar si aparece el botón del modal "Create a new project anyway"
    const duplicateProjectBtn = await page.$('button[data-testid="duplicate-project-warning-continue"]');

    if (duplicateProjectBtn) {
        await duplicateProjectBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Correcto
    }

    await page.waitForNavigation();

    //Click en la opcion Energy Usage de la side bar
    await page.waitForSelector('div[data-component="cascade-menu"][label="Energy usage"] button');
    await page.click('div[data-component="cascade-menu"][label="Energy usage"] button');

    // Paso 1: Esperar a que aparezca el dropdown button (cualquier texto que tenga)
    await page.waitForSelector('[data-testid="energy-consumption-core-load-profile-input-method"] button[data-subcomponent="dropdown-trigger"]');

    // Paso 2: Hacer clic en ese dropdown específico
    await page.click('[data-testid="energy-consumption-core-load-profile-input-method"] button[data-subcomponent="dropdown-trigger"]');


    // Paso 3: Esperar a que aparezcan las opciones del dropdown
    // Nota: ajusta el selector para que coincida con la estructura de las opciones
    await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Correcto

    // Paso 4: Buscar y hacer clic en la opción específica "Annual energy estimate"
    // Buscar por texto exacto usando XPath

    // Esperar a que al menos una opción del menú esté visible
    await page.waitForSelector('[role="option"], [role="menuitem"], li.dropdown-item, .dropdown-menu *', { timeout: 5000 });

    // Buscar la opción "Annual energy estimate" usando evaluate
    const option = await page.evaluateHandle((text) => {
        // Buscar por varias opciones comunes en dropdowns
        const elements = [
            ...document.querySelectorAll('[role="option"]'),
            ...document.querySelectorAll('[role="menuitem"]'),
            ...document.querySelectorAll('li'),
            ...document.querySelectorAll('.dropdown-item'),
            ...document.querySelectorAll('.dropdown-menu *')
        ];

        return elements.find(el => el.textContent.includes(text));
    }, "Annual energy estimate");

    // Verificar si encontramos la opción
    if (option) {
        await option.click();
        console.log('Se hizo clic en "Annual energy estimate"');
    } else {
        console.error('No se pudo encontrar la opción "Annual energy estimate"');
        return { data: false, status: false }
    }

    // 4. Esperar el input donde colocar el valor
    await page.waitForSelector('input[name="annualEstimate"]');

    // 5. Limpiar y escribir el nuevo valor
    await page.evaluate(() => {
        const input = document.querySelector('input[name="annualEstimate"]');
        if (input) input.value = '';
    });

    await page.type('input[name="annualEstimate"]', annual_energy_estimate.toString());

    //Click en la opcion Design de la side bar
    await page.waitForSelector('div[data-component="cascade-menu"][label="Designs"] button');
    await page.click('div[data-component="cascade-menu"][label="Designs"] button');

    // Esperar a que aparezca el botón "New design"
    await page.waitForSelector('[data-testid="create-design-button"]');

    // Hacer clic en el botón
    await page.click('[data-testid="create-design-button"]');
    await page.waitForNavigation();

    await page.waitForSelector('div.sc-bXCLgj.ccTXhi:has(svg[data-icon="sales-mode"]) button');
    await page.click('div.sc-bXCLgj.ccTXhi:has(svg[data-icon="sales-mode"]) button');

    // Paso 4: Esperar a que aparezca la opción "Go to Sales Mode"
    await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Correcto

    // Paso 5: Buscar y hacer clic en la opción "Go to Sales Mode"
    await page.evaluateHandle((text) => {
        const elements = [
            ...document.querySelectorAll('[role="option"]'),
            ...document.querySelectorAll('[role="menuitem"]'),
            ...document.querySelectorAll('li'),
            ...document.querySelectorAll('.dropdown-item'),
            ...document.querySelectorAll('*')
        ];

        const element = elements.find(el => el.textContent.includes(text));
        if (element) element.click();
        return element;
    }, "Go to Sales Mode");

    await page.waitForNavigation();
    await new Promise(resolve => setTimeout(resolve, 4000)); // ✅ Correcto


    // Paso 7: Esperar y hacer clic en el botón con el icono de casa
    //await page.waitForSelector('[data-testid="nav-button-open-design"]');
    //await page.click('[data-testid="nav-button-open-design"]');

    // Paso 7: Esperar a que el botón "Open Design" esté visible
    await page.waitForSelector('[data-testid="nav-button-open-design"]', { visible: true });

    // Espera adicional de seguridad para asegurar carga completa
    await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Correcto

    // Hacer clic en el botón de la casita
    await page.click('[data-testid="nav-button-open-design"]');

    // Paso 8: Esperar a que el contenedor que tiene los dos botones aparezca
    await page.waitForSelector('div.sc-bXCLgj.bMoUla', { visible: true });

    // Paso 9: Buscar todos los botones dentro del contenedor
    const buttons = await page.$$('div.sc-bXCLgj.bMoUla button');

    // Paso 10: Buscar el botón que tiene el texto 'Run Aurora AI Roof'
    for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Run Aurora AI Roof')) {
            await button.click();
            console.log('Botón "Run Aurora AI Roof" clickeado correctamente.');
            break;
        }
    }


    // 1. Esperar y click en "Add Panels"
    await page.waitForSelector('button[data-testid="add-panels"]', { visible: true });

    // Esperar hasta que el botón esté habilitado (con timeout)
    await page.waitForFunction(() => {
        const button = document.querySelector('button[data-testid="add-panels"]');
        return button && !button.disabled && button.getAttribute('aria-disabled') !== 'true';
    }, { timeout: 10000 }); // Timeout de 10 segundos

    // Hacer clic en el botón específico
    await page.click('button[data-testid="add-panels"]');
    console.log('Botón "Add Panels" clickeado correctamente.')

    // 1. Primero, encuentra y cliquea el botón "Select panel"
    await page.waitForSelector('div.sc-bXCLgj.bsBVTh.sc-lmUbDS.booxMX div.sc-bXCLgj:first-child', {
        visible: true
    });

    // Verificar que el texto sea "Select panel"
    const selectPanelText = await page.$eval('div.sc-bXCLgj.bsBVTh.sc-lmUbDS.booxMX div.sc-bXCLgj:first-child',
        el => el.textContent);
    if (selectPanelText === 'Select panel') {
        await page.click('div.sc-bXCLgj.bsBVTh.sc-lmUbDS.booxMX');
        console.log('Botón "Select panel" clickeado correctamente.');
    } else {
        console.error('No se encontró el botón "Select panel"');
    }

    // 2. Esperar a que se muestre el dropdown y seleccionar la última opción
    // Esperamos a que estén visibles todas las opciones del dropdown
    await page.waitForSelector('div[data-testid="cad-sales-dropdown-item"]', { visible: true });

    // Obtener todos los elementos de las opciones del dropdown
    const dropdownItems = await page.$$('div[data-testid="cad-sales-dropdown-item"]');
    console.log(`Se encontraron ${dropdownItems.length} opciones en el dropdown.`);

    // Seleccionar la última opción del dropdown (índice length-1)
    if (dropdownItems.length > 0) {
        await dropdownItems[dropdownItems.length - 1].click();
        console.log('Se seleccionó la última opción del dropdown.');
    } else {
        console.error('No se encontraron opciones en el dropdown.');
    }

    // 3. Buscar y cliquear el botón "Auto"
    await page.waitForSelector('button[data-key="both"][data-subcomponent="segmented-control-segment"]', {
        visible: true
    });

    // Verificar que el texto sea "Auto"
    const autoButtonText = await page.$eval('button[data-key="both"][data-subcomponent="segmented-control-segment"]',
        el => el.textContent);
    if (autoButtonText === 'Auto') {
        await page.click('button[data-key="both"][data-subcomponent="segmented-control-segment"]');
        console.log('Botón "Auto" clickeado correctamente.');
    } else {
        console.error('No se encontró el botón "Auto"');
    }

    // 4. Por último, cliquear el botón "Place"
    await page.waitForSelector('button[type="submit"].Button__BaseButton-sc-i4dou5-0.iXCRlH', {
        visible: true,
        timeout: 5000
    });

    // Verificar que el botón contiene el texto "Place"
    const placeButtonText = await page.$eval('button[type="submit"].Button__BaseButton-sc-i4dou5-0.iXCRlH span',
        el => el.textContent);
    if (placeButtonText === 'Place') {
        // Verificar que el botón esté habilitado
        const isEnabled = await page.evaluate(() => {
            const button = document.querySelector('button[type="submit"].Button__BaseButton-sc-i4dou5-0.iXCRlH');
            return !button.disabled && button.getAttribute('aria-busy') !== 'true';
        });

        if (isEnabled) {
            await page.click('button[type="submit"].Button__BaseButton-sc-i4dou5-0.iXCRlH');
            console.log('Botón "Place" clickeado correctamente.');
        } else {
            console.log('El botón "Place" está visible pero deshabilitado.');
        }
    } else {
        console.error('No se encontró el botón "Place"');
    }

    // Esperar a que aparezca el botón "Finalize" y clickearlo
    await page.waitForSelector('button[data-testid="prism-cad-view-simulation-button"] span', { visible: true });

    const botonesFinalize = await page.$$('button[data-testid="prism-cad-view-simulation-button"]');
    for (const boton of botonesFinalize) {
        const span = await boton.$('span');
        if (span) {
            const texto = await page.evaluate(el => el.textContent, span);
            if (texto.trim() === 'Finalize') {
                await boton.click();
                console.log('Botón "Finalize" clickeado correctamente.');
                break;
            }
        }
    }

    await new Promise(resolve => setTimeout(resolve, 4000)); // ✅ Correcto

    const currentUrl = await page.url();
    console.log('URL después de finalizar:', currentUrl);
    return { data: currentUrl, status: true }

}



module.exports = { getProposalAuroraLightreach };