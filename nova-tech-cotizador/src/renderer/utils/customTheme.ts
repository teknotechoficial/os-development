import type { CustomTheme, CustomThemeColors } from '@/shared/types';

export const THEME_SLOT_KEYS: (keyof CustomThemeColors)[] = [
	'bg',
	'deep',
	'surface',
	'card',
	'borderSoft',
	'border',
	'accent',
	'accentText',
	'text',
	'textMuted',
	'textDim',
];

export const THEME_SLOT_LABELS: Record<keyof CustomThemeColors, string> = {
	bg: 'Fondo principal',
	deep: 'Fondo profundo',
	surface: 'Superficie (tarjetas)',
	card: 'Campo / entrada',
	borderSoft: 'Borde suave',
	border: 'Borde fuerte',
	accent: 'Acento primario',
	accentText: 'Texto de acento',
	text: 'Texto principal',
	textMuted: 'Texto secundario',
	textDim: 'Texto terciario',
};

/* base palette of the built-in "dark" theme = safe defaults for new themes */
export const DEFAULT_THEME_COLORS: CustomThemeColors = {
	bg: '#0A182E',
	deep: '#081426',
	surface: '#10233E',
	card: '#0C1E36',
	borderSoft: '#16294A',
	border: '#1C3557',
	accent: '#1877E8',
	accentText: '#60A5FA',
	text: '#E6EDF7',
	textMuted: '#8FA6C4',
	textDim: '#5B7295',
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
export const THEME_ID_RE = /^[a-z0-9][a-z0-9-]{2,31}$/;
const PRESET_IDS = ['dark', 'midnight', 'steel', 'ocean'];

export const slugifyTheme = (name: string): string =>
	name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 32);

export const isValidHex = (value: string): boolean => HEX_RE.test(value);

export const sanitizeCustomThemes = (raw: unknown): CustomTheme[] => {
	if (!Array.isArray(raw) || raw.length > 30) return [];
	const out: CustomTheme[] = [];
	const ids = new Set<string>();
	for (const item of raw as any[]) {
		if (!item || typeof item !== 'object') continue;
		const { id, name, colors } = item;
		if (typeof id !== 'string' || !THEME_ID_RE.test(id) || PRESET_IDS.includes(id) || ids.has(id)) continue;
		if (typeof name !== 'string' || !name.trim() || name.length > 40) continue;
		if (!colors || typeof colors !== 'object') continue;
		const c: Record<string, string> = {};
		let valid = true;
		for (const slot of THEME_SLOT_KEYS) {
			const v = colors[slot];
			if (typeof v !== 'string' || !HEX_RE.test(v)) {
				valid = false;
				break;
			}
			c[slot] = v;
		}
		if (!valid) continue;
		ids.add(id);
		out.push({ id, name: name.trim(), colors: c as unknown as CustomThemeColors });
	}
	return out;
};

