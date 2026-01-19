import { supabase } from "../utils/supabaseAdmin.js";

export async function listSlots(req, res) {
  const facultyId = req.user.id;

  const { data, error } = await supabase
    .from("exam_slots")
    .select(`
      id,
      start_time,
      end_time,
      assigned_faculty,
      exam_dates ( date ),
      classrooms ( room_number )
    `)
    .or(`assigned_faculty.is.null,assigned_faculty.eq.${facultyId}`)
    .order("exam_dates(date)", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Failed to fetch slots" });
  }
  res.json(data);
}

export async function assignSlot(req, res) {
  const facultyId = req.user.id;   // logged-in faculty
  const { slotId } = req.params;

  // 1. Assign slot ONLY if it is unassigned
  const { data, error } = await supabase
    .from("exam_slots")
    .update({ assigned_faculty: facultyId })
    .eq("id", slotId)
    .is("assigned_faculty", null)
    .select()
    .single();

  if (error || !data) {
    return res.status(400).json({
      message: "Slot is already assigned or does not exist"
    });
  }

  res.json({
    message: "Slot assigned successfully",
    slot: data
  });
}


export async function getFacultyInfo(req, res) {
  const facultyId = req.user.id;

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, faculty_scale")
      .eq("id", facultyId)
      .single();

    if (profileError) {
      return res.status(500).json({ message: "Failed to fetch profile" });
    }

    const { data: slots, error: slotsError } = await supabase
      .from("exam_slots")
      .select(`
        id,
        exam_dates(date),
        start_time,
        end_time,
        classrooms(room_number)
      `)
      .eq("assigned_faculty", facultyId)
      .order("exam_dates(date)", { ascending: true })
      .order("start_time", { ascending: true });

    if (slotsError) {
      return res.status(500).json({ message: "Failed to fetch assigned slots" });
    }

    res.json({
      profile,
      assignedSlots: slots
    });
  } catch {
    res.status(500).json({ message: "Unexpected error" });
  }
}

export async function unassignSlot(req, res) {
  const facultyId = req.user.id;
  const { slotId } = req.params;

  try {
    const { error } = await supabase
      .from("exam_slots")
      .update({ assigned_faculty: null })
      .eq("id", slotId)
      .eq("assigned_faculty", facultyId);

    if (error) {
      return res.status(400).json({ message: "Cannot unassign slot" });
    }

    res.json({ message: "Slot unassigned successfully" });
  } catch {
    res.status(500).json({ message: "Unexpected error" });
  }
}
