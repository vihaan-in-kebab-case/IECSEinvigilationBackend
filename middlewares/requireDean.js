export function requireDean(req, res, next) {
  if (req.user.role !== "dean") {
    return res.status(403).json({ message: "Dean access only" });
  }
  next();
}