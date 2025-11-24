import jsPDF from "jspdf";

// Interfaces pour le rapport de sessions de jeu
export interface GameSessionReportItem {
  session_id: string;
  game_id: string;
  game_name: string;
  pricing_id: string;
  pricing_description: string;
  mode: string;
  player_count: number;
  total_price: number;
  cashier_username?: string;
  created_at: string;
  notes?: string;
  status: string;
}

interface GameSessionReportConfig {
  title: string;
  storeName: string;
  storePhone: string;
  dateRange: string;
  filterType: string;
}

export class GameSessionReportGenerator {
  private pdf: jsPDF;
  private config: GameSessionReportConfig;
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

  constructor(config: GameSessionReportConfig) {
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
    return date.toLocaleString("fr-FR");
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

  private addSessionDetails(sessions: GameSessionReportItem[]) {
    this.checkPageBreak();
    this.addLine("DÉTAIL DES SESSIONS DE JEU", 14, "center", true);
    this.addSpace();

    sessions.forEach((session, index) => {
      this.checkPageBreak(10);

      this.addLine(
        `Session #${index + 1} - ${session.session_id.slice(0, 8)}`,
        11,
        "left",
        true,
      );
      this.addLine(`Date: ${this.formatDate(session.created_at)}`, 9);
      this.addLine(`Jeu: ${session.game_name}`, 9);
      this.addLine(`Modalité: ${session.pricing_description}`, 9);
      this.addLine(`Mode: ${session.mode}`, 9);
      this.addLine(`Nombre de joueurs: ${session.player_count}`, 9);
      this.addLine(`Statut: ${session.status}`, 9);
      if (session.cashier_username) {
        this.addLine(`Caissier: ${session.cashier_username}`, 9);
      }
      if (session.notes) {
        this.addLine(`Notes: ${session.notes}`, 9);
      }
      this.addLine(
        `Total: ${this.formatPrice(session.total_price)}`,
        9,
        "left",
        true,
      );

      this.addSpace(3);
      this.addSeparator(0.3);
    });
  }

  private addStatistics(sessions: GameSessionReportItem[]) {
    const totalRevenue = sessions.reduce(
      (sum, session) => sum + Number(session.total_price),
      0,
    );
    const totalPlayers = sessions.reduce(
      (sum, session) => sum + Number(session.player_count),
      0,
    );
    const averageSessionAmount =
      sessions.length > 0 ? totalRevenue / sessions.length : 0;
    const averagePlayersPerSession =
      sessions.length > 0 ? totalPlayers / sessions.length : 0;

    // Statistiques par jeu
    const gameStats = sessions.reduce((acc, session) => {
      const game = session.game_name || "Inconnu";
      if (!acc[game]) {
        acc[game] = { count: 0, revenue: 0, players: 0 };
      }
      acc[game].count++;
      acc[game].revenue += Number(session.total_price);
      acc[game].players += Number(session.player_count);
      return acc;
    }, {} as Record<string, { count: number; revenue: number; players: number }>);

    // Statistiques par caissier
    const cashierStats = sessions.reduce((acc, session) => {
      const cashier = session.cashier_username || "Inconnu";
      if (!acc[cashier]) {
        acc[cashier] = { count: 0, revenue: 0 };
      }
      acc[cashier].count++;
      acc[cashier].revenue += Number(session.total_price);
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    this.addLine("RÉSUMÉ STATISTIQUES", 14, "center", true);
    this.addSpace();

    // Statistiques générales
    this.addLine("STATISTIQUES GÉNÉRALES", 12, "left", true);
    this.addLine(
      `Nombre total de sessions: ${sessions.length}`,
      10,
      "left",
    );
    this.addLine(
      `Chiffre d'affaires total: ${this.formatPrice(totalRevenue)}`,
      10,
      "left",
    );
    this.addLine(
      `Nombre total de joueurs: ${totalPlayers}`,
      10,
      "left",
    );
    this.addLine(
      `Montant moyen par session: ${this.formatPrice(averageSessionAmount)}`,
      10,
      "left",
    );
    this.addLine(
      `Moyenne de joueurs par session: ${averagePlayersPerSession.toFixed(1)}`,
      10,
      "left",
    );
    this.addSpace();

    // Statistiques par jeu
    if (Object.keys(gameStats).length > 0) {
      this.addLine("STATISTIQUES PAR JEU", 12, "left", true);
      Object.entries(gameStats).forEach(([game, stats]) => {
        this.addLine(
          `${game}: ${stats.count} sessions, ${this.formatPrice(stats.revenue)}, ${stats.players} joueurs`,
          9,
        );
      });
      this.addSpace();
    }

    // Statistiques par caissier
    if (Object.keys(cashierStats).length > 0) {
      this.addLine("STATISTIQUES PAR CAISSIER", 12, "left", true);
      Object.entries(cashierStats).forEach(([cashier, stats]) => {
        this.addLine(
          `${cashier}: ${stats.count} sessions, ${this.formatPrice(stats.revenue)}`,
          9,
        );
      });
      this.addSpace();
    }

    this.addSeparator();
  }

  public generateReport(sessions: GameSessionReportItem[]): void {
    this.yPosition = 20;
    this.addHeader();
    this.addStatistics(sessions);
    this.addSessionDetails(sessions);
    this.yPosition = this.pageHeight - 15;
    this.addLine("--- Fin du rapport ---", 10, "center", true);
  }

  public download(filename?: string): void {
    const defaultFilename = `rapport_sessions_jeu_${new Date().toISOString().split("T")[0]}.pdf`;
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

// Fonction utilitaire pour générer un rapport de sessions de jeu
export const generateGameSessionReport = async (
  sessions: GameSessionReportItem[],
  config: Partial<GameSessionReportConfig>,
  action: "download" | "print" | "preview" = "download",
) => {
  const defaultConfig: GameSessionReportConfig = {
    title: "RAPPORT DES SESSIONS DE JEU",
    storeName: "Restaurant chez Mamoune",
    storePhone: "99 83 77 77",
    dateRange: "Non spécifiée",
    filterType: "Toutes les sessions",
  };

  const finalConfig = { ...defaultConfig, ...config };
  const generator = new GameSessionReportGenerator(finalConfig);

  generator.generateReport(sessions);

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
