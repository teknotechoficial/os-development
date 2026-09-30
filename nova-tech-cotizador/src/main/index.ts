import { initDatabase, closeDatabase } from './database';
import { registerHandlers } from './ipc';
import { start as startServer } from '../../server';
import { BrowserWindow, app, Menu, shell } from 'electron';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(app.getAppPath(), '.env') });

let mainWindow: BrowserWindow | null = null;

export async function bootstrap(): Promise<void> {
	try {
		await initDatabase();
	} catch (error) {
		console.error('[Database] init failed, continuing without DB:', error);
	}
	registerHandlers();
	try {
		await startServer();
	} catch (error) {
		console.error('[Server] start failed:', error);
	}

	app.whenReady().then(() => {
		Menu.setApplicationMenu(null);
		mainWindow = new BrowserWindow({
			width: 1400,
			height: 900,
			minWidth: 1000,
			minHeight: 700,
			webPreferences: {
				preload: join(__dirname, '../preload.js'),
				nodeIntegration: false,
				contextIsolation: true,
			},
			title: 'TeknoTech Services Cotizador',
			icon: join(app.getAppPath(), 'assets', 'logo-icon.ico'),
		});

		mainWindow.webContents.setWindowOpenHandler(({ url }) => {
			if (url.startsWith('http')) {
				shell.openExternal(url);
				return { action: 'deny' };
			}
			return { action: 'allow' };
		});

		if (app.isPackaged) {
			mainWindow.loadFile(join(app.getAppPath(), 'dist', 'renderer', 'index.html'));
		} else {
			mainWindow.loadURL('http://localhost:3000');
			mainWindow.webContents.openDevTools();
		}

		mainWindow.on('closed', () => {
			mainWindow = null;
		});
	});

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') app.quit();
	});

	app.on('before-quit', async () => {
		await closeDatabase();
	});
}

bootstrap().catch(console.error);
