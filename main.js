const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

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
  
  // 检查更新
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// 配置自动更新
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  console.log('检查更新中...');
});

autoUpdater.on('update-available', (info) => {
  console.log('发现新版本:', info.version);
  if (db) {
    db.addLog('系统更新', `发现新版本 ${info.version}，正在下载...`);
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('已是最新版本');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`下载进度: ${progress.percent.toFixed(1)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('下载完成，将在重启后安装');
  if (db) {
    db.addLog('系统更新', `版本 ${info.version} 下载完成，重启后将自动安装`);
  }
  // 通知渲染进程
  if (global.mainWindow) {
    global.mainWindow.webContents.send('update-downloaded');
  }
});

autoUpdater.on('error', (err) => {
  console.error('更新错误:', err);
});

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');

app.whenReady().then(async () => {
  console.log('应用启动中... v1.0.0');
  
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

// 退出并更新
app.on('before-quit', () => {
  if (autoUpdater && autoUpdater.isUpdateDownloaded) {
    autoUpdater.quitAndInstall();
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

// 检查更新
ipcMain.handle('check-update', async () => {
  if (app.isPackaged) {
    return autoUpdater.checkForUpdates();
  }
  return null;
});

// 重启更新
ipcMain.handle('restart-and-update', () => {
  autoUpdater.quitAndInstall();
});

process.on('exit', () => {
  if (db) db.close();
});