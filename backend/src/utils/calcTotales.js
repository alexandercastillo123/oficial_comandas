function calcTotales(items) {
  let total = 0;
  items.forEach(item => {
    const cantidad = parseFloat(item.cantidad || 0);
    const precio = parseFloat(item.precio_unitario || item.precio_mesa || 0);
    const descuento = parseFloat(item.descuento || 0);
    total += (cantidad * precio) - descuento;
  });

  // En Perú el precio de venta al público ya incluye IGV (18%)
  const subtotal = total / 1.18;
  const igv = total - subtotal;

  return {
    total: parseFloat(total.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    igv: parseFloat(igv.toFixed(2))
  };
}

module.exports = calcTotales;
