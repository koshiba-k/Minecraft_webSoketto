const db = require('../config/database');

class User {
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateBalance(userId, newBalance) {
    try {
      await db.execute(
        'UPDATE users SET balance = ? WHERE id = ?',
        [newBalance, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  static async create(username, password, isAdmin = false) {
    try {
      const [result] = await db.execute(
        'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
        [username, password, isAdmin]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM users ORDER BY id');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateName(id, username) {
    try {
      await db.execute('UPDATE users SET username = ? WHERE id = ?', [username, id]);
    } catch (error) { throw error; }
  }

  static async updateEmail(id, email) {
    try {
      await db.execute('UPDATE users SET email = ? WHERE id = ?', [email, id]);
    } catch (error) { throw error; }
  }

  static async updateRole(id, role) {
    try {
      await db.execute('UPDATE users SET isAdmin = ? WHERE id = ?', [role === 'admin' ? 1 : 0, id]);
    } catch (error) { throw error; }
  }

  static async lock(id) {
    try {
      await db.execute('UPDATE users SET locked = 1 WHERE id = ?', [id]);
    } catch (error) { throw error; }
  }

  static async unlock(id) {
    try {
      await db.execute('UPDATE users SET locked = 0 WHERE id = ?', [id]);
    } catch (error) { throw error; }
  }

  static async delete(id) {
    try {
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
    } catch (error) { throw error; }
  }

  static async updatePassword(id, passwordHash) {
    try {
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
    } catch (error) { throw error; }
  }
}

module.exports = User; 