const rgba = (hex: string, alpha: number): string => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${alpha})`;
};

/* accent opacity variants actually used across the codebase */
const ACCENT_BG_OPACITY = [10, 12, 15, 20, 25];
const ACCENT_BORDER_OPACITY = [25, 30, 40, 50, 60, 70];
const ACCENT_RING_OPACITY = [25, 30, 40, 50, 60, 80];

const esc = (cls: string): string => cls.replace(/([\\[:.\]#/%])/g, '\\$1');

const STYLE_ID = 'nt-custom-themes';

export const buildThemeCss = (theme: CustomTheme): string => {
	const c = theme.colors;
	const p = `[data-theme='${theme.id}']`;
	const rules: string[] = [];
	rules.push(`${p} { color-scheme: dark; --color-primary: ${c.accent}; }`);
	rules.push(`${p} body { background-color: ${c.bg}; color: ${c.text}; }`);
	rules.push(
		`${p} .${esc('bg-[#0A182E]')}, ${p} .${esc('bg-[#0A182E]/95')} { background-color: ${c.bg} !important; }`
	);
	rules.push(`${p} .${esc('bg-[#081426]')} { background-color: ${c.deep} !important; }`);
	rules.push(
		`${p} .${esc('bg-[#10233E]')}, ${p} .${esc('bg-[#10233E]/70')}, ${p} .${esc('bg-[#10233E]/80')} { background-color: ${c.surface} !important; }`
	);
	rules.push(
		`${p} .${esc('bg-[#0C1E36]')}, ${p} .${esc('bg-[#0C1E36]/60')} { background-color: ${c.card} !important; }`
	);
	rules.push(
		`${p} .${esc('border-[#16294A]')}, ${p} .${esc('border-[#16294A]/60')}, ${p} .${esc('border-[#16294A]/70')} { border-color: ${c.borderSoft} !important; }`
	);
	rules.push(`${p} .${esc('border-[#1C3557]')} { border-color: ${c.border} !important; }`);
	/* accent */
	rules.push(`${p} .${esc('bg-[#1877E8]')} { background-color: ${c.accent} !important; }`);
	for (const op of ACCENT_BG_OPACITY) {
		const val = rgba(c.accent, op / 100);
		rules.push(`${p} .${esc(`bg-[#1877E8]/${op}`)} { background-color: ${val} !important; }`);
		rules.push(`${p} .${esc(`hover:bg-[#1877E8]/${op}`)}:hover { background-color: ${val} !important; }`);
	}
	rules.push(`${p} .${esc('border-[#1877E8]')} { border-color: ${c.accent} !important; }`);
	for (const op of ACCENT_BORDER_OPACITY) {
		const val = rgba(c.accent, op / 100);
		rules.push(`${p} .${esc(`border-[#1877E8]/${op}`)} { border-color: ${val} !important; }`);
		rules.push(`${p} .${esc(`hover:border-[#1877E8]/${op}`)}:hover { border-color: ${val} !important; }`);
	}
	rules.push(`${p} .${esc('focus:border-[#1877E8]')}:focus { border-color: ${c.accent} !important; }`);
	for (const op of ACCENT_RING_OPACITY) {
		const val = rgba(c.accent, op / 100);
		rules.push(`${p} .${esc(`ring-[#1877E8]/${op}`)} { --tw-ring-color: ${val} !important; }`);
		rules.push(`${p} .${esc(`focus:ring-[#1877E8]/${op}`)}:focus { --tw-ring-color: ${val} !important; }`);
		rules.push(`${p} .${esc(`hover:ring-[#1877E8]/${op}`)}:hover { --tw-ring-color: ${val} !important; }`);
	}
	rules.push(`${p} .${esc('text-[#1877E8]')} { color: ${c.accent} !important; }`);
	rules.push(`${p} .${esc('text-[#60A5FA]')}, ${p} .${esc('hover:text-[#60A5FA]')} { color: ${c.accentText} !important; }`);
	rules.push(`${p} .${esc('text-[#E6EDF7]')} { color: ${c.text} !important; }`);
	rules.push(`${p} .${esc('text-[#8FA6C4]')} { color: ${c.textMuted} !important; }`);
	rules.push(`${p} .${esc('text-[#5B7295]')} { color: ${c.textDim} !important; }`);
	return rules.join('\n');
};

/* keeps a single <style> in sync with the stored custom themes */
export const injectCustomThemes = (themes: CustomTheme[]): void => {
	try {
		if (typeof document === 'undefined') return;
		const css = themes.map(buildThemeCss).join('\n');
		let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement('style');
			el.id = STYLE_ID;
			document.head.appendChild(el);
		}
		if (el.textContent !== css) el.textContent = css;
	} catch {
		/* sin document */
	}
};

/* while the theme editor preview is active the background poll must not
   overwrite the draft CSS or data-theme (module-level flag shared between
   AppLayout and Settings since both import this module) */
let themePreviewActive: string | null = null;

export const setThemePreviewActive = (id: string | null): void => {
	themePreviewActive = id;
};

export const isThemePreviewActive = (): boolean => themePreviewActive !== null;
