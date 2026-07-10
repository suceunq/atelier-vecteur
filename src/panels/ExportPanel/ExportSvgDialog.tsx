import { exportSvg } from "../../io/svgExport";

export function ExportSvgDialog() {
  return (
    <button className="menu-item" onClick={() => void exportSvg()}>
      Exporter en SVG…
    </button>
  );
}
