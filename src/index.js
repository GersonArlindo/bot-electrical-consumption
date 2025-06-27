const express = require('express');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const obtenerESID = require('./services/obtenerESID');
const obtenerMeterNumber = require('./services/obtenerMeterNumber');
const obtenerConsumo = require('./services/obtenerConsumo');
const obtenerESIDWithOncor = require('./services/obtenerESIDOncor')
const obtenerESIDWhithElectricityPlans = require('./services/obtenerESIDWhithElectricityPlans')
const { getBookedAppointmentsDates } = require('./services/userAvailabilityInRepcard')
const { getProposalAuroraLightreach } = require('./services/proposalRequest')
const clearUsagesInSMT = require('./services/clearUsages')
const obtenerKpiReport = require('./services/kpiReportBrightFuture')
const obtenerDisenioSubContractor = require('./services/subcontractorhub')

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
// Redirigir 'downloads' a 'public/downloads'
app.use('/downloads', express.static(path.join(__dirname, '..', 'public', 'downloads')));

app.get('/', async (req, res) => {
  res.json({ success: true, msg: "Hello from energybot365 🚀" });
})


//Este endpoint buscara por address
app.post('/obtener-informacion', async (req, res) => {
  const { address, energy_provider, type } = req.body;
  if (!address) return res.status(400).json({ error: 'Dirección requerida' });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
    defaultViewport: null,
    slowMo: 20, // Delay base
    //args: ['--start-maximized'],
  });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, meterNumber, meterTotal, consumo, energyProvider, addressObtained, uniqueDescription;

  try {
    // Primer intento: obtener ESID
    try {
      esid = await obtenerESID(address, browser);
      console.log(esid)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerESID', error: error.message });
    }

    // Segundo intento: obtener Meter Number
    try {
      const meterNumberData = await obtenerMeterNumber(esid, browser);
      meterNumber = meterNumberData.meterNumber
      addressObtained = meterNumberData.address
      console.log(meterNumber)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerMeterNumber', error: error.message });
    }

    try {
      const consumoData = await obtenerConsumo(esid, meterNumber, browser, energy_provider, type);
      consumo = consumoData?.consumo
      energyProvider = consumoData?.energyProvider
      uniqueDescription = consumoData?.uniqueDescription
      meterTotal = consumoData?.meterTotal || 0
      clearUsagesInSMT(uniqueDescription)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber, consumo, energyProvider, addressObtained, meterTotal });

  } catch (error) {
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }
});

app.post('/obtener-informacion/texas-new-mexico', async (req, res) => {
  const { address, energy_provider, type } = req.body;
  let { meter_number } = req.body; // Cambiado a let
  if (!address) return res.status(400).json({ error: 'Dirección requerida' });
  // Validar y limpiar meter_number
  if (!meter_number || !/^\d{9}/.test(meter_number)) {
    return res.status(400).json({ error: 'The meter number must have 9 digits.' });
  }

  // Limpiar cualquier texto adicional después de los 9 dígitos
  meter_number = meter_number.substring(0, 9);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1920,1080', '--disable-http2'],
    //defaultViewport: null,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    slowMo: 20, // Delay base
    //args: ['--start-maximized'],
  });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, consumo, energyProvider, meterTotal, uniqueDescription;

  try {
    // Primer intento: obtener ESID
    try {
      esid = await obtenerESIDWhithElectricityPlans(address, browser);
      console.log(esid)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerESID', error: error.message });
    }

    try {
      const consumoData = await obtenerConsumo(esid, meter_number, browser, energy_provider, type);
      consumo = consumoData?.consumo
      energyProvider = consumoData?.energyProvider
      uniqueDescription = consumoData?.uniqueDescription
      meterTotal = consumoData?.meterTotal || 0
      clearUsagesInSMT(uniqueDescription)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber: meter_number, consumo, energyProvider, addressObtained: address, meterTotal });
    //res.json({ success: true, esid })
  } catch (error) {
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }
});

