const e = require('express');
const { pool } = require('../db');

class ProductosRepository {

  async getAll() {
    const result = await pool.query(
      'select id, nombre, precio from productos;'
    );
    return result.rows;
  }

  async getAllActive() {
    const result = await pool.query(
      'select id, nombre, precio from productos where activo = true;'
    );
    return result.rows;
  }

  async getById(id) {
    const result = await pool.query(
      'select id, nombre, precio, stock, descripcion from productos where activo = true and id = $1;', [id]
    );
    return result.rows[0];
  }

  async create(nombre, precio) {
    const result = await pool.query(
      'insert into productos (nombre, precio) values ($1,$2) returning id, nombre, precio;',[nombre, precio] 
    );
    return result.rows[0];
  }

  async update(id, data) {
    const result = await pool.query(
      'update productos set nombre = coalesce($1, nombre), precio = coalesce($2, precio) where id = $3 returning id, nombre, precio;',
      [data.nombre ?? null, data.precio ?? null, id]
    )
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await pool.query(
      'update productos set activo = false where id = $1 returning id, nombre, precio;',
      [id]
    )
    return result.rows[0] || null;
  }


  async search({ nombre, minPrecio, maxPrecio, page = 1, limit = 10 }) {

    const filters = [];
    const values = [];
    let idx = 1;

    if (nombre) {
      filters.push(`nombre ILIKE $${idx++}`);
      values.push(`%${nombre}%`);
    }
    if (minPrecio !== undefined) {
      filters.push(`precio >= $${idx++}`);
      values.push(Number(minPrecio));
    }
    if (maxPrecio !== undefined) {
      filters.push(`precio <= $${idx++}`);
      values.push(Number(maxPrecio));
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const totalQuery = `
      SELECT COUNT(*) AS total
      FROM productos
      ${whereClause}
    `;
    const totalResult = await pool.query(totalQuery, values);
    const total = Number(totalResult.rows[0]?.total || 0);

    values.push(Number(limit), offset);
    const dataQuery = `
      SELECT id, nombre, precio
      FROM productos
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const dataResult = await pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      page: Number(page),
      limit: Number(limit),
      total,
    };
}
}



module.exports = { ProductosRepository }