import React from "react";

const Toast = ({ type = "info", children }) => {
  const base = "px-3 py-2 rounded-xl text-xs font-medium";
  const style = type === "error" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-sky-50 text-sky-700 border border-sky-100";
  return <div className={`${base} ${style}`}>{children}</div>;
};

export default Toast;
