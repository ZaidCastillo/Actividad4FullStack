const { ProductosRepository } = require('../repositories/productos.repository');

const repo = new ProductosRepository();

async function getAll(req, res) {
  const productos = await repo.getAll();
  console.log(productos)
  return res.json(productos)
}

async function getAllVisible(req, res) {
  const productos = await repo.getAllActive()
  return res.json(productos)
}

async function getById(req, res) {
  const id = Number(req.params.id)
  const producto = await repo.getById(id)

  if (!producto) {
    return res.status(404).json({error: 'Producto no encontrado'})
  }

  return res.json(producto)
}

async function create(req, res) {
  const { nombre, precio } = req.body;

  if (!nombre || typeof nombre !== 'string') {
    return res.status(400).json({error: 'Nombre inválido'})
  }

  const precioNumber = Number(precio);
  if (precio <= 0) {
    return res.status(400).json({error: 'Precio inválido'})
  }

  const nuevo = await repo.create(nombre, precioNumber)
  return res.status(201).json(nuevo)
}

async function update(req, res) {
  const id = Number(req.params.id);
  const {nombre, precio} = req.body;
  const payload = {
    nombre: nombre!== undefined ? nombre : undefined,
    precio: precio !== undefined ? Number(precio) : undefined
  }
  const actualizado = await repo.update(id, req.body)
  
  if (payload.nombre !== undefined && typeof payload.nombre !== 'string') {
    return res.status(400).json({error: 'Nombre inválido'})
  }
  if (payload.precio !== undefined && (Number.isFinite(payload.precio) && payload.precio <= 0)) {
    return res.status(400).json({error: 'Precio inválido'})
  }
  
  if (!actualizado) {
    return res.status(404).json({error: 'No encontrado'})
  }

  return res.json(actualizado)
}

function remove(req, res) {
  const id = Number(req.params.id);
  const eliminado = repo.delete(id);
  if (!eliminado) {
    return res.status(400).json({error: 'No encontrado'})
  }
}

async function search(req, res) {
  const { nombre, minPrecio, maxPrecio, page, limit } = req.query;

  if (nombre !== undefined && typeof nombre !== 'string') {
    return res.status(400).json({ error: 'Nombre inválido' });
  }
  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ error: 'Página inválida' });
  }
  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({ error: 'Limite inválido' });
  }
  if (minPrecio !== undefined && (isNaN(Number(minPrecio)) || Number(minPrecio) < 0)) {
    return res.status(400).json({ error: 'Precio mínimo inválido' });
  }
  if (maxPrecio !== undefined && (isNaN(Number(maxPrecio)) || Number(maxPrecio) < 0)) {
    return res.status(400).json({ error: 'Precio maximo inválido' });
  }
  if (
    minPrecio !== undefined && maxPrecio !== undefined && Number(maxPrecio) < Number(minPrecio)
  ) {
    return res.status(400).json({ error: 'El precio máximo debe de superar al mínimo.' });
  }

  const resultados = await repo.search({
      nombre,
      minPrecio: minPrecio !== undefined ? Number(minPrecio) : undefined,
      maxPrecio: maxPrecio !== undefined ? Number(maxPrecio) : undefined,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined
  });
  if (resultados.length === 0) {
    return res.status(404).json({ error: 'No se encontraron productos.' });
  }
    return res.json(resultados);
}
