import jsPDF from "jspdf";

export interface GameSessionReceiptConfig {
  storeName: string;
  storePhone: string;
}

export interface GameSessionReceiptData {
  session_id: string;
  game_name: string;
  pricing_description: string;
  mode: string;
  player_count: number;
  price_per_person: number;
  total_price: number;
  cashier_name: string;
  date: string; // ISO string
  notes?: string;
}

const defaultConfig: GameSessionReceiptConfig = {
  storeName: "Restaurant chez Mamoune",
  storePhone: "99 83 77 77",
};

export class GameSessionReceiptGenerator {
  private pdf: jsPDF;
  private config: GameSessionReceiptConfig;
  private yPosition: number = 20;
  private pageWidth: number = 80;
  private margin: number = 3;

  constructor(config: Partial<GameSessionReceiptConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [this.pageWidth, 200],
    });
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

  private formatPrice(price: number): string {
    // Utilise un espace insécable ou un point comme séparateur de milliers
    // (par défaut, toLocaleString("fr-FR") met un espace insécable)
    // Pour forcer le point, remplacer l'espace insécable par un point
    let formatted = price.toLocaleString("fr-FR", {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    // Remplacer l'espace insécable par un point OU un espace normal selon préférence
    // Pour un espace normal :
    // formatted = formatted.replace(/\u202f/g, " ");
    // Pour un point :
    formatted = formatted.replace(/\u202f/g, ".");
    return formatted + " FCFA";
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

  private addSessionInfo(data: GameSessionReceiptData) {
    this.pdf.setFont("courier", "bold");
    const receiptNum = data.session_id.slice(0, 8);
    this.addLine(`N° Session: ${receiptNum}`, 11);

    // Date and time
    this.addLine(`Date: ${this.formatDate(data.date)}`, 11);

    // Cashier
    this.addLine(`Caissier: ${data.cashier_name}`, 11);

    this.addSeparator();
  }

  private addGameInfo(data: GameSessionReceiptData) {
    this.pdf.setFont("courier", "bold");
    this.addLine("SESSION DE JEU", 12, "center");
    this.addSpace(2);

    this.addLine(`Jeu: ${data.game_name}`, 11);
    this.addLine(`Modalité: ${data.pricing_description}`, 11);
    this.addLine(`Mode: ${data.mode}`, 11);
    this.addLine(`Joueurs: ${data.player_count}`, 11);

    this.addSeparator();
  }

  private addPricingInfo(data: GameSessionReceiptData) {
    this.pdf.setFont("courier", "bold");
    this.addLine(
      `Prix unitaire: ${this.formatPrice(data.price_per_person)}`,
      11,
    );
    this.addLine(`Total: ${this.formatPrice(data.total_price)}`, 13);
    this.addSeparator();
  }

  private addNotes(notes?: string) {
    if (notes && notes.trim().length > 0) {
      this.addLine("Notes:", 10);
      this.addLine(notes, 10);
      this.addSeparator();
    }
  }

  private addFooter() {
    this.addSpace(3);

    // Thank you message
    this.pdf.setFont("courier", "bold");
    this.addLine("Merci pour votre visite!", 10, "center");
    this.addLine("Conservez votre reçu", 10, "center");
  }

  public generateReceipt(data: GameSessionReceiptData): void {
    // Reset position
    this.yPosition = 15;

    // Generate receipt content
    this.addHeader();
    this.addSessionInfo(data);
    this.addGameInfo(data);
    this.addPricingInfo(data);
    this.addNotes(data.notes);
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
    this.addSessionInfo(data);
    this.addGameInfo(data);
    this.addPricingInfo(data);
    this.addNotes(data.notes);
    this.addFooter();
  }

  public download(filename: string): void {
    this.pdf.save(filename);
  }

  public print(): void {
    this.pdf.autoPrint();
    window.open(this.pdf.output("bloburl"), "_blank");
  }

  public preview(): void {
    window.open(this.pdf.output("bloburl"), "_blank");
  }

  public getBlob(): Blob {
    return this.pdf.output("blob");
  }
}

// Helper function to generate and download/print/preview a game session receipt
export const generateGameSessionReceipt = (
  data: GameSessionReceiptData,
  action: "download" | "print" | "preview" = "download",
) => {
  const generator = new GameSessionReceiptGenerator();
  generator.generateReceipt(data);

  switch (action) {
    case "download":
      generator.download(`recu_session_${data.session_id}.pdf`);
      break;
    case "print":
      generator.print();
      break;
    case "preview":
      generator.preview();
      break;
  }
};
