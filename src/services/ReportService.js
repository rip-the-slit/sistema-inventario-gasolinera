import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export default class ReportService {
  #permissions = {
    generateTicketReport: [null, "employee", "admin"],
  };

  async generateTicketReport(ticket) {
    this.#validateTicket(ticket);

    const accepted = ticket.status.success;
    const document = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Arial", size: 22 },
            paragraph: { spacing: { after: 160 } },
          },
        },
      },
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: 'ESTACIÓN DE SERVICIOS "ORICHUNA.CA"',
                  bold: true,
                  size: 30,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 360 },
              children: [
                new TextRun(
                  `Fecha de emisión: ${this.#formatDate(ticket.emissionDate)}`
                ),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: {
                top: { style: BorderStyle.SINGLE, size: 12, color: "202020" },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: "202020" },
                left: { style: BorderStyle.SINGLE, size: 12, color: "202020" },
                right: { style: BorderStyle.SINGLE, size: 12, color: "202020" },
              },
              spacing: { before: 120, after: 360 },
              children: [
                new TextRun({
                  text: "NÚMERO DE TURNO",
                  bold: true,
                  size: 24,
                }),
                new TextRun({
                  text: String(ticket.id),
                  bold: true,
                  break: 1,
                  size: 72,
                }),
              ],
            }),
            this.#heading("Datos del vehículo"),
            this.#field("Placa", ticket.vehicle.plateNumber),
            this.#field("Color", ticket.vehicle.colour),
            this.#field("Modelo", ticket.vehicle.model),
            this.#heading("Estatus"),
            new Paragraph({
              children: [
                new TextRun({
                  text: accepted ? "ACEPTADO" : "CANCELADO",
                  bold: true,
                  color: accepted ? "247A3D" : "A12A21",
                  size: 26,
                }),
              ],
            }),
            ...(accepted
              ? [
                  this.#field("Tipo de vehículo", ticket.vehicle.type),
                  this.#field(
                    "Combustible asignado",
                    `${ticket.status?.quantity ?? ticket.quantity} litros`
                  ),
                ]
              : [
                  this.#field(
                    "Motivo de la cancelación",
                    ticket.status?.message
                  ),
                ]),
            this.#heading("Código de verificación"),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: String(ticket.verificationCode),
                  bold: true,
                  size: 44,
                  characterSpacing: 120,
                }),
              ],
            }),
          ],
        },
      ],
    });

    return Packer.toBlob(document);
  }

  getPermissions() {
    return Object.fromEntries(
      Object.entries(this.#permissions).map(([action, roles]) => [
        action,
        [...roles],
      ])
    );
  }

  #heading(text) {
    return new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, size: 26 })],
    });
  }

  #field(label, value) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun(String(value ?? "No especificado")),
      ],
    });
  }

  #formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error("La fecha de emisión del ticket no es válida.");
    }

    return new Intl.DateTimeFormat("es-VE", { dateStyle: "long" }).format(date);
  }
  
  #validateTicket(ticket) {
    if (!ticket || typeof ticket !== "object") {
      throw new TypeError(
        "Se requiere un ticket válido para generar el reporte."
      );
    }

    if (!ticket.vehicle || typeof ticket.vehicle !== "object") {
      throw new TypeError("El ticket debe incluir los datos del vehículo.");
    }

    if (!Number.isInteger(ticket.id) || ticket.id < 1 || ticket.id > 20) {
      throw new TypeError("El número de turno debe estar entre 1 y 20.");
    }

    if (!/^\d{3}$/.test(String(ticket.verificationCode))) {
      throw new TypeError(
        "El código de verificación debe tener tres dígitos."
      );
    }
  }
}
