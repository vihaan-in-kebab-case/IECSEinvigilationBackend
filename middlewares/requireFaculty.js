export function requireFaculty(req, res, next) {
  if (req.user.role !== "faculty") {
    return res.status(403).json({ message: "Faculty access only" });
  }
  next();
}