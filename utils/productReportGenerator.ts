import jsPDF from "jspdf";

// Interface produit pour le rapport
export interface ProductReportItem {
  product_id: string;
  name: string;
  category_name: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  is_active: boolean;
}

interface ProductReportConfig {
  title: string;
  storeName: string;
  storePhone: string;
  date: string;
}

export class ProductReportGenerator {
  private pdf: jsPDF;
  private config: ProductReportConfig;
  private yPosition: number = 20;
  private pageWidth: number = 210;
  private pageHeight: number = 297;
  private margin: number = 20;
  private lineHeight: number = 6;

  constructor(config: ProductReportConfig) {
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
    return price.toFixed(0) + " FCFA";
  }

  private checkPageBreak() {
    if (this.yPosition > this.pageHeight - 30) {
      this.pdf.addPage();
      this.yPosition = 20;
    }
  }

  private addHeader() {
    this.addTitle(this.config.storeName, 18, true);
    this.addLine(`Tel: ${this.config.storePhone}`, 12, "center");
    this.addSpace(10);
    this.addTitle(this.config.title, 16, true);
    this.addLine(`Date: ${this.config.date}`, 12, "center");
    this.addLine(
      `Généré le: ${new Date().toLocaleString("fr-FR")}`,
      10,
      "center",
    );
    this.addSeparator(1);
    this.addSpace();
  }

  // Affiche les produits dans un vrai tableau PDF
  private addProductTable(products: ProductReportItem[]) {
    // Largeurs des colonnes (en mm)
    const colWidths = [40, 32, 22, 22, 18, 20];
    const headers = [
      "Produit",
      "Catégorie",
      "Achat",
      "Vente",
      "Stock",
      "Statut",
    ];
    const startX = this.margin;
    let y = this.yPosition;

    // En-tête du tableau
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(10);
    let x = startX;
    headers.forEach((header, i) => {
      this.pdf.text(header, x, y);
      x += colWidths[i];
    });
    y += this.lineHeight;
    // Ligne supprimée ici (pas de ligne horizontale sous l'en-tête)
    y += 2;

    // Lignes du tableau
    this.pdf.setFont("helvetica", "normal");
    products.forEach((product) => {
      this.checkPageBreak();
      x = startX;
      // Produit
      this.pdf.text(String(product.name).slice(0, 25), x, y);
      x += colWidths[0];
      // Catégorie
      this.pdf.text(String(product.category_name).slice(0, 18), x, y);
      x += colWidths[1];
      // Achat
      this.pdf.text(this.formatPrice(product.purchase_price), x, y, {
        maxWidth: colWidths[2] - 2,
      });
      x += colWidths[2];
      // Vente
      this.pdf.text(this.formatPrice(product.sale_price), x, y, {
        maxWidth: colWidths[3] - 2,
      });
      x += colWidths[3];
      // Stock
      this.pdf.text(String(product.quantity), x, y, {
        maxWidth: colWidths[4] - 2,
      });
      x += colWidths[4];
      // Statut
      this.pdf.text(product.is_active ? "Actif" : "Inactif", x, y, {
        maxWidth: colWidths[5] - 2,
      });
      y += this.lineHeight;
      this.yPosition = y;
      this.checkPageBreak();
    });

    this.yPosition = y + 5;
    this.addSeparator();
  }

  public generateReport(products: ProductReportItem[]): void {
    this.yPosition = 20;
    this.addHeader();
    this.addProductTable(products);
    this.yPosition = this.pageHeight - 15;
    this.addLine("--- Fin du rapport ---", 10, "center", true);
  }

  public download(filename?: string): void {
    const defaultFilename = `rapport_produits_${new Date().toISOString().split("T")[0]}.pdf`;
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

// Fonction utilitaire pour générer un rapport de produits
export const generateProductReport = async (
  products: ProductReportItem[],
  config: Partial<ProductReportConfig>,
  action: "download" | "print" | "preview" = "download",
) => {
  const defaultConfig: ProductReportConfig = {
    title: "RAPPORT DES PRODUITS",
    storeName: "Restaurant chez Mamoune",
    storePhone: "99 83 77 77",
    date: new Date().toLocaleDateString("fr-FR"),
  };

  const finalConfig = { ...defaultConfig, ...config };
  const generator = new ProductReportGenerator(finalConfig);

  generator.generateReport(products);

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
