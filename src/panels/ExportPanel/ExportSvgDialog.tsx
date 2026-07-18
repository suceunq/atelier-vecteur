import { exportSvg } from "../../io/svgExport";
import { useI18n } from "../../i18n/useI18n";

export function ExportSvgDialog() {
  const { t } = useI18n();
  return (
    <button className="menu-item" onClick={() => void exportSvg()}>
      {t("menu.exportSvg")}
    </button>
  );
}
