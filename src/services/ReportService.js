import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import Service from "./Service.js";

export default class ReportService extends Service {
  constructor() {
    super({ generateTicketReport: [null, "employee", "admin"] });
  }

  async generateTicketReport(ticket) {
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
            new Paragraph({
              children: [
                new TextRun({ text: "Color:", bold: true }),
                new TextRun({text: " ⬤", color: ticket.vehicle.colour}),
              ],
            }),
            this.#field("Modelo", ticket.vehicle.model),
            this.#field("Estatus", accepted ? " ACEPTADO" : " CANCELADO", accepted ? "247A3D" : "A12A21"),
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
            this.#field("Código de verificación", String(ticket.verificationCode)),
          ],
        },
      ],
    });

    return Packer.toBlob(document);
  }

  #heading(text) {
    return new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, size: 30 })],
    });
  }

  #field(label, value, color = "202020") {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun({text: value, color: color}),
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
}
