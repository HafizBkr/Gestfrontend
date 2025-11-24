import jsPDF from "jspdf";
// Import compatible with both admin and cashier sales
type SaleItem = {
  sale_item_id?: string;
  sale_id?: string;
  product_id: string;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
};

type Sale = {
  sale_id: string;
  receipt_number: string; // Obligatoire pour uniformiser le numéro de reçu
  cashier_id?: string;
  username: string;
  date: string;
  total_amount: string | number;
  items: SaleItem[];
};

interface Product {
  product_id: string;
  name: string;
  category_id: string;
  quantity: number;
  purchase_price: string;
  sale_price: string;
  description?: string;
  supplier?: string;
}

interface ReceiptConfig {
  storeName: string;
  storePhone: string;
}

const defaultConfig: ReceiptConfig = {
  storeName: "Restaurant chez Mamoune",
  storePhone: "99 83 77 77",
};

export class ReceiptGenerator {
  private pdf: jsPDF;
  private config: ReceiptConfig;
  private yPosition: number = 20;
  private pageWidth: number = 80;
  private margin: number = 3;
  private products: Product[] = [];

  constructor(config: Partial<ReceiptConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [this.pageWidth, 200],
    });
  }

  private async fetchProducts(): Promise<Product[]> {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;
      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

      const response = await fetch(`${baseUrl}/admin/products`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.products || [];
      }
      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      return [];
    }
  }

  private getProductName(productId: string): string {
    const product = this.products.find((p) => p.product_id === productId);
    return product ? product.name : productId.slice(0, 15);
  }

  private addLine(
    text: string,
    fontSize: number = 12,
    align: "left" | "center" | "right" = "left",
  ) {
    this.pdf.setFontSize(fontSize);

    const textWidth = this.pdf.getTextWidth(text);
    let x = this.margin;

    if (align === "center") {
      x = (this.pageWidth - textWidth) / 2;
    } else if (align === "right") {
      x = this.pageWidth - textWidth - this.margin;
    }

    this.pdf.text(text, x, this.yPosition);
    this.yPosition += fontSize / 2 + 2;
  }

  private addSeparator(char: string = "-") {
    const separatorWidth = Math.floor((this.pageWidth - 2 * this.margin) / 1.5);
    const separator = char.repeat(separatorWidth);
    this.addLine(separator, 6, "center");
  }

  private addSpace(height: number = 3) {
    this.yPosition += height;
  }

  private formatPrice(price: string | number): string {
    const numPrice = typeof price === "string" ? Number(price) : price;
    return numPrice.toFixed(0) + " FCFA";
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private addHeader() {
    this.pdf.setFont("courier", "bold");
    this.addLine(this.config.storeName, 13, "center");
    this.pdf.setFont("courier", "bold");
    this.addLine(`Tel: ${this.config.storePhone}`, 14, "center");
    this.addSeparator();
  }

  private addSaleInfo(sale: Sale & { receipt_number?: string }) {
    this.pdf.setFont("courier", "bold");
    const receiptNum = sale.sale_id.slice(0, 8);
    this.addLine(`N° Reçu: ${receiptNum}`, 11);

    // Date and time
    this.addLine(`Date: ${this.formatDate(sale.date)}`, 11);

    // Cashier
    this.addLine(`Caissier: ${sale.username}`, 11);

    this.addSeparator();
  }

  private addItems(items: SaleItem[]) {
    this.pdf.setFont("courier", "bold");
    this.addLine("ARTICLES:", 12);
    this.pdf.setFont("courier", "bold");

    items.forEach((item, index) => {
      const quantity = item.quantity;
      const unitPrice = Number(item.unit_price);
      const totalPrice = Number(item.total_price);

      // Product line avec nom du produit
      this.addLine(`${this.getProductName(item.product_id)}`, 11);
      this.addLine(
        `${quantity} x ${this.formatPrice(unitPrice)} = ${this.formatPrice(totalPrice)}`,
        10,
      );
      this.addSpace(2);
    });

    this.addSeparator();
  }

  private addTotals(sale: Sale) {
    // Total (sans TVA)
    this.pdf.setFont("courier", "bold");
    this.addLine(`TOTAL: ${this.formatPrice(Number(sale.total_amount))}`, 13);
    this.pdf.setFont("courier", "bold");

    this.addSeparator();
  }

  private addFooter() {
    this.addSpace(3);

    // Thank you message
    this.pdf.setFont("courier", "bold");
    this.addLine("Merci pour votre visite!", 10, "center");
    this.addLine("Conservez votre reçu", 10, "center");
  }

  public async generateReceipt(sale: Sale): Promise<void> {
    // Fetch products for name resolution
    this.products = await this.fetchProducts();

    // Reset position
    this.yPosition = 15;

    // Generate receipt content
    this.addHeader();
    this.addSaleInfo(sale);
    this.addItems(sale.items);
    this.addTotals(sale);
    this.addFooter();

    // Adjust page height to content
    const finalHeight = this.yPosition + 10;
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [this.pageWidth, finalHeight],
    });

    // Regenerate with correct height
    this.yPosition = 15;
    this.addHeader();
    this.addSaleInfo(sale);
    this.addItems(sale.items);
    this.addTotals(sale);
    this.addFooter();
  }

  public download(filename: string): void {
    this.pdf.save(filename);
  }

  public print(): void {
    // Open print dialog
    this.pdf.autoPrint();
    window.open(this.pdf.output("bloburl"), "_blank");
  }

  public preview(): void {
    // Open PDF in new tab for preview
    window.open(this.pdf.output("bloburl"), "_blank");
  }

  public getBlob(): Blob {
    return this.pdf.output("blob");
  }
}

// Helper function to generate and download receipt
export const generateSaleReceipt = async (
  sale: Sale,
  action: "download" | "print" | "preview" = "download",
) => {
  const generator = new ReceiptGenerator();
  await generator.generateReceipt(sale);

  switch (action) {
    case "download":
      generator.download(`recu_${sale.sale_id}.pdf`);
      break;
    case "print":
      generator.print();
      break;
    case "preview":
      generator.preview();
      break;
  }
};

// Helper function for batch receipt generation
export const generateMultipleReceipts = async (
  sales: Sale[],
  action: "download" | "preview" = "download",
) => {
  if (sales.length === 0) return;

  if (sales.length === 1) {
    await generateSaleReceipt(sales[0], action);
    return;
  }

  // For multiple receipts, create a combined PDF
  const generator = new ReceiptGenerator();

  for (let index = 0; index < sales.length; index++) {
    const sale = sales[index];
    if (index > 0) {
      // Add new page for each receipt after the first
      generator["pdf"].addPage([generator["pageWidth"], 200]);
      generator["yPosition"] = 15;
    }
    await generator.generateReceipt(sale);
  }

  switch (action) {
    case "download":
      generator.download(`recus_${sales.length}_ventes.pdf`);
      break;
    case "preview":
      generator.preview();
      break;
  }
};
