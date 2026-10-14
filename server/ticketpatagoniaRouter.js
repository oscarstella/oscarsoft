const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'bbddPirulo1771',
  database: 'ticketpatagonia_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Seed events if table is empty
async function ensureSeedEvents() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM events WHERE status != "deleted"');
    if (rows[0].count === 0) {
      console.log('[Ticket Patagonia] Seeding events from local events.json into MariaDB...');
      const jsonPaths = [
        path.join(__dirname, '../ticketpatagonia/dist/data/events.json'),
        path.join(__dirname, '../../entradasBAri/src/data/events.json'),
        path.join(__dirname, '../ticketpatagonia/events.json'),
        path.join(__dirname, 'events.json')
      ];

      let rawData = null;
      for (const p of jsonPaths) {
        if (fs.existsSync(p)) {
          rawData = fs.readFileSync(p, 'utf8');
          break;
        }
      }

      if (rawData) {
        const events = JSON.parse(rawData);
        for (const ev of events) {
          const ext = (ev.small_front_page || ev.front_page || '').endsWith('.png') ? '.png' : '.jpg';
          const localImg = `/ticketpatagonia/img/event_${ev.id}${ext}`;
          const finalImg = ev.small_front_page || ev.front_page || localImg;

          const dateStr = ev.event_dates?.[0]?.start_date || ev.event_dates?.[0]?.date || '2026-10-24 23:00:00';
          const timeStr = ev.event_dates?.[0]?.time_start || '23:00';
          const cat = ev.categories?.[0]?.label || 'Boliche';

          await pool.query(
            `INSERT INTO events (
              id, title, slug, province, city, place, street, street_number,
              age_restriction, cheapest_price, category, event_date, time_start,
              front_page, small_front_page, description, status, tickets_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE title=VALUES(title)`,
            [
              ev.id,
              ev.title,
              ev.slug || '',
              ev.province || 'Buenos Aires',
              ev.city || 'Buenos Aires',
              ev.place || '',
              ev.street || '',
              ev.street_number || '',
              ev.age_restriction || '+18',
              ev.cheapest_price || 0,
              cat,
              dateStr,
              timeStr,
              finalImg,
              localImg,
              ev.description || '',
              'active',
              JSON.stringify(ev.tickets || [])
            ]
          );
        }
        console.log('[Ticket Patagonia] Seeding completed successfully!');
      }
    }
  } catch (err) {
    console.error('[Ticket Patagonia] Seed check error:', err.message);
  }
}

// Auto-seed on startup
setTimeout(ensureSeedEvents, 1000);

// ==========================================
// 1. PUBLIC: GET ALL EVENTS
// ==========================================
router.get('/events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events WHERE status != "deleted" ORDER BY event_date ASC');
    
    // Transform rows to match client schema
    const formatted = rows.map((r) => {
      let tickets = [];
      try {
        tickets = typeof r.tickets_json === 'string' ? JSON.parse(r.tickets_json) : (r.tickets_json || []);
      } catch (e) {
        tickets = [];
      }

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        province: r.province,
        city: r.city,
        place: r.place,
        street: r.street,
        street_number: r.street_number,
        age_restriction: r.age_restriction,
        cheapest_price: r.cheapest_price,
        categories: [{ value: 1, label: r.category }],
        front_page: r.front_page,
        small_front_page: r.small_front_page,
        description: r.description,
        status: r.status,
        event_dates: [
          {
            id: r.id,
            date: r.event_date ? r.event_date.split(' ')[0] : '2026-10-24',
            start_date: r.event_date,
            time_start: r.time_start || '23:00'
          }
        ],
        tickets: tickets
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error al obtener eventos de la base de datos', details: err.message });
  }
});

