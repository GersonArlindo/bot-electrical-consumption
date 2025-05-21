const puppeteer = require('puppeteer'); // v23.0.0 or later
const { SUBCONTRACTOR_USER, SUBCONTRACTOR_PASSWORD } = require('../utils/config');

async function obtenerDisenioSubContractor(browser, address, first_name, last_name, email, phone) {
 const page = await browser.newPage();
    const timeout = 10000;
    page.setDefaultTimeout(timeout);

    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 1336,
            height: 782
        })
    }
    {
        const targetPage = page;
        await targetPage.goto('https://app.subcontractorhub.com/auth/login');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Email/Username)'),
            targetPage.locator('#email'),
            targetPage.locator('::-p-xpath(//*[@id=\\"email\\"])'),
            targetPage.locator(':scope >>> #email')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 160,
                y: 31,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Email/Username)'),
            targetPage.locator('#email'),
            targetPage.locator('::-p-xpath(//*[@id=\\"email\\"])'),
            targetPage.locator(':scope >>> #email')
        ])
            .setTimeout(timeout)
            .fill(SUBCONTRACTOR_USER);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Password)'),
            targetPage.locator('#password'),
            targetPage.locator('::-p-xpath(//*[@id=\\"password\\"])'),
            targetPage.locator(':scope >>> #password')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 32,
                y: 15,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.keyboard.down('CapsLock');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.up('CapsLock');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Password)'),
            targetPage.locator('#password'),
            targetPage.locator('::-p-xpath(//*[@id=\\"password\\"])'),
            targetPage.locator(':scope >>> #password')
        ])
            .setTimeout(timeout)
            .fill('M');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.down('CapsLock');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.up('CapsLock');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Password)'),
            targetPage.locator('#password'),
            targetPage.locator('::-p-xpath(//*[@id=\\"password\\"])'),
            targetPage.locator(':scope >>> #password')
        ])
            .setTimeout(timeout)
            .fill(SUBCONTRACTOR_PASSWORD);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Sign in) >>>> ::-p-aria([role=\\"generic\\"])'),
            targetPage.locator('button.sign-in-btn > span'),
            targetPage.locator('::-p-xpath(/html/body/salestool-root/salestool-auth/salestool-login/div/div[2]/div[2]/form/div[3]/button[1]/span)'),
            targetPage.locator(':scope >>> button.sign-in-btn > span')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 1.75,
                y: 1,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#customers'),
            targetPage.locator('::-p-xpath(//*[@id=\\"customers\\"])'),
            targetPage.locator(':scope >>> #customers'),
            targetPage.locator('::-p-text(Customers)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 33,
                y: 14,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria([role=\\"main\\"]) >>>> ::-p-aria(New Customer)'),
            targetPage.locator('div > div > div.items-end button'),
            targetPage.locator('::-p-xpath(//*[@id=\\"customerAdd02\\"]/button)'),
            targetPage.locator(':scope >>> div > div > div.items-end button')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 85.578125,
                y: 19,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(  )'),
            targetPage.locator('div.gap-3 > div:nth-of-type(1) input'),
            targetPage.locator('::-p-xpath(/html/body/salestool-root/salestool-admin/div/div/salestool-add-customer/section/div[2]/div[1]/form/div[1]/div[1]/span/input)'),
            targetPage.locator(':scope >>> div.gap-3 > div:nth-of-type(1) input')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 154,
                y: 20,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(  )'),
            targetPage.locator('div.gap-3 > div:nth-of-type(1) input'),
            targetPage.locator('::-p-xpath(/html/body/salestool-root/salestool-admin/div/div/salestool-add-customer/section/div[2]/div[1]/form/div[1]/div[1]/span/input)'),
            targetPage.locator(':scope >>> div.gap-3 > div:nth-of-type(1) input')
        ])
            .setTimeout(timeout)
            .fill(address);
    }
   // Esperar que aparezcan las sugerencias
    await page.waitForSelector('.pac-container .pac-item', {
        visible: true,
        timeout: 5000
    });

    // Obtener todas las sugerencias y hacer clic en la primera
    const suggestions = await page.$$('.pac-container .pac-item');
    if (suggestions.length > 0) {
        await suggestions[0].click();
    } else {
        throw new Error('No se encontraron sugerencias de direcciones.');
    }

    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('form > div:nth-of-type(2) input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"undefined\\"])'),
            targetPage.locator(':scope >>> form > div:nth-of-type(2) input')
        ])
            .setTimeout(timeout)
            .fill(first_name);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('div.mb-6 div:nth-of-type(3) input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"undefined\\"])'),
            targetPage.locator(':scope >>> div.mb-6 div:nth-of-type(3) input')
        ])
            .setTimeout(timeout)
            .fill(last_name);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('form > div:nth-of-type(4) input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"undefined\\"])'),
            targetPage.locator(':scope >>> form > div:nth-of-type(4) input')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 282,
                y: 33,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('form > div:nth-of-type(4) input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"undefined\\"])'),
            targetPage.locator(':scope >>> form > div:nth-of-type(4) input')
        ])
            .setTimeout(timeout)
            .fill(email);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('form > div:nth-of-type(5) input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"undefined\\"])'),
            targetPage.locator(':scope >>> form > div:nth-of-type(5) input')
        ])
            .setTimeout(timeout)
            .fill(phone);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Create customer)'),
            targetPage.locator('salestool-admin > div > div div > button'),
            targetPage.locator('::-p-xpath(/html/body/salestool-root/salestool-admin/div/div/salestool-add-customer/section/div[1]/div/button)'),
            targetPage.locator(':scope >>> salestool-admin > div > div div > button'),
            targetPage.locator('::-p-text(Create customer)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 56.953125,
                y: 13,
              },
            });
    }
    {
        const targetPage = page;

        await targetPage.waitForSelector(
        'button.salestool_orange__btn[mat-raise] mat-icon[data-mat-icon-name="icon-arrow-right"]',
        { visible: true, timeout: 10000 }
        );

        // Hacer clic en el botón específico que contiene el icono "icon-arrow-right"
        await targetPage.click('button.salestool_orange__btn[mat-raise] mat-icon[data-mat-icon-name="icon-arrow-right"]');

    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#mat-select-88 span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-select-value-89\\"]/span)'),
            targetPage.locator(':scope >>> #mat-select-88 span')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 336,
                y: 16.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(dropdown search[role=\\"textbox\\"])'),
            targetPage.locator('div.cdk-overlay-container div > input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-option-874\\"]/span/ngx-mat-select-search/div/input)'),
            targetPage.locator(':scope >>> div.cdk-overlay-container div > input')
        ])
            .setTimeout(timeout)
            .fill('oncor');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.down('Enter');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.up('Enter');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#mat-select-value-89'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-select-value-89\\"])'),
            targetPage.locator(':scope >>> #mat-select-value-89')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 176,
                y: 6.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('div.cdk-overlay-container'),
            targetPage.locator('::-p-xpath(/html/body/div[5])'),
            targetPage.locator(':scope >>> div.cdk-overlay-container')
        ])
            .setTimeout(timeout)
            .click({
              delay: 375.09999999403954,
              offset: {
                x: 298,
                y: 478,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(dropdown search[role=\\"textbox\\"])'),
            targetPage.locator('div.cdk-overlay-container div > input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-option-874\\"]/span/ngx-mat-select-search/div/input)'),
            targetPage.locator(':scope >>> div.cdk-overlay-container div > input')
        ])
            .setTimeout(timeout)
            .fill('oncor');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(dropdown search)'),
            targetPage.locator('div.cdk-overlay-container div > input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-option-874\\"]/span/ngx-mat-select-search/div/input)'),
            targetPage.locator(':scope >>> div.cdk-overlay-container div > input'),
            targetPage.locator('::-p-text(oncor)')
        ])
            .setTimeout(timeout)
            .click({
              delay: 463.5,
              offset: {
                x: 11,
                y: 18.25,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(dropdown search[role=\\"textbox\\"])'),
            targetPage.locator('div.cdk-overlay-container div > input'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-option-874\\"]/span/ngx-mat-select-search/div/input)'),
            targetPage.locator(':scope >>> div.cdk-overlay-container div > input')
        ])
            .setTimeout(timeout)
            .fill('');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#mat-option-1326 > span > span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-option-1326\\"]/span/span)'),
            targetPage.locator(':scope >>> #mat-option-1326 > span > span'),
            targetPage.locator('::-p-text(Oncor Electric Delivery Company LLC)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 172,
                y: 13.375,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Annual) >>>> ::-p-aria([role=\\"generic\\"])'),
            targetPage.locator('#mat-button-toggle-14-button > span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-button-toggle-14-button\\"]/span)'),
            targetPage.locator(':scope >>> #mat-button-toggle-14-button > span'),
            targetPage.locator('::-p-text(Annual)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 18.53125,
                y: 30.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#mat-input-26'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-input-26\\"])'),
            targetPage.locator(':scope >>> #mat-input-26')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 117,
                y: 8.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#mat-input-26'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-input-26\\"])'),
            targetPage.locator(':scope >>> #mat-input-26')
        ])
            .setTimeout(timeout)
            .fill('1975');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Apply) >>>> ::-p-aria([role=\\"generic\\"])'),
            targetPage.locator('form > div.relative span:nth-of-type(1)'),
            targetPage.locator('::-p-xpath(//*[@id=\\"tool-section\\"]/salestool-utility-provider/section/mat-dialog-content/div/div/form/div[1]/form/div[3]/salestool-button/button/span[1])'),
            targetPage.locator(':scope >>> form > div.relative span:nth-of-type(1)'),
            targetPage.locator('::-p-text(Apply)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 12.90625,
                y: 9,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#tool-section section > div.flex span:nth-of-type(1)'),
            targetPage.locator('::-p-xpath(//*[@id=\\"tool-section\\"]/salestool-utility-provider/section/div[2]/salestool-button/button/span[1])'),
            targetPage.locator(':scope >>> #tool-section section > div.flex span:nth-of-type(1)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 53.109375,
                y: 7.673828125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#section1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"section1\\"])'),
            targetPage.locator(':scope >>> #section1')
        ])
            .setTimeout(timeout)
            .click({
              delay: 431.3999999985099,
              offset: {
                x: 19,
                y: 895.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#mat-input-26'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-input-26\\"])'),
            targetPage.locator(':scope >>> #mat-input-26')
        ])
            .setTimeout(timeout)
            .fill('1350');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Apply) >>>> ::-p-aria([role=\\"generic\\"])'),
            targetPage.locator('form > div.relative span:nth-of-type(1)'),
            targetPage.locator('::-p-xpath(//*[@id=\\"tool-section\\"]/salestool-utility-provider/section/mat-dialog-content/div/div/form/div[1]/form/div[3]/salestool-button/button/span[1])'),
            targetPage.locator(':scope >>> form > div.relative span:nth-of-type(1)'),
            targetPage.locator('::-p-text(Apply)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 4.90625,
                y: 15,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#tool-section section > div.flex span:nth-of-type(1)'),
            targetPage.locator('::-p-xpath(//*[@id=\\"tool-section\\"]/salestool-utility-provider/section/div[2]/salestool-button/button/span[1])'),
            targetPage.locator(':scope >>> #tool-section section > div.flex span:nth-of-type(1)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 37.109375,
                y: 8.9664306640625,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#preferred-finannce-value'),
            targetPage.locator('::-p-xpath(//*[@id=\\"preferred-finannce-value\\"])'),
            targetPage.locator(':scope >>> #preferred-finannce-value')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 34.875,
                y: 7.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#section1 > div.flex div.w-full svg'),
            targetPage.locator('::-p-xpath(//*[@id=\\"preferred-finannce-edit\\"]/button/mat-icon/svg)'),
            targetPage.locator(':scope >>> #section1 > div.flex div.w-full svg')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 5.109375,
                y: 6.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#section1 > div.flex div.mat-select-arrow-wrapper'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-select-96\\"]/div/div[2])'),
            targetPage.locator(':scope >>> #section1 > div.flex div.mat-select-arrow-wrapper')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 1.109375,
                y: 4.5,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#finance-optipn-value0 > span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"finance-optipn-value0\\"]/span)'),
            targetPage.locator(':scope >>> #finance-optipn-value0 > span')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 33.109375,
                y: 22.375,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Yes)'),
            targetPage.locator('div.cdk-overlay-container button.button-primary'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mat-dialog-0\\"]/salestool-confirm/div/div[2]/button[2])'),
            targetPage.locator(':scope >>> div.cdk-overlay-container button.button-primary')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 40,
                y: 22,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Apply) >>>> ::-p-aria([role=\\"generic\\"])'),
            targetPage.locator('form > div.relative span:nth-of-type(1)'),
            targetPage.locator('::-p-xpath(//*[@id=\\"tool-section\\"]/salestool-utility-provider/section/mat-dialog-content/div/div/form/div[1]/form/div[3]/salestool-button/button/span[1])'),
            targetPage.locator(':scope >>> form > div.relative span:nth-of-type(1)'),
            targetPage.locator('::-p-text(Apply)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 1.90625,
                y: 16,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#tool-section section > div.flex span:nth-of-type(1)'),
            targetPage.locator('::-p-xpath(//*[@id=\\"tool-section\\"]/salestool-utility-provider/section/div[2]/salestool-button/button/span[1])'),
            targetPage.locator(':scope >>> #tool-section section > div.flex span:nth-of-type(1)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 26.109375,
                y: 14.93670654296875,
              },
            });
    }
}

async function highlightClickArea(page, selector) {
    await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
            const rect = element.getBoundingClientRect();
            const highlightDiv = document.createElement('div');
            highlightDiv.style.position = 'absolute';
            highlightDiv.style.top = `${rect.top + window.scrollY}px`;
            highlightDiv.style.left = `${rect.left + window.scrollX}px`;
            highlightDiv.style.width = `${rect.width}px`;
            highlightDiv.style.height = `${rect.height}px`;
            highlightDiv.style.border = '3px solid red';
            highlightDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            highlightDiv.style.zIndex = '9999';
            highlightDiv.style.pointerEvents = 'none';
            document.body.appendChild(highlightDiv);

            // Remover después de 3 segundos
            setTimeout(() => {
                highlightDiv.remove();
            }, 3000);
        } else {
            console.log("Elemento no encontrado para resaltar:", selector);
        }
    }, selector);
}

module.exports = obtenerDisenioSubContractor;