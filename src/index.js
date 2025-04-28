const express = require('express');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const obtenerESID = require('./services/obtenerESID');
const obtenerMeterNumber = require('./services/obtenerMeterNumber');
const obtenerConsumo = require('./services/obtenerConsumo');
const obtenerESIDWithOncor = require('./services/obtenerESIDOncor')
const { getBookedAppointmentsDates } = require('./services/userAvailabilityInRepcard')
const clearUsagesInSMT = require('./services/clearUsages')

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
  const { address, energy_provider } = req.body;
  if (!address) return res.status(400).json({ error: 'Dirección requerida' });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
    defaultViewport: null,
    slowMo: 20, // Delay base
    //args: ['--start-maximized'],
  });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, meterNumber, consumo, energyProvider, addressObtained, uniqueDescription;

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
      const consumoData = await obtenerConsumo(esid, meterNumber, browser, energy_provider);
      consumo = consumoData?.consumo
      energyProvider = consumoData?.energyProvider
      uniqueDescription = consumoData?.uniqueDescription
      clearUsagesInSMT(uniqueDescription)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber, consumo, energyProvider, addressObtained });

  } catch (error) {
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }
});

//Este endpoint buscara por Meter Number
app.post('/obtener-informacion/meter_number', async (req, res) => {
  const { meter_number, energy_provider } = req.body;
  if (!meter_number) return res.status(400).json({ error: 'Meter Number requerida' });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
    defaultViewport: null,
    slowMo: 20, // Delay base
    //args: ['--start-maximized'],
  });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, meterNumber, consumo, energyProvider, addressObtained, uniqueDescription;

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
      const consumoData = await obtenerConsumo(esid, meterNumber, browser, energy_provider);
      consumo = consumoData?.consumo
      energyProvider = consumoData?.energyProvider
      uniqueDescription = consumoData?.uniqueDescription
      clearUsagesInSMT(uniqueDescription)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber, consumo, energyProvider, addressObtained });

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
    args: ['--no-sandbox', '--disable-http2', '--timezone=America/Chicago'],
    defaultViewport: null,
    //args: ['--start-maximized', '--timezone=America/Chicago'],
  });

  try {
    let data = await getBookedAppointmentsDates(user, browser);
    // Si todo bien, responder
    res.json({ success: true, data});
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
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
