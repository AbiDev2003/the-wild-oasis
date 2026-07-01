import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingBottom: 16,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: "#666",
    letterSpacing: 4,
  },
  bookingRef: {
    fontSize: 10,
    color: "#999",
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#059669",
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  label: {
    color: "#666",
    width: "40%",
  },
  value: {
    width: "60%",
    textAlign: "right",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
  statusBadge: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  paid: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  unpaid: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  qrSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  qrImage: {
    width: 120,
    height: 120,
    marginBottom: 6,
  },
  qrText: {
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    fontSize: 9,
    color: "#999",
    textAlign: "right",
  },
  restaurantSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  restaurantItem: {
    fontSize: 9,
    color: "#555",
    marginLeft: 12,
    marginBottom: 2,
  },
});

// ─── Helper to format currency ───────────────────────────────────────────
function fmt(amount) {
  return `$${(amount ?? 0).toFixed(2)}`;
}

// ─── InvoicePDF Component ─────────────────────────────────────────────────
// Renders a full-page PDF invoice using @react-pdf/renderer.
// Props:
//   booking     – the full booking object from getBooking(id)
//   orders      – array of restaurant orders from getRestaurantOrders(id)
//   hotelName   – hotel name string (e.g. from settings)
function InvoicePDF({ booking, orders = [], hotelName = "The Wild Oasis", qrDataUrl }) {
  const {
    id,
    created_at,
    startDate,
    numNights,
    numGuests,
    cabinPrice,
    extrasPrice,
    numBreakfast,
    totalPrice,
    miscellaneousPrice,
    isPaid,
    checkInAt,
    checkOutAt,
    guests: { fullName: guestName, email, nationalID },
    cabins: { name: cabinName },
  } = booking;

  const restaurantTotal = orders.reduce(
    (sum, o) => sum + (o.totalprice || 0),
    0,
  );

  const verificationUrl = `${import.meta.env.VITE_BASE_URL}/verify-invoice?bookingId=${id}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.hotelName}>{hotelName}</Text>
          <Text style={styles.title}>I N V O I C E</Text>
          <Text style={styles.bookingRef}>
            Booking #{id} &nbsp;|&nbsp;{" "}
            {format(new Date(startDate), "MMM dd, yyyy")}
          </Text>
        </View>

        {/* ── Guest Info ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{guestName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>National ID</Text>
            <Text style={styles.value}>{nationalID}</Text>
          </View>
        </View>

        {/* ── Stay Info ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stay</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cabin</Text>
            <Text style={styles.value}>{cabinName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>
              {checkInAt
                ? format(new Date(checkInAt), "MMM dd, yyyy, h:mm a")
                : "\u2014"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>
              {checkOutAt
                ? format(new Date(checkOutAt), "MMM dd, yyyy, h:mm a")
                : "\u2014"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nights</Text>
            <Text style={styles.value}>{numNights}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Guests</Text>
            <Text style={styles.value}>{numGuests}</Text>
          </View>
        </View>

        {/* ── Charges ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges</Text>

          <View style={styles.priceRow}>
            <Text>
              Cabin ({numNights} night{numNights > 1 ? "s" : ""})
            </Text>
            <Text>{fmt(cabinPrice)}</Text>
          </View>

          {numBreakfast > 0 && (
            <View style={styles.priceRow}>
              <Text>
                Breakfast ({numBreakfast} &times;{" "}
                {extrasPrice > 0 && numBreakfast > 0
                  ? fmt(extrasPrice / numBreakfast)
                  : ""}
                )
              </Text>
              <Text>{fmt(extrasPrice)}</Text>
            </View>
          )}

          {miscellaneousPrice > 0 && (
            <View style={styles.priceRow}>
              <Text>Miscellaneous</Text>
              <Text>{fmt(miscellaneousPrice)}</Text>
            </View>
          )}

          {orders.length > 0 && (
            <View style={styles.restaurantSection}>
              <Text style={{ fontSize: 10, marginBottom: 4 }}>
                Restaurant Orders
              </Text>
              {orders.map((item, i) => (
                <View key={i} style={styles.restaurantItem}>
                  <Text>
                    {item.itemname} &times; {item.quantity} —{" "}
                    {fmt(item.totalprice)}
                  </Text>
                </View>
              ))}
              <View
                style={[
                  styles.priceRow,
                  { marginTop: 4, paddingTop: 4, borderTopWidth: 1 },
                ]}
              >
                <Text>Restaurant Total</Text>
                <Text>{fmt(restaurantTotal)}</Text>
              </View>
            </View>
          )}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text>TOTAL</Text>
            <Text>{fmt(totalPrice)}</Text>
          </View>

          {/* Payment status badge */}
          <View style={[styles.statusBadge, isPaid ? styles.paid : styles.unpaid]}>
            <Text>{isPaid ? "PAID" : "WILL PAY AT PROPERTY"}</Text>
          </View>
        </View>

        {/* ── QR Code ──────────────────────────────────────────── */}
        <View style={styles.qrSection}>
          {qrDataUrl && (
            <Image src={qrDataUrl} style={styles.qrImage} />
          )}
          <Text style={styles.qrText}>Scan to verify invoice authenticity</Text>
          <Text style={[styles.qrText, { fontSize: 7, color: "#bbb" }]}>
            {verificationUrl}
          </Text>
        </View>

        {/* ── Footer Timestamps ────────────────────────────────── */}
        <View style={styles.footer}>
          <Text>
            Checked in:{" "}
            {checkInAt
              ? format(new Date(checkInAt), "MMM dd, yyyy, h:mm a")
              : "\u2014"}
          </Text>
          <Text>
            Checked out:{" "}
            {checkOutAt
              ? format(new Date(checkOutAt), "MMM dd, yyyy, h:mm a")
              : "\u2014"}
          </Text>
          <Text>
            Booked: {format(new Date(created_at), "MMM dd, yyyy, h:mm a")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
