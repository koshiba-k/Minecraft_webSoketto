const db = require('../config/database');

class PurchaseHistory {
  static async create(userId, itemId, quantity, totalPrice) {
    try {
      const [result] = await db.execute(
        'INSERT INTO purchase_history (user_id, item_id, quantity, total_price) VALUES (?, ?, ?, ?)',
        [userId, itemId, quantity, totalPrice]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const [rows] = await db.execute(`
        SELECT ph.*, i.name as item_name, i.genre, i.image_path
        FROM purchase_history ph
        JOIN items i ON ph.item_id = i.id
        WHERE ph.user_id = ?
        ORDER BY ph.purchase_date DESC
      `, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute(`
        SELECT ph.*, u.username, i.name as item_name, i.genre
        FROM purchase_history ph
        JOIN users u ON ph.user_id = u.id
        JOIN items i ON ph.item_id = i.id
        ORDER BY ph.purchase_date DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PurchaseHistory; 