const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDFS_DIR = path.join(__dirname, '..', '..', 'pdfs');
const COCINA_DIR = path.join(PDFS_DIR, 'pedido-cocina');
const PRECUENTA_DIR = path.join(PDFS_DIR, 'pre-cuenta');

// Asegurar directorios
fs.mkdirSync(COCINA_DIR, { recursive: true });
fs.mkdirSync(PRECUENTA_DIR, { recursive: true });

/**
 * Formatea una fecha a string legible local
 */
function formatearFecha(dateInput) {
  let ms;
  if (dateInput instanceof Date) {
    ms = dateInput.getTime();
  } else {
    const match = String(dateInput).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, day, h, min, s] = match;
      ms = new Date(Number(y), Number(m) - 1, Number(day), Number(h), Number(min), Number(s)).getTime();
    } else {
      ms = new Date(dateInput).getTime();
    }
  }
  const d = new Date(ms);

  return d.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Genera PDF de Ticket de Cocina
 */
async function generarTicketCocina(comanda) {
  const fileName = `ticket-cocina-${comanda.id_comanda_cab}-${comanda.nro_ticket}.pdf`;
  const filePath = path.join(COCINA_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [226.77, 400 + (comanda.items.length * 35)], // 80mm de ancho, alto adaptativo
      margins: { top: 12, bottom: 12, left: 12, right: 12 }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(12).font('Helvetica-Bold').text('DELEITE S.A.C.', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('TICKET DE COCINA', { align: 'center' });
    doc.moveDown(0.3);

    // Divisor
    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.moveDown(0.3);

    // Detalles del Ticket
    doc.fontSize(8)
      .font('Helvetica-Bold').text('TICKET: ').font('Helvetica').text(comanda.nro_ticket, { continued: false })
      .font('Helvetica-Bold').text('MESA: ').font('Helvetica').text(comanda.numero_mesa || comanda.id_mesa, { continued: false })
      .font('Helvetica-Bold').text('FECHA: ').font('Helvetica').text(formatearFecha(comanda.fecha_creacion), { continued: false })
      .font('Helvetica-Bold').text('MOZO: ').font('Helvetica').text(comanda.mozo || 'N/A', { continued: false });

    if (comanda.nombre_cliente) {
      doc.font('Helvetica-Bold').text('CLIENTE: ').font('Helvetica').text(comanda.nombre_cliente);
    }
    doc.moveDown(0.3);

    // Divisor
    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.moveDown(0.3);

    // Lista de items
    doc.fontSize(9).font('Helvetica-Bold').text('CANT  PRODUCTO', { align: 'left' });
    doc.moveDown(0.2);

    comanda.items.forEach(item => {
      // Cantidad alineada y nombre
      doc.fontSize(9)
        .font('Helvetica-Bold').text(`${parseFloat(item.cantidad)}`, { continued: true })
        .font('Helvetica').text(`    ${item.nombre_producto}`);
      
      if (item.observacion_item) {
        doc.fontSize(8).font('Helvetica-Oblique').text(`  * Nota: ${item.observacion_item}`, { indent: 15 });
      }
      doc.moveDown(0.2);
    });

    doc.moveDown(0.3);
    
    // Observación General
    if (comanda.observacion) {
      doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
      doc.fontSize(8).font('Helvetica-Bold').text('Nota General:');
      doc.font('Helvetica').text(comanda.observacion);
      doc.moveDown(0.3);
    }

    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.fontSize(8).font('Helvetica-Oblique').text('Fin del Pedido', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Genera PDF de Pre-Cuenta
 */
async function generarPreCuenta(comanda) {
  const fileName = `pre-cuenta-${comanda.id_comanda_cab}-${comanda.nro_ticket}.pdf`;
  const filePath = path.join(PRECUENTA_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [226.77, 450 + (comanda.items.length * 35)], // 80mm de ancho, alto adaptativo
      margins: { top: 12, bottom: 12, left: 12, right: 12 }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(12).font('Helvetica-Bold').text('DELEITE S.A.C.', { align: 'center' });
    doc.fontSize(9).font('Helvetica').text('Panadería y Pastelería', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('PRE-CUENTA DE CONSUMO', { align: 'center' });
    doc.moveDown(0.3);

    // Divisor
    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.moveDown(0.3);

    // Detalles
    doc.fontSize(8)
      .font('Helvetica-Bold').text('TICKET: ').font('Helvetica').text(comanda.nro_ticket)
      .font('Helvetica-Bold').text('MESA: ').font('Helvetica').text(comanda.numero_mesa || comanda.id_mesa)
      .font('Helvetica-Bold').text('FECHA: ').font('Helvetica').text(formatearFecha(comanda.fecha_creacion || new Date()))
      .font('Helvetica-Bold').text('MOZO: ').font('Helvetica').text(comanda.mozo || 'N/A');

    if (comanda.nombre_cliente) {
      doc.font('Helvetica-Bold').text('CLIENTE: ').font('Helvetica').text(comanda.nombre_cliente);
    }
    doc.moveDown(0.3);

    // Divisor
    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.moveDown(0.3);

    // Items
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('CANT  PRODUCTO          P.UNIT    TOTAL');
    doc.moveDown(0.2);

    comanda.items.forEach(item => {
      const cant = parseFloat(item.cantidad);
      const unit = parseFloat(item.precio_unitario).toFixed(2);
      const tot = parseFloat(item.subtotal).toFixed(2);
      const name = item.nombre_producto.substring(0, 18).padEnd(18, ' ');

      doc.fontSize(8).font('Helvetica')
        .text(`${cant}   ${name} S/. ${unit}  S/. ${tot}`);
      doc.moveDown(0.1);
    });

    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.moveDown(0.3);

    // Totales
    const sub = parseFloat(comanda.subtotal).toFixed(2);
    const igv = parseFloat(comanda.igv).toFixed(2);
    const tot = parseFloat(comanda.total).toFixed(2);

    doc.fontSize(9)
      .font('Helvetica-Bold').text(`SUBTOTAL: S/. ${sub}`, { align: 'right' })
      .text(`IGV (18%): S/. ${igv}`, { align: 'right' })
      .fontSize(10).text(`TOTAL A PAGAR: S/. ${tot}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica').text('----------------------------------------------------------------------', { align: 'center' });
    doc.fontSize(8).font('Helvetica-Oblique').text('Gracias por su preferencia', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = {
  generarTicketCocina,
  generarPreCuenta
};
