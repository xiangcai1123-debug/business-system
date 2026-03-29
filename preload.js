const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 客户管理
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  addCustomer: (data) => ipcRenderer.invoke('add-customer', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('update-customer', id, data),
  deleteCustomer: (id) => ipcRenderer.invoke('delete-customer', id),
  getCustomerDetail: (id) => ipcRenderer.invoke('get-customer-detail', id),
  
  // 联系人管理
  getContacts: (customerId) => ipcRenderer.invoke('get-contacts', customerId),
  addContact: (data) => ipcRenderer.invoke('add-contact', data),
  updateContact: (id, data) => ipcRenderer.invoke('update-contact', id, data),
  deleteContact: (id) => ipcRenderer.invoke('delete-contact', id),
  
  // 商机管理
  getOpportunities: () => ipcRenderer.invoke('get-opportunities'),
  addOpportunity: (data) => ipcRenderer.invoke('add-opportunity', data),
  
  // 询报价
  getQuotations: () => ipcRenderer.invoke('get-quotations'),
  addQuotation: (data) => ipcRenderer.invoke('add-quotation', data),
  
  // 订单管理
  getOrders: () => ipcRenderer.invoke('get-orders'),
  addOrder: (data) => ipcRenderer.invoke('add-order', data),
  
  // 跟单管理
  getFollowups: () => ipcRenderer.invoke('get-followups'),
  addFollowup: (data) => ipcRenderer.invoke('add-followup', data),
  
  // 发货单证
  getShipments: () => ipcRenderer.invoke('get-shipments'),
  addShipment: (data) => ipcRenderer.invoke('add-shipment', data),
  
  // 资金管理
  getTransactions: () => ipcRenderer.invoke('get-transactions'),
  addTransaction: (data) => ipcRenderer.invoke('add-transaction', data),
  
  // 供应商管理
  getSuppliers: () => ipcRenderer.invoke('get-suppliers'),
  addSupplier: (data) => ipcRenderer.invoke('add-supplier', data),
  
  // 采购管理
  getPurchases: () => ipcRenderer.invoke('get-purchases'),
  addPurchase: (data) => ipcRenderer.invoke('add-purchase', data),
  
  // 模板库
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  addTemplate: (data) => ipcRenderer.invoke('add-template', data),
  
  // 更新
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  restartAndUpdate: () => ipcRenderer.invoke('restart-and-update')
});