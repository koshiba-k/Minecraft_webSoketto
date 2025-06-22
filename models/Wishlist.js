const db = require('../config/database');

class Wishlist {
  static async add(userId, itemId) {
    try {
      await db.execute(
        'INSERT IGNORE INTO wishlist (user_id, item_id) VALUES (?, ?)',
        [userId, itemId]
      );
    } catch (error) {
      throw error;
    }
  }

  static async remove(userId, itemId) {
    try {
      await db.execute(
        'DELETE FROM wishlist WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );
    } catch (error) {
      throw error;
    }
  }

  static async getByUser(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT w.*, i.name, i.genre, i.price, i.id as item_id
         FROM wishlist w
         JOIN items i ON w.item_id = i.id
         WHERE w.user_id = ?
         ORDER BY w.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async isInWishlist(userId, itemId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM wishlist WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Wishlist; 