import supabase from "./supabase";

export async function getRestaurantOrders(bookingId) {
  const { data, error } = await supabase
    .from("restaurantorders")
    .select("*")
    .eq("bookingid", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Restaurant orders could not be loaded");
  }

  return data;
}

export async function createRestaurantOrder({ bookingId, itemName, quantity, unitPrice }) {
  console.log("📦 createRestaurantOrder called with:", { bookingId, itemName, quantity, unitPrice });

  const insertData = {
    bookingid: bookingId,
    itemname: itemName,
    quantity,
    unitprice: unitPrice,
    totalprice: quantity * unitPrice,
  };
  console.log("📤 Insert data:", insertData);

  const { data, error } = await supabase.from("restaurantorders").insert([insertData]);

  console.log("📥 Supabase response:", { data, error });

  if (error) {
    console.error("❌ Supabase error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      statusCode: error.statusCode,
      status: error.status,
    });
    throw new Error("Order could not be added");
  }

  return data;
}
