const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatINR = (rupees: number) => fmt.format(rupees);

export const percentOff = (price: number, mrp?: number | null) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
