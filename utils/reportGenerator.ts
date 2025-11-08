import jsPDF from "jspdf";
import { Sale, SaleItem } from "@/hook/useSales";

// Interface produit pour mapping ID -> nom
interface Product {
  product_id: string;
  name: string;
}

// Interface produit pour mapping ID -> nom
interface Product {
  product_id: string;
  name: string;
}

interface ReportConfig {
  title: string;
  storeName: string;
  storePhone: string;
  dateRange: string;
  filterType: string;
}

interface ReportStats {
  totalSales: number;
  totalAmount: number;
  totalItems: number;
  averageSaleAmount: number;
  topProducts: { name: string; quantity: number; amount: number }[];
  salesByHour: { hour: string; count: number; amount: number }[];
  cashierStats: { name: string; sales: number; amount: number }[];
}

export class ReportGenerator {
  private pdf: jsPDF;
  private config: ReportConfig;
  private yPosition: number = 20;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private lineHeight: number = 6;

  constructor(config: ReportConfig) {
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

  private checkPageBreak() {
    if (this.yPosition > this.pageHeight - 30) {
      this.pdf.addPage();
      this.yPosition = 20;
    }
  }

  private addHeader() {
    // En-tête du rapport
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

  private addStatistics(stats: ReportStats) {
    this.addLine("RÉSUMÉ STATISTIQUES", 14, "center", true);
    this.addSpace();

    // Statistiques principales
    this.addLine(
      `Nombre total de ventes: ${stats.totalSales}`,
      12,
      "left",
      true,
    );
    this.addLine(
      `Montant total: ${this.formatPrice(stats.totalAmount)}`,
      12,
      "left",
      true,
    );
    this.addLine(
      `Nombre total d'articles vendus: ${stats.totalItems}`,
      12,
      "left",
      true,
    );
    this.addLine(
      `Montant moyen par vente: ${this.formatPrice(stats.averageSaleAmount)}`,
      12,
      "left",
      true,
    );

    this.addSpace();
    this.addSeparator();
  }

  private addTopProducts(
    topProducts: { name: string; quantity: number; amount: number }[],
    products: Product[],
  ) {
    this.checkPageBreak();
    this.addLine("TOP PRODUITS VENDUS", 14, "center", true);
    this.addSpace();

    // En-têtes du tableau
    this.addLine(
      "Produit                    Quantité    Montant",
      10,
      "left",
      true,
    );
    this.addSeparator(0.3);

    topProducts.slice(0, 10).forEach((product) => {
      // product.name contient l'ID du produit, chercher le nom correspondant
      const prod = products.find((p) => p.product_id === product.name);
      const productName = prod ? prod.name : product.name.slice(0, 15);
      const line = `${productName.padEnd(25)} ${product.quantity
        .toString()
        .padStart(8)} ${this.formatPrice(product.amount).padStart(12)}`;
      this.addLine(line, 9);
      this.checkPageBreak();
    });

    this.addSpace();
    this.addSeparator();
  }

  private addCashierStats(
    cashierStats: { name: string; sales: number; amount: number }[],
  ) {
    this.checkPageBreak();
    this.addLine("STATISTIQUES PAR CAISSIER", 14, "center", true);
    this.addSpace();

    // En-têtes du tableau
    this.addLine("Caissier              Ventes    Montant", 10, "left", true);
    this.addSeparator(0.3);

    cashierStats.forEach((cashier) => {
      const line = `${cashier.name.padEnd(20)} ${cashier.sales.toString().padStart(6)} ${this.formatPrice(cashier.amount).padStart(12)}`;
      this.addLine(line, 9);
      this.checkPageBreak();
    });

    this.addSpace();
    this.addSeparator();
  }

  private addSalesDetails(sales: Sale[], products: Product[]) {
    this.checkPageBreak();
    this.addLine("DÉTAIL DES VENTES", 14, "center", true);
    this.addSpace();

    sales.forEach((sale, index) => {
      this.checkPageBreak();

      this.addLine(
        `Vente #${index + 1} - ${sale.sale_id.slice(0, 8)}`,
        11,
        "left",
        true,
      );
      this.addLine(`Date: ${this.formatDate(sale.date)}`, 9);
      this.addLine(`Caissier: ${sale.username}`, 9);
      this.addLine(
        `Montant: ${this.formatPrice(sale.total_amount)}`,
        9,
        "left",
        true,
      );

      if (sale.items && sale.items.length > 0) {
        this.addLine("Articles:", 9, "left", true);
        sale.items.forEach((item) => {
          const product = products.find(
            (p) => p.product_id === item.product_id,
          );
          const productName = product
            ? product.name
            : item.product_id
              ? item.product_id.slice(0, 15)
              : "Produit inconnu";
          const itemLine = `  - ${productName} (Qté: ${item.quantity}, Prix: ${this.formatPrice(item.unit_price)})`;
          this.addLine(itemLine, 8);
          this.checkPageBreak();
        });
      }

      this.addSpace(3);
      this.addSeparator(0.3);
    });
  }

  private calculateStats(sales: Sale[]): ReportStats {
    const totalSales = sales.length;
    const totalAmount = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0,
    );
    const totalItems = sales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const averageSaleAmount = totalSales > 0 ? totalAmount / totalSales : 0;

    // Calcul des produits les plus vendus
    const productStats: {
      [key: string]: { quantity: number; amount: number };
    } = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productId = item.product_id;
        if (!productStats[productId]) {
          productStats[productId] = { quantity: 0, amount: 0 };
        }
        productStats[productId].quantity += item.quantity;
        productStats[productId].amount += Number(item.total_price);
      });
    });

    const topProducts = Object.entries(productStats)
      .map(([id, stats]) => ({
        name: id, // Garder l'ID complet pour le mapping
        quantity: stats.quantity,
        amount: stats.amount,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    // Statistiques par caissier
    const cashierStats: { [key: string]: { sales: number; amount: number } } =
      {};
    sales.forEach((sale) => {
      if (!cashierStats[sale.username]) {
        cashierStats[sale.username] = { sales: 0, amount: 0 };
      }
      cashierStats[sale.username].sales += 1;
      cashierStats[sale.username].amount += Number(sale.total_amount);
    });

    const cashierStatsArray = Object.entries(cashierStats).map(
      ([name, stats]) => ({
        name,
        sales: stats.sales,
        amount: stats.amount,
      }),
    );

    // Ventes par heure (placeholder)
    const salesByHour: { hour: string; count: number; amount: number }[] = [];

    return {
      totalSales,
      totalAmount,
      totalItems,
      averageSaleAmount,
      topProducts,
      salesByHour,
      cashierStats: cashierStatsArray,
    };
  }

  public generateReport(sales: Sale[], products: Product[] = []): void {
    // Reset position
    this.yPosition = 20;

    // Calculer les statistiques
    const stats = this.calculateStats(sales);

    // Générer le rapport
    this.addHeader();
    this.addStatistics(stats);
    this.addTopProducts(stats.topProducts, products);
    this.addCashierStats(stats.cashierStats);
    this.addSalesDetails(sales, products);

    // Pied de page
    this.yPosition = this.pageHeight - 15;
    this.addLine("--- Fin du rapport ---", 10, "center", true);
  }

  public download(filename?: string): void {
    const defaultFilename = `rapport_ventes_${new Date().toISOString().split("T")[0]}.pdf`;
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

// Fonction utilitaire pour générer un rapport de ventes
export const generateSalesReport = async (
  sales: Sale[],
  config: Partial<ReportConfig>,
  action: "download" | "print" | "preview" = "download",
) => {
  const defaultConfig: ReportConfig = {
    title: "RAPPORT DE VENTES",
    storeName: "Restaurant chez Mamoune",
    storePhone: "92 70 81 13",
    dateRange: "Non spécifiée",
    filterType: "Toutes les ventes",
  };

  const finalConfig = { ...defaultConfig, ...config };
  const generator = new ReportGenerator(finalConfig);

  // Récupérer la liste des produits pour afficher les noms
  let products: Product[] = [];
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
      products = data.products || [];
    }
  } catch (e) {
    // ignore, fallback to IDs
  }

  // Générer le rapport avec les noms d'articles
  generator.generateReport(sales, products);

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
