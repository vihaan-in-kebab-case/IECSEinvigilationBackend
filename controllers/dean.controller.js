import { supabase } from "../utils/supabaseAdmin.js";
import PDFDocument from "pdfkit";


export async function listExamDates(req, res) {
  const { data, error } = await supabase
    .from("exam_dates")
    .select("id, date")
    .order("date", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Failed to fetch exam dates" });
  }
  res.json(data);
}

export async function createExamDates(req, res) {
  const { start_date, end_date } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ message: "Start and end dates required" });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (start > end) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const dates = [];
  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    dates.push({
      date: d.toISOString().split("T")[0],
      created_by: req.user.id
    });
  }

  const { data, error } = await supabase
    .from("exam_dates")
    .insert(dates)
    .select();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json({
    message: `Created ${data.length} exam dates`,
    dates: data
  });
}

export async function listClassrooms(req,res) {
  const { data, error } = await supabase
    .from("classrooms")
    .select("id, room_number")
    .order("room_number", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Failed to fetch classrooms" });
  }

  res.json(data);
}

export async function createClassroom(req, res) {
  const { room_number } = req.body;

  if (!room_number) {
    return res.status(400).json({ message: "Room number required" });
  }

  const { data, error } = await supabase
    .from("classrooms")
    .insert({ room_number, created_by: req.user.id })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
}

export async function createExamSlot(req, res) {
  const {
    date_id,
    classroom_id,
    start_time,
    end_time,
  } = req.body;

  if (
    !date_id ||
    !classroom_id ||
    !start_time ||
    !end_time
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const { count, error: dupError } = await supabase
    .from("exam_slots")
    .select("id", { count: "exact", head: true })
    .eq("date_id", date_id)
    .eq("classroom_id", classroom_id)
    .eq("start_time", start_time)
    .eq("end_time", end_time);

  if (dupError) {
    return res.status(500).json({ message: "Failed to check duplicates" });
  }

  if (count > 0) {
    return res.status(409).json({
      message: "Slot already exists for this date, classroom and time"
    });
  }

  const { data, error } = await supabase
    .from("exam_slots")
    .insert({
      date_id,
      classroom_id,
      start_time,
      end_time,
      created_by: req.user.id
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
}

export async function deleteClassroom(req, res) {
  const { classroomId } = req.params;
  const { data, error } = await supabase
    .from("classrooms")
    .delete()
    .eq("id", classroomId)
    .select();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  res.json({ message: "Classroom deleted successfully" });
}

export async function deleteExamDate(req, res) {
  const { dateId } = req.params;

  const { data, error } = await supabase
    .from("exam_dates")
    .delete()
    .eq("id", dateId)
    .select();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ message: "Exam date not found" });
  }

  res.json({ message: "Exam date deleted successfully" });
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
    return res.status(400).json({
      message: "Cannot delete slot with assigned faculty"
    });
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
  assigned_faculty,
  start_time,
  end_time,
  exam_dates (
    id,
    date
  ),
  classrooms (
    id,
    room_number
  ),
  profiles:assigned_faculty (
    id,
    name,
    email,
    faculty_scale
  )
`)

    .order("date_id")
    .order("start_time")
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

function groupForTable(rows) {
  const result = {};

  rows.forEach(row => {
    const date = row.exam_dates.date;
    const room = row.classrooms.room_number;
    const timeKey = `${row.start_time} - ${row.end_time}`;

    if (!result[date]) {
      result[date] = {
        classrooms: new Set(),
        slots: {}
      };
    }

    result[date].classrooms.add(room);

    if (!result[date].slots[timeKey]) {
      result[date].slots[timeKey] = {};
    }

    result[date].slots[timeKey][room] = row.assigned_faculty ? "Assigned" : "—";
  });

  Object.values(result).forEach(day => {
    day.classrooms = Array.from(day.classrooms).sort();
  });

  return result;
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
      start_time,
      end_time,
      classrooms(room_number),
      assigned_faculty
    `)
    .order("date_id", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Failed to fetch schedule" });
  }

  generatePdf(res, data);
}

export async function onboardFaculty(req, res) {
  const { email, password, faculty_scale, slot_quota } = req.body;

  if (!email || !password || faculty_scale === undefined) {
    return res.status(400).json({
      message: "Email, password and faculty_scale are required"
    });
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

  if (authError) {
    return res.status(400).json({ message: authError.message });
  }

  const userId = authData.user.id;
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      role: "faculty",
      faculty_scale,
      slot_quota
    });

  if (profileError) {
    return res.status(500).json({
      message: "Failed to create faculty profile"
    });
  }

  res.status(201).json({
    message: "Faculty onboarded successfully",
    faculty: {
      id: userId,
      email,
      faculty_scale
    }
  });
}

export async function assignSlotForcefully(req, res) {

}