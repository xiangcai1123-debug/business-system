const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  async init() {
    // 使用 Electron 的用户数据目录
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'data', 'business.db');

    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    // 尝试加载已有数据库
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
  }

  save() {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  createTables() {
    // 1. 客户管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_code TEXT,
        name TEXT NOT NULL,
        contact TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        industry TEXT,
        customer_type TEXT,
        level TEXT,
        source TEXT,
        follow_up TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 2. 商机管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_code TEXT,
        customer_id INTEGER,
        product TEXT,
        amount REAL,
        expected_date TEXT,
        stage TEXT DEFAULT '线索',
        follow_up TEXT,
        win_rate INTEGER,
        competitor TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // 3. 询报价系统
    this.db.run(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_code TEXT,
        customer_id INTEGER,
        contact TEXT,
        products TEXT,
        supplier_price REAL,
        cost_price REAL,
        quote_price REAL,
        profit_rate REAL,
        currency TEXT DEFAULT 'CNY',
        exchange_rate REAL DEFAULT 1,
        quote_date TEXT,
        valid_date TEXT,
        status TEXT DEFAULT '待报价',
        opportunity_id INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
      )
    `);

    // 4. 订单管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT,
        contract_no TEXT,
        customer_id INTEGER,
        products TEXT,
        unit_price REAL,
        quantity REAL,
        total_amount REAL,
        currency TEXT DEFAULT 'CNY',
        exchange_rate REAL DEFAULT 1,
        status TEXT DEFAULT '已确认',
        sign_date TEXT,
        delivery_date TEXT,
        quotation_id INTEGER,
        opportunity_id INTEGER,
        sales_person TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (quotation_id) REFERENCES quotations(id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
      )
    `);

    // 5. 跟单管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        followup_code TEXT,
        customer_id INTEGER,
        opportunity_id INTEGER,
        order_id INTEGER,
        type TEXT,
        content TEXT,
        follow_up TEXT,
        next_date TEXT,
        status TEXT DEFAULT '进行中',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // 6. 发货单证管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_code TEXT,
        order_id INTEGER,
        customer_name TEXT,
        shipment_date TEXT,
        container_no TEXT,
        shipping_method TEXT,
        tracking_no TEXT,
        expected_arrival TEXT,
        invoice_no TEXT,
        packing_list_no TEXT,
        bill_of_lading_no TEXT,
        customs_status TEXT DEFAULT '待报关',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // 7. 资金管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_code TEXT,
        type TEXT,
        contract_id INTEGER,
        order_id INTEGER,
        customer_id INTEGER,
        supplier_id INTEGER,
        amount REAL,
        currency TEXT DEFAULT 'CNY',
        exchange_rate REAL DEFAULT 1,
        payment_method TEXT,
        plan_date TEXT,
        actual_date TEXT,
        status TEXT DEFAULT '未到账',
        reconcile_status TEXT DEFAULT '未核销',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contract_id) REFERENCES orders(id),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `);

    // 8. 供应商管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_code TEXT,
        name TEXT NOT NULL,
        contact TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        main_products TEXT,
        certifications TEXT,
        level TEXT DEFAULT 'C',
        cooperation_years INTEGER,
        rating REAL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 9. 采购管理
    this.db.run(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_code TEXT,
        project_id INTEGER,
        supplier_id INTEGER,
        products TEXT,
        quantity REAL,
        unit_price REAL,
        total_amount REAL,
        status TEXT DEFAULT '待下单',
        order_date TEXT,
        expected_arrival TEXT,
        actual_arrival TEXT,
        quality_check TEXT,
        payment_status TEXT DEFAULT '未付',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (project_id) REFERENCES orders(id)
      )
    `);

    // 10. 模板库
    this.db.run(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_code TEXT,
        name TEXT NOT NULL,
        category TEXT,
        file_format TEXT,
        scope TEXT,
        version TEXT,
        uploader TEXT,
        related_business TEXT,
        file_path TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    this.save();
    console.log('数据库表创建完成');
  }

  // 通用查询
  query(sql) {
    if (!this.db) return [];
    const stmt = this.db.prepare(sql);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // 通用插入
  insert(sql, params = []) {
    if (!this.db) return { id: null };
    this.db.run(sql, params);
    this.save();
    return { id: this.db.exec("SELECT last_insert_rowid()")[0].values[0][0] };
  }

  // ============ 客户管理 ============
  getCustomers() {
    return this.query('SELECT * FROM customers ORDER BY id DESC');
  }

  addCustomer(customer) {
    const sql = `INSERT INTO customers (customer_code, name, contact, phone, email, address, industry, customer_type, level, source, follow_up)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      customer.customer_code || '', customer.name, customer.contact || '',
      customer.phone || '', customer.email || '', customer.address || '',
      customer.industry || '', customer.customer_type || '',
      customer.level || '', customer.source || '', customer.follow_up || ''
    ]);
  }

  // ============ 商机管理 ============
  getOpportunities() {
    return this.query('SELECT * FROM opportunities ORDER BY id DESC');
  }

  addOpportunity(opportunity) {
    const sql = `INSERT INTO opportunities (opportunity_code, customer_id, product, amount, expected_date, stage, follow_up, win_rate, competitor, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      opportunity.opportunity_code || '', opportunity.customer_id || null,
      opportunity.product || '', opportunity.amount || 0,
      opportunity.expected_date || '', opportunity.stage || '线索',
      opportunity.follow_up || '', opportunity.win_rate || 0,
      opportunity.competitor || '', opportunity.notes || ''
    ]);
  }

  // ============ 询报价 ============
  getQuotations() {
    return this.query('SELECT * FROM quotations ORDER BY id DESC');
  }

  addQuotation(quotation) {
    const sql = `INSERT INTO quotations (quotation_code, customer_id, contact, products, supplier_price, cost_price, quote_price, profit_rate, currency, exchange_rate, quote_date, valid_date, status, opportunity_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      quotation.quotation_code || '', quotation.customer_id || null,
      quotation.contact || '', quotation.products || '',
      quotation.supplier_price || 0, quotation.cost_price || 0,
      quotation.quote_price || 0, quotation.profit_rate || 0,
      quotation.currency || 'CNY', quotation.exchange_rate || 1,
      quotation.quote_date || '', quotation.valid_date || '',
      quotation.status || '待报价', quotation.opportunity_id || null,
      quotation.notes || ''
    ]);
  }

  // ============ 订单管理 ============
  getOrders() {
    return this.query('SELECT * FROM orders ORDER BY id DESC');
  }

  addOrder(order) {
    const sql = `INSERT INTO orders (order_code, contract_no, customer_id, products, unit_price, quantity, total_amount, currency, exchange_rate, status, sign_date, delivery_date, quotation_id, opportunity_id, sales_person)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      order.order_code || '', order.contract_no || '',
      order.customer_id || null, order.products || '',
      order.unit_price || 0, order.quantity || 0, order.total_amount || 0,
      order.currency || 'CNY', order.exchange_rate || 1,
      order.status || '已确认', order.sign_date || '',
      order.delivery_date || '', order.quotation_id || null,
      order.opportunity_id || null, order.sales_person || ''
    ]);
  }

  // ============ 跟单管理 ============
  getFollowups() {
    return this.query('SELECT * FROM followups ORDER BY id DESC');
  }

  addFollowup(followup) {
    const sql = `INSERT INTO followups (followup_code, customer_id, opportunity_id, order_id, type, content, follow_up, next_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      followup.followup_code || '', followup.customer_id || null,
      followup.opportunity_id || null, followup.order_id || null,
      followup.type || '', followup.content || '',
      followup.follow_up || '', followup.next_date || '',
      followup.status || '进行中'
    ]);
  }

  // ============ 发货管理 ============
  getShipments() {
    return this.query('SELECT * FROM shipments ORDER BY id DESC');
  }

  addShipment(shipment) {
    const sql = `INSERT INTO shipments (shipment_code, order_id, customer_name, shipment_date, container_no, shipping_method, tracking_no, expected_arrival, invoice_no, packing_list_no, bill_of_lading_no, customs_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      shipment.shipment_code || '', shipment.order_id || null,
      shipment.customer_name || '', shipment.shipment_date || '',
      shipment.container_no || '', shipment.shipping_method || '',
      shipment.tracking_no || '', shipment.expected_arrival || '',
      shipment.invoice_no || '', shipment.packing_list_no || '',
      shipment.bill_of_lading_no || '', shipment.customs_status || '待报关',
      shipment.notes || ''
    ]);
  }

  // ============ 资金管理 ============
  getTransactions() {
    return this.query('SELECT * FROM transactions ORDER BY id DESC');
  }

  addTransaction(transaction) {
    const sql = `INSERT INTO transactions (transaction_code, type, contract_id, order_id, customer_id, supplier_id, amount, currency, exchange_rate, payment_method, plan_date, actual_date, status, reconcile_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      transaction.transaction_code || '', transaction.type || '',
      transaction.contract_id || null, transaction.order_id || null,
      transaction.customer_id || null, transaction.supplier_id || null,
      transaction.amount || 0, transaction.currency || 'CNY',
      transaction.exchange_rate || 1, transaction.payment_method || '',
      transaction.plan_date || '', transaction.actual_date || '',
      transaction.status || '未到账', transaction.reconcile_status || '未核销',
      transaction.notes || ''
    ]);
  }

  // ============ 供应商管理 ============
  getSuppliers() {
    return this.query('SELECT * FROM suppliers ORDER BY id DESC');
  }

  addSupplier(supplier) {
    const sql = `INSERT INTO suppliers (supplier_code, name, contact, phone, email, address, main_products, certifications, level, cooperation_years, rating, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      supplier.supplier_code || '', supplier.name,
      supplier.contact || '', supplier.phone || '',
      supplier.email || '', supplier.address || '',
      supplier.main_products || '', supplier.certifications || '',
      supplier.level || 'C', supplier.cooperation_years || 0,
      supplier.rating || 0, supplier.notes || ''
    ]);
  }

  // ============ 采购管理 ============
  getPurchases() {
    return this.query('SELECT * FROM purchases ORDER BY id DESC');
  }

  addPurchase(purchase) {
    const sql = `INSERT INTO purchases (purchase_code, project_id, supplier_id, products, quantity, unit_price, total_amount, status, order_date, expected_arrival, actual_arrival, quality_check, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      purchase.purchase_code || '', purchase.project_id || null,
      purchase.supplier_id || null, purchase.products || '',
      purchase.quantity || 0, purchase.unit_price || 0,
      purchase.total_amount || 0, purchase.status || '待下单',
      purchase.order_date || '', purchase.expected_arrival || '',
      purchase.actual_arrival || '', purchase.quality_check || '',
      purchase.payment_status || '未付', purchase.notes || ''
    ]);
  }

  // ============ 模板库 ============
  getTemplates() {
    return this.query('SELECT * FROM templates ORDER BY id DESC');
  }

  addTemplate(template) {
    const sql = `INSERT INTO templates (template_code, name, category, file_format, scope, version, uploader, related_business, file_path, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.insert(sql, [
      template.template_code || '', template.name,
      template.category || '', template.file_format || '',
      template.scope || '', template.version || '',
      template.uploader || '', template.related_business || '',
      template.file_path || '', template.notes || ''
    ]);
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = Database;