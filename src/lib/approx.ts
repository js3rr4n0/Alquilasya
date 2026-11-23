/**
 * Ubicación aproximada para el público: las coordenadas se redondean a una
 * cuadrícula de ~330 m, así el mapa muestra la zona sin delatar la casa.
 * La dirección exacta la da el dueño al coordinar la visita.
 */
const STEP = 0.003;

export const approx = (v: number) => Math.round(Math.round(v / STEP) * STEP * 1e5) / 1e5;
