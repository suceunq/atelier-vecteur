import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { useI18n } from "../i18n/useI18n";

const EMAIL = "bob62138@gmail.com";

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [subject, setSubject] = useState(() => t("feedback.defaultSubject"));
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const body = `${message}\n\n${t("feedback.application")}`;
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const copy = async () => {
    await navigator.clipboard.writeText(`${t("feedback.to")} : ${EMAIL}\n${t("feedback.subject")} : ${subject}\n\n${body}`);
    setNotice(t("feedback.copied"));
  };
  return <div className="dialog-overlay" onClick={onClose}><div className="dialog feedback-dialog" onClick={(e) => e.stopPropagation()}>
    <div className="about-header"><div><h3>{t("feedback.title")}</h3><p>{t("feedback.subtitle")}</p></div><button className="about-close" aria-label={t("common.close")} onClick={onClose}>×</button></div>
    <label>{t("feedback.subject")}<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
    <label>{t("feedback.message")}<textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("feedback.placeholder")} /></label>
    {notice && <p className="feedback-notice">{notice}</p>}
    <div className="dialog-actions"><button onClick={() => void copy()}>{t("common.copy")}</button><button disabled={!message.trim()} onClick={() => void openUrl(mailto)}>{t("common.send")}</button></div>
  </div></div>;
}
