const express = require('express');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');
const obtenerESID = require('./services/obtenerESID');
const obtenerMeterNumber = require('./services/obtenerMeterNumber');
const obtenerConsumo = require('./services/obtenerConsumo');
const obtenerESIDWithOncor = require('./services/obtenerESIDOncor')

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
// Redirigir 'downloads' a 'public/downloads'
app.use('/downloads', express.static(path.join(__dirname, '..', 'public', 'downloads')));

//Este endpoint buscara por address
app.post('/obtener-informacion', async (req, res) => {
  const { address, energy_provider } = req.body;
  if (!address) return res.status(400).json({ error: 'Dirección requerida' });

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
    defaultViewport: null,
    //args: ['--start-maximized'],
   });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, meterNumber;

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
      meterNumber = await obtenerMeterNumber(esid, browser);
      console.log(meterNumber)
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerMeterNumber', error: error.message });
    }

    try {
      consumo = await obtenerConsumo(esid, meterNumber, browser, energy_provider);
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber, consumo });

  } catch (error) {
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }
});

//Este endpoint buscara por Meter Number

app.post('/obtener-informacion/meter_number', async (req, res) => {
  const { meter_number, energy_provider  } = req.body;
  if (!meter_number) return res.status(400).json({ error: 'Meter Number requerida' });

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
    defaultViewport: null,
    //args: ['--start-maximized'],
   });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  let esid, meterNumber;

  try {
    // Segundo intento: obtener Meter Number
    try {
      meterNumber = `${meter_number}LG`
      esid = await obtenerESIDWithOncor(meterNumber, browser);
      esid = `1044372000${esid}`

    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerESIDWithOncor', error: error.message });
    }

    try {
      consumo = await obtenerConsumo(esid, meterNumber, browser, energy_provider);
    } catch (error) {
      return res.status(500).json({ success: false, step: 'obtenerConsumo', error: error.message });
    }

    // Si todo bien, responder
    res.json({ success: true, esid, meterNumber, consumo });

  } catch (error) {
    res.status(500).json({ success: false, step: 'inesperado', error: 'Error en la obtención de información' });
  } finally {
    await browser.close();
  }
});


app.get('/', async (req, res) => {
  res.json({ success: true, msg: "Hello from energybot365 🚀" });
})


// 👉 Cambiamos app.listen por createServer
const server = http.createServer(app);

// 👉 Establecemos timeout a 10 minutos (600000 ms)
server.timeout = 600000;

server.listen(PORT, () => console.log(`Bot server running on port ${PORT}`));
