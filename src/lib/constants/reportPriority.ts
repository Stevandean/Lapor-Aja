export const REPORT_PRIORITY_LABELS = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
  darurat: "Darurat",
} as const;

export const REPORT_PRIORITY_BADGE_CLASSES = {
  rendah: "bg-muted text-muted-foreground border-border",
  sedang: "bg-info-50 text-info-700 border-info-100",
  tinggi: "bg-warning-50 text-warning-700 border-warning-100",
  darurat: "bg-danger-50 text-danger-700 border-danger-100",
} as const;