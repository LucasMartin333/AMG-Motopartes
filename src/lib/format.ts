export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
  }).format(new Date(date));
}

export function cnLabelRole(role: "ADMIN" | "EMPLOYEE") {
  return role === "ADMIN" ? "Administrador" : "Empleado";
}

export function movementTypeLabel(type: "PURCHASE" | "SALE" | "ADJUSTMENT") {
  const labels = {
    PURCHASE: "Compra",
    SALE: "Venta",
    ADJUSTMENT: "Ajuste",
  };
  return labels[type];
}
