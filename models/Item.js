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
}

module.exports = Item; 