//Este endpoint buscara por Meter Number
app.post('/obtener-informacion/meter_number', async (req, res) => {
  const { meter_number, energy_provider, type } = req.body;
  if (!meter_number) return res.status(400).json({ error: 'Meter Number requerida' });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
    defaultViewport: null,
    slowMo: 20, // Delay base
    //args: ['--start-maximized'],
  });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, meterNumber, meterTotal, consumo, energyProvider, addressObtained, uniqueDescription;

  try {
    // Segundo intento: obtener Meter Number
    try {
      // Asegurarse de que termine en 'LG'
      meterNumber = meter_number.replace(/\s+/g, '');
      meterNumber = meterNumber.endsWith('LG') ? meterNumber : `${meterNumber}LG`;
      esidData = await obtenerESIDWithOncor(meterNumber, browser);
      esid = esidData.esIID
      esid = `1044372000${esid}`
      addressObtained = esidData.address

    } catch (error) {
      return res.status(400).json({ success: false, step: 'obtenerESIDWithOncor', error: error.message });
    }

    try {
      const consumoData = await obtenerConsumo(esid, meterNumber, browser, energy_provider, type);
      consumo = consumoData?.consumo
      energyProvider = consumoData?.energyProvider
      uniqueDescription = consumoData?.uniqueDescription
      meterTotal = consumoData?.meterTotal || 0
      clearUsagesInSMT(uniqueDescription)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber, consumo, energyProvider, addressObtained, meterTotal });

  } catch (error) {
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }
});

app.post('/disponibilidad-de-usuarios-en-repcard', async (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: 'User requerido' });

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 50, // Delay base
    args: ['--no-sandbox', '--disable-http2', '--window-size=1920,1080', '--timezone=America/Chicago'],
    //defaultViewport: null,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    //args: ['--start-maximized', '--timezone=America/Chicago'],
  });

  try {
    let data = await getBookedAppointmentsDates(user, browser);
    // Si todo bien, responder
    res.json({ success: true, data });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }

})

app.post('/proposal/aurora/lightreach', async (req, res) => {
  let { customer_name, address, annual_energy_estimate, } = req.body;
  if (!address || !annual_energy_estimate) return res.status(400).json({ error: 'Address or annual_energy_estimate is required' });

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 50, // Delay base
    args: ['--no-sandbox', '--window-size=1920,1080', '--disable-http2'],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    //args: ['--start-maximized'],
  });

  try {
    customer_name = customer_name ? customer_name : `Proposal-${Date.now()}`
    let data = await getProposalAuroraLightreach(customer_name, address, annual_energy_estimate, browser);
    // Si todo bien, responder
    res.json({ success: true, data });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de proposal' });
  } finally {
    await browser.close();
  }
})

app.post('/kpi-report', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50, // Delay base
    //args: ['--no-sandbox', '--window-size=1920,1080', '--disable-http2'],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ['--start-maximized'],
  });

  try {
    let data = await obtenerKpiReport(browser);
    res.json({ success: true, data });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención del reporte' });
  } finally {
    await browser.close();
  }
})


app.post('/design', async (req, res) => {
   let { address, first_name, last_name, email, phone } = req.body
   const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50, // Delay base
    //args: ['--no-sandbox', '--window-size=1920,1080', '--disable-http2'],
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  try {
    let data = await obtenerDisenioSubContractor(browser, address, first_name, last_name, email, phone);
    res.json({ success: true, data });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención del reporte' });
  } finally {
    await browser.close();
  }
})

/**Aqui ejecutaremos la funcion que limpiara todos los Usos que se han obtenido */
// cron.schedule('*/10 * * * *', async () => {
//   try {
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ['--no-sandbox', '--disable-http2'],
//       defaultViewport: null,
//       //args: ['--start-maximized'],
//     });
//     await clearUsagesInSMT(browser);
//     await browser.close();
//   } catch (error) {
//     console.error('Error en la tarea programada:', error);
//   }
// });


// 👉 Cambiamos app.listen por createServer
const server = http.createServer(app);

// 👉 Establecemos timeout a 10 minutos (600000 ms)
server.timeout = 600000;

server.listen(PORT, () => console.log(`Bot server running on port ${PORT}`));
