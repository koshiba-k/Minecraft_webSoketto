const db = require('../config/database');

class Item {
  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM items ORDER BY genre, name');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getByGenre(genre) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM items WHERE genre = ? ORDER BY name',
        [genre]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async searchByName(searchTerm) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM items WHERE name LIKE ? ORDER BY name COLLATE utf8mb4_ja_0900_as_cs',
        [`%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM items WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updatePrice(id, newPrice) {
    try {
      await db.execute(
        'UPDATE items SET price = ? WHERE id = ?',
        [newPrice, id]
      );
    } catch (error) {
      throw error;
    }
  }

  static async getGenres() {
    try {
      const [rows] = await db.execute('SELECT DISTINCT genre FROM items ORDER BY genre');
      return rows.map(row => row.genre);
    } catch (error) {
      throw error;
    }
  }

  static async getFiltered({ genre, search, is_active }) {
    try {
      let sql = 'SELECT * FROM items WHERE 1=1';
      let params = [];
      if (genre) {
        sql += ' AND genre = ?';
        params.push(genre);
      }
      if (typeof is_active !== 'undefined' && is_active !== '') {
        sql += ' AND is_active = ?';
        params.push(is_active);
      }
      if (search) {
        sql += ' AND name LIKE ?';
        params.push(`%${search}%`);
      }
      sql += ' ORDER BY genre, name';
      const [rows] = await db.execute(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateActive(id, isActive) {
    try {
      await db.execute('UPDATE items SET is_active = ? WHERE id = ?', [isActive, id]);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Item; 