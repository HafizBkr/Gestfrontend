import jsPDF from "jspdf";

// Interfaces pour le rapport de dépenses
export interface ExpenseReportItem {
  expense_id: string;
  expense_category_id: string;
  category_name: string;
  amount: number;
  description?: string;
  date: string;
}

interface ExpenseReportConfig {
  title: string;
  storeName: string;
  storePhone: string;
  dateRange: string;
  filterType: string;
}

export class ExpenseReportGenerator {
  private pdf: jsPDF;
  private config: ExpenseReportConfig;
  private yPosition: number = 20;
  private pageWidth: number = 210;
  private pageHeight: number = 297;
  private margin: number = 20;
  private lineHeight: number = 6;

  // Tronque le texte pour qu'il tienne dans la largeur max sans retour à la ligne
  private truncateText(
    text: string,
    maxWidth: number,
    fontSize = 10,
    fontStyle = "normal",
  ) {
    this.pdf.setFont("helvetica", fontStyle);
    this.pdf.setFontSize(fontSize);
    let truncated = text;
    while (
      this.pdf.getTextWidth(truncated) > maxWidth &&
      truncated.length > 0
    ) {
      truncated = truncated.slice(0, -1);
    }
    if (truncated.length < text.length) {
      truncated = truncated.slice(0, -1) + "…";
    }
    return truncated;
  }

  constructor(config: ExpenseReportConfig) {
    this.config = config;
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  }

  private addTitle(text: string, fontSize: number = 16, bold: boolean = true) {
    this.pdf.setFont("helvetica", bold ? "bold" : "normal");
    this.pdf.setFontSize(fontSize);
    const textWidth = this.pdf.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    this.pdf.text(text, x, this.yPosition);
    this.yPosition += fontSize / 2 + 5;
  }

  private addLine(
    text: string,
    fontSize: number = 10,
    align: "left" | "center" | "right" = "left",
    bold: boolean = false,
  ) {
    this.pdf.setFont("helvetica", bold ? "bold" : "normal");
    this.pdf.setFontSize(fontSize);
    const textWidth = this.pdf.getTextWidth(text);
    let x = this.margin;
    if (align === "center") {
      x = (this.pageWidth - textWidth) / 2;
    } else if (align === "right") {
      x = this.pageWidth - textWidth - this.margin;
    }
    this.pdf.text(text, x, this.yPosition);
    this.yPosition += this.lineHeight;
  }

  private addSeparator(thickness: number = 0.5) {
    this.pdf.setLineWidth(thickness);
    this.pdf.line(
      this.margin,
      this.yPosition,
      this.pageWidth - this.margin,
      this.yPosition,
    );
    this.yPosition += 5;
  }

  private addSpace(height: number = 5) {
    this.yPosition += height;
  }

  private formatPrice(price: number): string {
    return (
      price
        .toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        .replace(/\u202F|\u00A0/g, " ") + " FCFA"
    );
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  }

  private checkPageBreak(extraLines = 1) {
    if (this.yPosition + extraLines * this.lineHeight > this.pageHeight - 30) {
      this.pdf.addPage();
      this.yPosition = 20;
    }
  }

  private addHeader() {
    this.addTitle(this.config.storeName, 18, true);
    this.addLine(`Tel: ${this.config.storePhone}`, 12, "center");
    this.addSpace(10);
    this.addTitle(this.config.title, 16, true);
    this.addLine(`Période: ${this.config.dateRange}`, 12, "center");
    this.addLine(`Type de filtre: ${this.config.filterType}`, 10, "center");
    this.addLine(
      `Généré le: ${new Date().toLocaleString("fr-FR")}`,
      10,
      "center",
    );
    this.addSeparator(1);
    this.addSpace();
  }

  private addExpenseDetails(expenses: ExpenseReportItem[]) {
    this.checkPageBreak();
    this.addLine("DÉTAIL DES DÉPENSES", 14, "center", true);
    this.addSpace();

    expenses.forEach((expense, index) => {
      this.checkPageBreak(8);

      this.addLine(
        `Dépense #${index + 1} - ${expense.expense_id.slice(0, 8)}`,
        11,
        "left",
        true,
      );
      this.addLine(`Date: ${this.formatDate(expense.date)}`, 9);
      this.addLine(`Catégorie: ${expense.category_name}`, 9);
      if (expense.description) {
        this.addLine(`Description: ${expense.description}`, 9);
      }
      this.addLine(
        `Montant: ${this.formatPrice(expense.amount)}`,
        9,
        "left",
        true,
      );

      this.addSpace(3);
      this.addSeparator(0.3);
    });
  }

  private addStatistics(expenses: ExpenseReportItem[]) {
    const totalAmount = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );
    this.addLine("RÉSUMÉ STATISTIQUES", 14, "center", true);
    this.addSpace();
    this.addLine(
      `Nombre total de dépenses: ${expenses.length}`,
      12,
      "left",
      true,
    );
    this.addLine(
      `Montant total: ${this.formatPrice(totalAmount)}`,
      12,
      "left",
      true,
    );
    this.addSpace();
    this.addSeparator();
  }

  public generateReport(expenses: ExpenseReportItem[]): void {
    this.yPosition = 20;
    this.addHeader();
    this.addStatistics(expenses);
    this.addExpenseDetails(expenses);
    this.yPosition = this.pageHeight - 15;
    this.addLine("--- Fin du rapport ---", 10, "center", true);
  }

  public download(filename?: string): void {
    const defaultFilename = `rapport_depenses_${new Date().toISOString().split("T")[0]}.pdf`;
    this.pdf.save(filename || defaultFilename);
  }

  public print(): void {
    this.pdf.autoPrint();
    window.open(this.pdf.output("bloburl"), "_blank");
  }

  public preview(): void {
    window.open(this.pdf.output("bloburl"), "_blank");
  }
}

// Fonction utilitaire pour générer un rapport de dépenses
export const generateExpenseReport = async (
  expenses: ExpenseReportItem[],
  config: Partial<ExpenseReportConfig>,
  action: "download" | "print" | "preview" = "download",
) => {
  const defaultConfig: ExpenseReportConfig = {
    title: "RAPPORT DES DÉPENSES",
    storeName: "Restaurant chez Mamoune",
    storePhone: "99 83 77 77",
    dateRange: "Non spécifiée",
    filterType: "Toutes les dépenses",
  };

  const finalConfig = { ...defaultConfig, ...config };
  const generator = new ExpenseReportGenerator(finalConfig);

  generator.generateReport(expenses);

  switch (action) {
    case "download":
      generator.download();
      break;
    case "print":
      generator.print();
      break;
    case "preview":
      generator.preview();
      break;
  }
};
