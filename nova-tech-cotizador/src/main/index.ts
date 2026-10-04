import { initDatabase, closeDatabase } from './database';
import { registerHandlers } from './ipc';
import { start as startServer } from '../../server';
import { BrowserWindow, app, Menu, shell, nativeImage } from 'electron';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(app.getAppPath(), '.env') });

let mainWindow: BrowserWindow | null = null;

/* Window title follows the CEO-configured program name + title suffix */
async function applyWindowTitle(): Promise<void> {
	const port = process.env.PORT || 3001;
	for (let attempt = 0; attempt < 5 && mainWindow; attempt++) {
		try {
			const res = await fetch(`http://localhost:${port}/api/settings/public`);
			if (res.ok) {
				const data = (await res.json()) as {
					companyName?: unknown;
					appTitleSuffix?: unknown;
					appIcon?: unknown;
				} | null;
				const name =
					data && typeof data.companyName === 'string' && data.companyName.trim()
						? data.companyName.trim().slice(0, 80)
						: 'TeknoTech Services';
				const suffix =
					data && typeof data.appTitleSuffix === 'string' ? data.appTitleSuffix.trim().slice(0, 40) : 'Cotizador';
				if (mainWindow) mainWindow.setTitle(suffix ? `${name} ${suffix}` : name);
				const appIcon = data && typeof data.appIcon === 'string' ? data.appIcon : '';
				if (mainWindow && appIcon.startsWith('data:image/')) {
					const img = nativeImage.createFromDataURL(appIcon);
					if (!img.isEmpty()) mainWindow.setIcon(img);
				}
				return;
			}
		} catch {
			/* servidor aún no responde: se reintenta */
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}

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

		void applyWindowTitle();

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
