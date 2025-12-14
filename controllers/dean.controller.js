import { supabase } from "../utils/supabaseAdmin.js";
import PDFDocument from "pdfkit";

export async function createExamDate(req, res) {
  const { date } = req.body;

  const { data, error } = await supabase
    .from("exam_dates")
    .insert({
      date,
      created_by: req.user.id
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
}

export async function generateSlots(req, res) {
  const { id: examDateId } = req.params;

  const { data: timeSlots, error: tsError } = await supabase
    .from("time_slots")
    .select("id");

  if (tsError) {
    return res.status(500).json({ message: "Failed to fetch time slots" });
  }

  const { data: classrooms, error: crError } = await supabase
    .from("classrooms")
    .select("id");

  if (crError) {
    return res.status(500).json({ message: "Failed to fetch classrooms" });
  }

  const slots = [];
  for (const time of timeSlots) {
    for (const room of classrooms) {
      slots.push({
        exam_date_id: examDateId,
        time_slot_id: time.id,
        classroom_id: room.id
      });
    }
  }

  if (slots.length === 0) {
    return res.status(400).json({ message: "No slots to generate" });
  }

  const { error } = await supabase
    .from("exam_slots")
    .insert(slots);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.json({
    message: `Generated ${slots.length} slots`
  });
}

export async function deleteExamDate(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("exam_dates")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.json({ message: "Deleted successfully" });
}

export async function deleteSlot(req, res) {
  const { slotId } = req.params;

  const { data: slot, error: fetchError } = await supabase
    .from("exam_slots")
    .select("assigned_faculty")
    .eq("id", slotId)
    .single();

  if (fetchError || !slot) {
    return res.status(404).json({ message: "Slot not found" });
  }

  if (slot.assigned_faculty) {
    return res
      .status(400)
      .json({ message: "Cannot delete slot with assigned faculty" });
  }

  const { error } = await supabase
    .from("exam_slots")
    .delete()
    .eq("id", slotId);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.json({ message: "Slot deleted successfully" });
}

export async function getSchedule(req, res) {
  const { date } = req.query;

  let query = supabase
    .from("exam_slots")
    .select(`
      id,
      subject_code,
      assigned_faculty,
      exam_dates (
        id,
        date
      ),
      time_slots (
        id,
        start_time,
        end_time,
        half
      ),
      classrooms (
        id,
        room_number
      )
    `)
    .order("exam_date_id")
    .order("time_slot_id")
    .order("classroom_id");

  if (date) {
    query = query.eq("exam_dates.date", date);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
}

const CELL_HEIGHT = 25;
const CELL_PADDING = 5;
const PAGE_MARGIN = 40;
function drawCell(doc, x, y, w, h, text) {
  doc.rect(x, y, w, h).stroke();

  doc
    .fontSize(9)
    .text(text, x + CELL_PADDING, y + CELL_PADDING, {
      width: w - CELL_PADDING * 2,
      height: h - CELL_PADDING * 2,
      align: "center",
      valign: "center"
    });
}

function drawTable(doc, date, data) {
  const { classrooms, slots } = data;

  const startX = PAGE_MARGIN;
  let startY = PAGE_MARGIN + 40;

  const pageWidth = doc.page.width - PAGE_MARGIN * 2;
  const timeColWidth = 120;
  const colWidth = (pageWidth - timeColWidth) / classrooms.length;

  doc.fontSize(16).text(`Exam Schedule — ${date}`, PAGE_MARGIN, PAGE_MARGIN);
  doc.moveDown();

  drawCell(doc, startX, startY, timeColWidth, CELL_HEIGHT, "Time");
  classrooms.forEach((room, i) => {
    drawCell(
      doc,
      startX + timeColWidth + i * colWidth,
      startY,
      colWidth,
      CELL_HEIGHT,
      room
    );
  });

  startY += CELL_HEIGHT;

  Object.keys(slots).forEach(time => {
    drawCell(doc, startX, startY, timeColWidth, CELL_HEIGHT, time);

    classrooms.forEach((room, i) => {
      drawCell(
        doc,
        startX + timeColWidth + i * colWidth,
        startY,
        colWidth,
        CELL_HEIGHT,
        slots[time][room] ?? "—"
      );
    });

    startY += CELL_HEIGHT;
  });
}

function generatePdf(res, slots) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=exam-schedule.pdf"
  );

  doc.pipe(res);

  const grouped = groupForTable(slots);
  const dates = Object.keys(grouped);

  dates.forEach((date, index) => {
    if (index !== 0) doc.addPage();
    drawTable(doc, date, grouped[date]);
  });

  doc.end();
}

export async function exportSchedulePdf(req, res) {
  const { data, error } = await supabase
    .from("exam_slots")
    .select(`
      exam_dates(date),
      time_slots(start_time, end_time),
      classrooms(room_number),
      assigned_faculty
    `)
    .order("exam_date_id", { ascending: true })
    .order("time_slot_id", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Failed to fetch schedule" });
  }

  generatePdf(res, data);
}