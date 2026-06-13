const sql = require('mssql');

async function generateTicketNumber(transactionOrRequest) {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Buscar el número de ticket correlativo máximo de hoy
  const query = `
    SELECT MAX(nro_ticket) as max_ticket 
    FROM comanda_cab 
    WHERE nro_ticket LIKE 'TKT-' + @today + '-%'
  `;
  
  const result = await transactionOrRequest
    .input('today', sql.VarChar, todayStr)
    .query(query);

  let nextSeq = 1;
  if (result.recordset[0] && result.recordset[0].max_ticket) {
    const lastTicket = result.recordset[0].max_ticket;
    const parts = lastTicket.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  const seqStr = String(nextSeq).padStart(4, '0');
  return `TKT-${todayStr}-${seqStr}`;
}

module.exports = {
  generateTicketNumber
};
