const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const obtenerESID = require('./services/obtenerESID');
const obtenerMeterNumber = require('./services/obtenerMeterNumber');
const obtenerConsumo = require('./services/obtenerConsumo');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
// Redirigir 'downloads' a 'public/downloads'
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));

app.post('/obtener-informacion', async (req, res) => {
  const { address } = req.body;
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
      consumo = await obtenerConsumo(esid, meterNumber, browser);
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


app.listen(PORT, () => console.log(`Bot server running on port ${PORT}`));
