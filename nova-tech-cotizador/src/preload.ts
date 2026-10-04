import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  login: (code: string) => ipcRenderer.invoke('login', code),
  getQuotes: (userId?: string, role?: string) => ipcRenderer.invoke('getQuotes', userId, role),
  createQuote: (quoteData: any) => ipcRenderer.invoke('createQuote', quoteData),
  getTeam: () => ipcRenderer.invoke('getTeam'),
  getAvailability: () => ipcRenderer.invoke('getAvailability'),
  assignDeveloper: (quoteId: string, devId: string) => ipcRenderer.invoke('assignDeveloper', quoteId, devId),
  getNotifications: (userId: string) => ipcRenderer.invoke('getNotifications', userId),
  markNotificationRead: (id: string) => ipcRenderer.invoke('markNotificationRead', id),
  getSettings: () => ipcRenderer.invoke('getSettings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('updateSettings', settings),
  generatePDF: (quoteId: string) => ipcRenderer.invoke('generatePDF', quoteId),
  sendWhatsApp: (quoteId: string) => ipcRenderer.invoke('sendWhatsApp', quoteId),
  setWindowTitle: (title: string) => ipcRenderer.invoke('set-title', title),
  setAppIcon: (icon: string | null) => ipcRenderer.invoke('set-app-icon', icon),
});
