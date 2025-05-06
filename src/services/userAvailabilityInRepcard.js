const axios = require('axios');
const { REPCARD_USER, REPCARD_PASSWORD, REPCARD_API_KEY } = require('../utils/config');

async function getBookedAppointmentsDates(user, browser) {
    const page = await browser.newPage();
    // Configura la zona horaria a nivel de página
    await page.emulateTimezone('America/Chicago');
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    await page.goto('https://app.repcard.com/admin/login', { waitUntil: 'networkidle2' });

    // Login
    await page.type('input[name="email"]', REPCARD_USER);
    await page.type('input[name="password"]', REPCARD_PASSWORD);
    await page.click('button.btn.btn-primary.btn-block');

    // Ir a la sección de Appointments
    await page.waitForSelector('ul.sidebar-menu a[href*="appointments"]', { timeout: 15000 });
    await page.click('ul.sidebar-menu a[href*="appointments"]');

    // Esperar y hacer clic en el botón de "Appointments" de la vista de tabs
    await page.waitForSelector('#create-appointmentbtn', { timeout: 15000 });
    await page.click('#create-appointmentbtn');

    //Esperamos el selector de All Appointments
    await page.waitForSelector('#dropdownMenu1');
    await page.click('#dropdownMenu1');

    await page.waitForSelector('a[data-value="ALL_APPOINTMENTS"]');
    await page.click('a[data-value="ALL_APPOINTMENTS"]');

    // Esperar dropdown de filtros por día y seleccionar "Day"
    await page.waitForSelector('#custom-day-filter', { timeout: 15000 });
    await page.click('#custom-day-filter');

    // Click en la opción "Day"
    await page.waitForSelector('li a[data-value="Today"]', { timeout: 15000 });
    await page.click('li a[data-value="Today"]');

    // 🔹 Esperar a que los elementos `.appointment-data` existan antes de intentar extraer información
    await page.waitForSelector('li.appointment-data', { timeout: 15000 });

    // Realizamos el scroll infinito para cargar todos los registros
    let previousHeight;
    while (true) {
        // Guardar la altura actual
        previousHeight = await page.evaluate('document.body.scrollHeight');

        // Hacer scroll hacia abajo
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

        // Esperar que cargue el contenido
        await new Promise(resolve => setTimeout(resolve, 2000)); // ✅ Correcto

        // Si la altura de la página no ha cambiado, significa que ya no hay más contenido cargado
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) {
            break;
        }
    }

    // Ahora que hemos hecho scroll hasta el final, obtenemos las citas
    const citas = await page.$$eval('li.appointment-data', elements =>
        elements.map(el => {
            const hora = el.querySelector('.i-clock + span')?.textContent?.trim() || '';
            const contacto = el.querySelector('.i-person-filled + span')?.textContent?.trim() || '';
            const closer =
                el.querySelector('[id^="appointment-closer-name-"] span')?.textContent?.trim() ||
                el.querySelector('[id^="appointment-closer-name-"]')?.textContent?.trim() ||
                el.querySelector('.open-sidebar-edit-appointment span')?.textContent?.trim() ||
                '';
            return [hora, contacto, closer];
        })
    );

    const repAppointments = citas.filter(app => app[2] == user);

    // 1. Hacer clic en "Create Appointment"
    await page.waitForSelector('#openCalendarType', { visible: true });
    await page.click('#openCalendarType');
    await page.waitForSelector('li.open-sidebar-create-appointment', { visible: true });
    // 2. Seleccionar el calendario "Team Calendar"
    await page.evaluate(() => {
        const calendars = Array.from(document.querySelectorAll('li.open-sidebar-create-appointment'));
        const teamCalendar = calendars.find(cal => cal.textContent?.includes('Team Calendar'));
        if (teamCalendar instanceof HTMLElement) {
            teamCalendar.click();
        }
    });
    await page.waitForSelector('#upperCreateCloserMenu', { visible: true });

    // 3. Abrir el dropdown para seleccionar el closer
    await page.click('#upperCreateCloserMenu');
    await page.waitForSelector('#create-appointment-closer-dropdown-list-name-only', { visible: true });

    // 4. Seleccionar al closer correspondiente al usuario filtrado
    await page.evaluate((closerName) => {
        const lis = document.querySelectorAll('li.book-closer');
        for (const li of lis) {
            const name = li.getAttribute('user-name')?.trim();
            if (name === closerName) {
                if (li instanceof HTMLElement) {
                    li.click();
                    break;
                }
            }
        }
    }, user); // `user` debe ser el nombre del closer (por ejemplo: "Erick Sanchez")


    // 5. Hacer clic en el selector de fecha para abrir el calendario
    await page.click('.pos-rel.dsp-flex.algn-cntr');

    // 6. Esperar a que el calendario se muestre
    await page.waitForSelector('.ui-datepicker-calendar');

    // 7. Hacer clic en el día actual (que tiene la clase ui-datepicker-today)
    await page.evaluate(() => {
        // Buscar todas las celdas de día que no estén deshabilitadas
        const availableDays = document.querySelectorAll('.ui-datepicker-calendar td:not(.ui-state-disabled) a, .ui-datepicker-calendar td a:not([aria-disabled="true"])');
        
        // Si hay días disponibles, hacer clic en el primero
        if (availableDays.length > 0) {
          availableDays[0].click();
          return true;
        }
        return false;
    });

    // 9. Hacer clic en el selector de tiempo para abrir el dropdown
    await page.click('#SelectTimeSidebar');

    // 10. Esperar a que el dropdown de horarios se muestre
    await page.waitForSelector('.dropdown-menu.custom-scroll');

    // 11. Extraer todas las horas disponibles
    const availableHours = await page.evaluate(() => {
        const availableSlots = [];
        const timeSlots = document.querySelectorAll('.dropdown-list-items.select-time');

        for (const slot of timeSlots) {
            // Verificar si el slot está disponible (tiene la clase "active-app" y el texto "Available")
            const availableText = slot.querySelector('.fs10px.font-r.active-app');
            if (availableText && availableText.textContent.trim() === 'Available') {
                // Obtener la hora del slot
                const timeElement = slot.querySelector('.fs-12px');
                if (timeElement) {
                    availableSlots.push(timeElement.textContent.trim());
                }
            }
        }

        return availableSlots;
    });

    // Esperar que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 2000)); // ✅ Correcto
    return { busy: repAppointments, available: availableHours};
}



