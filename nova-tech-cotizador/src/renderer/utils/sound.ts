export type SoundTone = 'classic' | 'soft' | 'urgent' | 'chime';

export const TONE_OPTIONS: { value: SoundTone; label: string }[] = [
	{ value: 'classic', label: 'Clásico' },
	{ value: 'soft', label: 'Suave' },
	{ value: 'urgent', label: 'Urgente' },
	{ value: 'chime', label: 'Cascada' },
];

let audioContext: AudioContext | null = null;

const scheduleTone = (
	context: AudioContext,
	type: OscillatorType,
	frequency: number,
	duration: number,
	gainValue: number,
	at: number,
): void => {
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = type;
	oscillator.frequency.value = frequency;
	gain.gain.value = gainValue;
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.onended = () => {
		oscillator.disconnect();
		gain.disconnect();
	};
	oscillator.start(at);
	oscillator.stop(at + duration);
};

export function isValidTone(t: unknown): t is SoundTone {
	return t === 'classic' || t === 'soft' || t === 'urgent' || t === 'chime';
}

export function playTone(tone?: string): void {
	try {
		if (!audioContext) {
			audioContext = new AudioContext();
		}
		const context = audioContext;
		if (context.state === 'suspended') {
			context.resume().catch(() => undefined);
		}
		const startAt = context.currentTime;
		if (tone === 'soft') {
			scheduleTone(context, 'sine', 660, 0.25, 0.03, startAt);
		} else if (tone === 'urgent') {
			scheduleTone(context, 'square', 980, 0.08, 0.05, startAt);
			scheduleTone(context, 'square', 740, 0.08, 0.05, startAt + 0.12);
		} else if (tone === 'chime') {
			scheduleTone(context, 'triangle', 880, 0.12, 0.05, startAt);
			scheduleTone(context, 'triangle', 1320, 0.25, 0.1, startAt + 0.25);
		} else {
			scheduleTone(context, 'sine', 880, 0.15, 0.05, startAt);
		}
	} catch {
		/* audio no disponible */
	}
}
