import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";

const EMAIL = "bob62138@gmail.com";

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("Atelier Vecteur - Suggestion / Correction");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const body = `${message}\n\nApplication : Atelier Vecteur`;
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const copy = async () => {
    await navigator.clipboard.writeText(`À : ${EMAIL}\nSujet : ${subject}\n\n${body}`);
    setNotice("Adresse et message copiés.");
  };
  return <div className="dialog-overlay" onClick={onClose}><div className="dialog feedback-dialog" onClick={(e) => e.stopPropagation()}>
    <div className="about-header"><div><h3>Suggestion / Correction</h3><p>Proposez une amélioration ou décrivez un problème.</p></div><button className="about-close" onClick={onClose}>×</button></div>
    <label>Sujet<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
    <label>Message<textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Expliquez votre suggestion ou les étapes du problème…" /></label>
    {notice && <p className="feedback-notice">{notice}</p>}
    <div className="dialog-actions"><button onClick={() => void copy()}>Copier</button><button disabled={!message.trim()} onClick={() => void openUrl(mailto)}>Envoyer</button></div>
  </div></div>;
}