/**Funcion para obtener los usuarios de Repcard */
async function getRepCardUsers() {
    try {
        const response = await axios.get('https://app.repcard.com/api/users/minimal', {
            headers: {
                'x-api-key': REPCARD_API_KEY,
            },
        });

        if (response.data && response.data.result && Array.isArray(response.data.result.data)) {
            return response.data.result.data;
        } else {
            throw new Error('Invalid response format from Repcard API');
        }

    } catch (error) {
        console.error('Error fetching Repcard users:', error.message);
        throw new Error('Failed to fetch users from Repcard API');
    }
}

/**Funcion que podria funcionar en cualquier momento para obtener horarios disponibles */
async function getAvailabilityForCloser(appointmentsArray, repName) {
    const startHour = 7; // 7:00 AM
    const endHour = 23;  // 11:00 PM (último bloque empieza 11:15 PM)
    const interval = 30; // minutos
    const totalBlocks = ((endHour - startHour + 1) * 60) / interval;

    const timeToMinutes = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const minutesToTime = (mins) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours % 12 || 12;
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Filtrar citas del rep
    const repAppointments = appointmentsArray.filter(app => app[2] === repName);

    // Extraer y normalizar horas ocupadas
    const occupiedSlots = repAppointments.map(app => timeToMinutes(app[0]));

    // Generar todos los posibles bloques de tiempo
    const allSlots = [];
    for (let i = 0; i < totalBlocks; i++) {
        const slotStart = startHour * 60 + i * interval;
        if (slotStart > 23 * 60 + 45) break;
        allSlots.push(slotStart);
    }

    const availableSlots = allSlots.filter(slotStart => {
        // Verifica si alguna cita está dentro del bloque de 30 minutos
        const slotEnd = slotStart + interval;
        return !occupiedSlots.some(occupied =>
            occupied >= slotStart && occupied < slotEnd
        );
    });
    return {
        rep: repName,
        occupied: repAppointments.map(([hora, contacto]) => ({ time: hora, with: contacto })),
        available: availableSlots.map(minutesToTime)
    };
}



module.exports = { getBookedAppointmentsDates };