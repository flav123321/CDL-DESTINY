export function renderAccueil(ui) {
  return `<div class="hero"><div class="ball">🏉</div><h1>Rugby Carrière</h1>
    <p class="muted">Du centre de formation au Bouclier de Brennus.</p></div>
    <button class="btn primary" data-action="nouvelle">Nouvelle carrière</button>
    <button class="btn ghost" data-action="continuer" ${ui.sauvegarde ? '' : 'disabled'}>Continuer
      ${ui.sauvegarde ? `<small>${ui.sauvegarde.player.prenom} ${ui.sauvegarde.player.nom}, ${ui.sauvegarde.player.age} ans</small>` : '<small>Aucune sauvegarde</small>'}</button>
    ${ui.erreur ? '<p class="muted">⚠️ Un problème est survenu avec cette partie. Tu peux en lancer une nouvelle.</p>' : ''}
    ${ui.stockageKo ? '<p class="muted">⚠️ La sauvegarde n’est pas disponible sur ce navigateur (navigation privée ?). Ta carrière ne sera pas gardée.</p>' : ''}
    <p class="footer muted">Saison de départ 2026-27 · effectifs réels du Top 14</p>`;
}
