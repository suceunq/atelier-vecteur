import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const [version, setVersion] = useState("…");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("inconnue"));
  }, []);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog about-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="about-header">
          <div>
            <h3>À propos d’Atelier Vecteur</h3>
            <p>Version {version}</p>
          </div>
          <button className="about-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <section>
          <h4>Atelier Vecteur</h4>
          <p>
            Éditeur vectoriel de bureau pour créer, modifier et exporter des illustrations SVG.
            Il réunit formes, plume, texte, édition de nœuds, calques, plans de travail, dégradés,
            motifs, filtres et vectorisation d’images dans une interface entièrement en français.
          </p>
        </section>

        <section>
          <h4>Crédits</h4>
          <p>Conception et développement : bob59</p>
          <p>Construit avec Tauri, Rust, React et TypeScript.</p>
          <p>Vectorisation et rendu assurés notamment par vtracer et resvg.</p>
        </section>

        <footer>Créé par bob59 · © 2026</footer>

        <div className="dialog-actions">
          <button onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
