/** Uniform envelope so the frontend always reads `data`. */
export const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

export const fail = (res, status, message, data) =>
  res.status(status).json({ success: false, message, ...(data && { data }) });
