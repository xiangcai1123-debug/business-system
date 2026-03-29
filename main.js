const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const Database = require('./database');

let db;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
  });

  // 调试用：打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');

app.whenReady().then(async () => {
  console.log('应用启动中...');
  
  try {
    db = new Database();
    await db.init();
    console.log('数据库初始化完成');
  } catch (e) {
    console.error('数据库错误:', e);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理器
ipcMain.handle('get-customers', async () => {
  return db ? db.getCustomers() : [];
});

ipcMain.handle('add-customer', async (event, customer) => {
  return db ? db.addCustomer(customer) : null;
});

ipcMain.handle('get-opportunities', async () => {
  return db ? db.getOpportunities() : [];
});

ipcMain.handle('add-opportunity', async (event, opportunity) => {
  return db ? db.addOpportunity(opportunity) : null;
});

ipcMain.handle('get-quotations', async () => {
  return db ? db.getQuotations() : [];
});

ipcMain.handle('add-quotation', async (event, quotation) => {
  return db ? db.addQuotation(quotation) : null;
});

ipcMain.handle('get-orders', async () => {
  return db ? db.getOrders() : [];
});

ipcMain.handle('add-order', async (event, order) => {
  return db ? db.addOrder(order) : null;
});

ipcMain.handle('get-followups', async () => {
  return db ? db.getFollowups() : [];
});

ipcMain.handle('add-followup', async (event, followup) => {
  return db ? db.addFollowup(followup) : null;
});

ipcMain.handle('get-shipments', async () => {
  return db ? db.getShipments() : [];
});

ipcMain.handle('add-shipment', async (event, shipment) => {
  return db ? db.addShipment(shipment) : null;
});

ipcMain.handle('get-transactions', async () => {
  return db ? db.getTransactions() : [];
});

ipcMain.handle('add-transaction', async (event, transaction) => {
  return db ? db.addTransaction(transaction) : null;
});

ipcMain.handle('get-suppliers', async () => {
  return db ? db.getSuppliers() : [];
});

ipcMain.handle('add-supplier', async (event, supplier) => {
  return db ? db.addSupplier(supplier) : null;
});

ipcMain.handle('get-purchases', async () => {
  return db ? db.getPurchases() : [];
});

ipcMain.handle('add-purchase', async (event, purchase) => {
  return db ? db.addPurchase(purchase) : null;
});

ipcMain.handle('get-templates', async () => {
  return db ? db.getTemplates() : [];
});

ipcMain.handle('add-template', async (event, template) => {
  return db ? db.addTemplate(template) : null;
});

process.on('exit', () => {
  if (db) db.close();
});