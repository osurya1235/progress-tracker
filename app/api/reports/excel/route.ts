import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await prisma.dailyRecord.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      include: { goal: true, task: true },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    const monthLabel = new Date(year, month - 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Progress Tracker";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Monthly Report", {
      pageSetup: {
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      },
    });

    // Title row
    sheet.mergeCells("A1:D1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `Progress Report — ${monthLabel}`;
    titleCell.font = { bold: true, size: 16, color: { argb: "FF0A0A0A" } };
    titleCell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(1).height = 36;

    // Subtitle
    sheet.mergeCells("A2:D2");
    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = `Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}  •  ${records.length} entries`;
    subtitleCell.font = { size: 10, color: { argb: "FF6B6B6B" } };
    subtitleCell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(2).height = 22;

    sheet.addRow([]); // spacer

    // Header row
    const headerRow = sheet.addRow(["Date", "Goal", "Task", "Description"]);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0A" } };
      cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FF0A0A0A" } } };
    });

    // Data rows
    let prevDateStr = "";
    records.forEach((record, i) => {
      const dateStr = new Date(record.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const isNewDate = dateStr !== prevDateStr;
      prevDateStr = dateStr;

      const row = sheet.addRow([
        isNewDate ? dateStr : "",
        record.goal?.title ?? "—",
        record.task?.title ?? "—",
        record.description,
      ]);

      row.height = 22;
      const bg = i % 2 === 0 ? "FFFAFAFA" : "FFFFFFFF";
      row.eachCell((cell) => {
        cell.font = { size: 10 };
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      });

      if (isNewDate) {
        row.getCell(1).font = { size: 10, bold: true };
      }
    });

    // Footer
    sheet.addRow([]);
    const footerRow = sheet.addRow([`Total entries: ${records.length}`, "", "", ""]);
    footerRow.getCell(1).font = { size: 10, italic: true, color: { argb: "FF6B6B6B" } };

    // Column widths
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 28;
    sheet.getColumn(4).width = 54;

    // Print area
    sheet.pageSetup.printArea = `A1:D${sheet.rowCount}`;
    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="progress-${year}-${String(month).padStart(2, "0")}.xlsx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
