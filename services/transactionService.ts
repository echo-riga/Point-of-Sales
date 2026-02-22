// services/transactionService.ts
import db from "@/services/db";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface CreateTransactionInput {
  paymentTypeId: number;
  items: CartItem[];
}

interface TransactionRow {
  id: number;
  payment_type_id: number | null;
  payment_type_name: string | null;
  date: string;
  total_qty: number;
  total_price: number;
}

interface TransactionItemRow {
  id: number;
  item_id: number | null;
  item_name: string | null;
  price: number;
  qty: number;
  total: number;
}

export const transactionService = {
  create({ paymentTypeId, items }: CreateTransactionInput): number {
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    // Store as local time so SQLite date() comparisons work correctly
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const date =
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      "T" +
      pad(now.getHours()) +
      ":" +
      pad(now.getMinutes()) +
      ":" +
      pad(now.getSeconds());

    const result = db.runSync(
      `INSERT INTO transactions (payment_type_id, date, total_qty, total_price)
       VALUES (?, ?, ?, ?)`,
      [paymentTypeId, date, totalQty, totalPrice],
    );

    const transactionId = result.lastInsertRowId;

    for (const item of items) {
      db.runSync(
        `INSERT INTO transaction_items (transaction_id, item_id, price, qty, total)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.id, item.price, item.qty, item.price * item.qty],
      );
    }

    return transactionId;
  },

  getAll(): TransactionRow[] {
    return db.getAllSync<TransactionRow>(`
      SELECT
        t.id,
        t.payment_type_id,
        pt.name AS payment_type_name,
        t.date,
        t.total_qty,
        t.total_price
      FROM transactions t
      LEFT JOIN payment_types pt ON pt.id = t.payment_type_id
      ORDER BY t.date DESC
    `);
  },

  getById(id: number): TransactionRow | null {
    return (
      db.getFirstSync<TransactionRow>(
        `
      SELECT
        t.id,
        t.payment_type_id,
        pt.name AS payment_type_name,
        t.date,
        t.total_qty,
        t.total_price
      FROM transactions t
      LEFT JOIN payment_types pt ON pt.id = t.payment_type_id
      WHERE t.id = ?
    `,
        [id],
      ) ?? null
    );
  },

  getItemsByTransactionId(transactionId: number): TransactionItemRow[] {
    return db.getAllSync<TransactionItemRow>(
      `
      SELECT
        ti.id,
        ti.item_id,
        i.name AS item_name,
        ti.price,
        ti.qty,
        ti.total
      FROM transaction_items ti
      LEFT JOIN items i ON i.id = ti.item_id
      WHERE ti.transaction_id = ?
      ORDER BY ti.id ASC
    `,
      [transactionId],
    );
  },

  delete(id: number): void {
    db.runSync(`DELETE FROM transactions WHERE id = ?`, [id]);
  },
};
