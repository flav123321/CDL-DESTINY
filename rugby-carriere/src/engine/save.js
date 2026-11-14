import { eventById } from './events.js';
import { positionById } from '../data/positions.js';

export const SAVE_KEY = 'rugby-carriere-v1';
const PHASES = ['centre', 'bilan', 'offres', 'pro', 'fin'];

const storageOrNull = (s) => s ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined);

export function save(state, storage) {
  try { storageOrNull(storage).setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

export function load(storage) {
  try {
    const st = storage === undefined ? storageOrNull(undefined) : storage;
    if (!st) return null;
    const raw = st.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !s.player || typeof s.rngState !== 'number') return null;
    if (!PHASES.includes(s.phase) || !s.saisonStats || !s.player.stats || !positionById(s.player.positionId)) return null;
    // un événement supprimé ou renommé par une mise à jour ne doit pas bloquer la partie
    if (s.evenementEnCours && !eventById(s.evenementEnCours)) s.evenementEnCours = null;
    if (s.phase === 'offres' && !s.offresContrat?.length) return null;
    return s;
  } catch { return null; }
}

export function clearSave(storage) {
  try { storageOrNull(storage).removeItem(SAVE_KEY); } catch { /* rien */ }
}