// ==========================================
// 2. PUBLIC: CREATE ORDER (BUY TICKETS)
// ==========================================
router.post('/orders', async (req, res) => {
  try {
    const { event, tickets, subtotal, serviceFee, grandTotal, buyerName, buyerDni, buyerEmail } = req.body;

    if (!buyerName || !buyerDni || !tickets || tickets.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para procesar la compra' });
    }

    const orderId = 'TP-' + Math.floor(100000 + Math.random() * 900000);
    const qrCode = `TICKETPATAGONIA:${orderId}:${buyerDni}:${Date.now()}`;
    const totalTickets = tickets.reduce((sum, t) => sum + (t.quantity || 1), 0);

    await pool.query(
      `INSERT INTO orders (
        id, event_id, event_title, buyer_name, buyer_email, buyer_dni,
        total_tickets, subtotal, service_fee, grand_total, tickets_json, qr_code, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        event?.id || 0,
        event?.title || 'Evento Ticket Patagonia',
        buyerName,
        buyerEmail || 'usuario@ticketpatagonia.com',
        buyerDni,
        totalTickets,
        subtotal || 0,
        serviceFee || 0,
        grandTotal || 0,
        JSON.stringify(tickets),
        qrCode,
        'paid'
      ]
    );

    res.json({
      success: true,
      orderId,
      qrCode,
      message: '¡Orden creada exitosamente!'
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Error al registrar orden en la base de datos', details: err.message });
  }
});

// ==========================================
// 3. ADMIN: LOGIN & VALIDATION (osacrns@gmail)
// ==========================================
router.post('/admin/login', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check if matches osacrns@gmail or osacrns@gmail.com
    const isAllowed = cleanEmail.includes('osacrns@gmail') || cleanEmail.includes('oscar');

    if (!isAllowed) {
      return res.status(401).json({ error: 'Acceso no autorizado. Este panel está reservado para osacrns@gmail' });
    }

    res.json({
      success: true,
      user: {
        email: cleanEmail,
        role: 'superadmin'
      },
      token: 'tp_admin_token_' + Buffer.from(cleanEmail).toString('base64')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ADMIN: GET ALL ORDERS
// ==========================================
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200');
    const formatted = rows.map((r) => {
      let tickets = [];
      try {
        tickets = typeof r.tickets_json === 'string' ? JSON.parse(r.tickets_json) : (r.tickets_json || []);
      } catch (e) {
        tickets = [];
      }
      return {
        ...r,
        tickets
      };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ADMIN: VERIFY TICKET (SCANNER)
// ==========================================
router.post('/orders/verify', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código de ticket no proporcionado' });

    let orderId = code.trim();
    if (orderId.includes(':')) {
      const parts = orderId.split(':');
      orderId = parts[1] || parts[0];
    }

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? OR qr_code = ?', [orderId, code.trim()]);
    if (rows.length === 0) {
      return res.json({
        valid: false,
        status: 'not_found',
        message: 'Ticket no encontrado o inválido.'
      });
    }

    const order = rows[0];
    if (order.status === 'used') {
      return res.json({
        valid: false,
        status: 'already_used',
        order,
        message: `¡ALERTA! Entrada YA UTILIZADA el ${new Date(order.used_at).toLocaleString('es-AR')}`
      });
    }

    // Mark as used
    await pool.query('UPDATE orders SET status = "used", used_at = NOW() WHERE id = ?', [order.id]);

    res.json({
      valid: true,
      status: 'success',
      order: {
        ...order,
        status: 'used',
        used_at: new Date()
      },
      message: '¡ENTRADA VÁLIDA! Ingreso autorizado.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ADMIN CRUD: CREATE EVENT
// ==========================================
router.post('/events', async (req, res) => {
  try {
    const ev = req.body;
    if (!ev.title) {
      return res.status(400).json({ error: 'El título del evento es obligatorio' });
    }

    const ext = (ev.small_front_page || ev.front_page || '').endsWith('.png') ? '.png' : '.jpg';
    const localImg = ev.front_page ? ev.front_page : `/ticketpatagonia/img/event_${Date.now()}${ext}`;

    const [result] = await pool.query(
      `INSERT INTO events (
        title, slug, province, city, place, street, street_number,
        age_restriction, cheapest_price, category, event_date, time_start,
        front_page, small_front_page, description, status, tickets_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ev.title,
        ev.slug || ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        ev.province || 'Capital Federal',
        ev.city || 'Buenos Aires',
        ev.place || '',
        ev.street || '',
        ev.street_number || '',
        ev.age_restriction || '+18',
        ev.cheapest_price || 0,
        ev.category || 'Boliche',
        ev.event_date || '2026-10-24 23:00:00',
        ev.time_start || '23:00',
        ev.front_page || localImg,
        ev.small_front_page || localImg,
        ev.description || '',
        'active',
        JSON.stringify(ev.tickets || [{ id: 1, name: 'General - Preventa 1', price: ev.cheapest_price || 5000 }])
      ]
    );

    res.json({
      success: true,
      id: result.insertId,
      message: 'Evento creado exitosamente en la base de datos'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. ADMIN CRUD: UPDATE EVENT
// ==========================================
router.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ev = req.body;

    await pool.query(
      `UPDATE events SET
        title = ?,
        province = ?,
        city = ?,
        place = ?,
        category = ?,
        cheapest_price = ?,
        event_date = ?,
        time_start = ?,
        front_page = ?,
        description = ?,
        tickets_json = ?
      WHERE id = ?`,
      [
        ev.title,
        ev.province || 'Capital Federal',
        ev.city || 'Buenos Aires',
        ev.place || '',
        ev.category || 'Boliche',
        ev.cheapest_price || 0,
        ev.event_date || '2026-10-24 23:00:00',
        ev.time_start || '23:00',
        ev.front_page || ev.small_front_page,
        ev.description || '',
        JSON.stringify(ev.tickets || []),
        id
      ]
    );

    res.json({ success: true, message: 'Evento actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. ADMIN CRUD: DELETE EVENT
// ==========================================
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE events SET status = "deleted" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. ADMIN: DASHBOARD STATS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const [eventsCount] = await pool.query('SELECT COUNT(*) as total FROM events WHERE status != "deleted"');
    const [ordersStats] = await pool.query('SELECT COUNT(*) as totalOrders, SUM(total_tickets) as totalTickets, SUM(grand_total) as totalRevenue, SUM(service_fee) as totalServiceFees FROM orders');

    res.json({
      totalEvents: eventsCount[0].total,
      totalOrders: ordersStats[0].totalOrders || 0,
      totalTickets: ordersStats[0].totalTickets || 0,
      totalRevenue: ordersStats[0].totalRevenue || 0,
      totalServiceFees: ordersStats[0].totalServiceFees || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
