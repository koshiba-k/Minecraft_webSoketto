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

  // ジャンル別売上・購入数ランキング
  static async getGenreStats() {
    try {
      const [rows] = await db.execute(`
        SELECT i.genre, SUM(ph.quantity) as total_quantity, SUM(ph.total_price) as total_sales
        FROM purchase_history ph
        JOIN items i ON ph.item_id = i.id
        GROUP BY i.genre
        ORDER BY total_sales DESC
      `);
      return rows;
    } catch (error) { throw error; }
  }

  // ユーザー別売上・購入数ランキング
  static async getUserStats() {
    try {
      const [rows] = await db.execute(`
        SELECT u.username, SUM(ph.quantity) as total_quantity, SUM(ph.total_price) as total_sales
        FROM purchase_history ph
        JOIN users u ON ph.user_id = u.id
        GROUP BY u.username
        ORDER BY total_sales DESC
      `);
      return rows;
    } catch (error) { throw error; }
  }

  // アイテム別売上推移（日別）
  static async getItemSalesTrend(itemName) {
    try {
      const [rows] = await db.execute(`
        SELECT DATE(ph.purchase_date) as date, SUM(ph.quantity) as total_quantity, SUM(ph.total_price) as total_sales
        FROM purchase_history ph
        JOIN items i ON ph.item_id = i.id
        WHERE i.name = ?
        GROUP BY DATE(ph.purchase_date)
        ORDER BY date ASC
      `, [itemName]);
      return rows;
    } catch (error) { throw error; }
  }

  // ジャンルごとの日別売上推移
  static async getGenreSalesTrends() {
    try {
      const [rows] = await db.execute(`
        SELECT DATE(ph.purchase_date) as date, i.genre, SUM(ph.total_price) as total_sales
        FROM purchase_history ph
        JOIN items i ON ph.item_id = i.id
        GROUP BY date, i.genre
        ORDER BY date ASC, i.genre ASC
      `);
      return rows;
    } catch (error) { throw error; }
  }
}

module.exports = PurchaseHistory; 