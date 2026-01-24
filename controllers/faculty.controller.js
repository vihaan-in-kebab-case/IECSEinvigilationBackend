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
      classrooms ( room_number ),
      profiles!fk_assigned_faculty (
      assigned_faculty_name: name )
    `)
    .or(`assigned_faculty.is.null,assigned_faculty.eq.${facultyId}`)
    .order("exam_dates(date)", { ascending: true })
    .order("start_time", { ascending: true });

    const enrichedData = data.map(slot => ({
        ...slot,
        status: slot.assigned_faculty ? "filled" : "open"
    }));

  if (error) {
    return res.status(500).json({ message: "Failed to fetch slots" });
  }
  res.json(enrichedData);
}

export async function assignSlot(req, res) {
  try {
    const { role, id } = req.user;
    const { slotId } = req.params;

    let facultyId;

    if (role === "faculty") {
      facultyId = id;
    }

    if (role === "dean") {
      facultyId = req.body.facultyId ?? id;
    }

    if (!facultyId) {
      return res.status(400).json({ message: "facultyId is required" });
    }

    const { data: faculty, error: facultyError } = await supabase
      .from("profiles")
      .select("id, faculty_scale, slot_quota")
      .eq("id", facultyId)
      .single();

    if (facultyError || !faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const { count, error: countError } = await supabase
      .from("exam_slots")
      .select("id", { count: "exact", head: true })
      .eq("assigned_faculty", facultyId);

    if (countError) {
      return res.status(500).json({ message: "Failed to verify faculty quota" });
    }

    if (count >= slot_quota) {
      return res.status(409).json({ message: "Faculty quota exceeded" });
    }

    const { data, error } = await supabase
      .from("exam_slots")
      .update({ assigned_faculty: facultyId })
      .eq("id", slotId)
      .is("assigned_faculty", null)
      .select()
      .single();

    if (error || !data) {
      return res.status(409).json({
        message: "Slot already assigned or not found"
      });
    }

    res.json({
      message: "Slot assigned successfully",
      slot: data
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
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

export async function getFacultyInfo(req, res) {
  const facultyId = req.user.id;
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, role, faculty_scale, slot_quota")
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
