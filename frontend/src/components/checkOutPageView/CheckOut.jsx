import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import "./checkOut.css";
import AccountNav from "../accounts/accountNav/accountNav";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

function CheckOut() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    console.log("User selected: ", newDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedDate) {
      setMessage("Please select a date before submitting.");
      return;
    }

    setIsProcessing(true);

    const appointmentDate = dayjs(selectedDate).format("YYYY-MM-DD"); // Format the date as needed

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/completion`,
        // Include the selectedDate in the metadata (or adjust based on your backend implementation)
        payment_method_data: {
          metadata: {
            appointmentDate: appointmentDate,
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setMessage(`Payment successful! Appointment Date: ${appointmentDate}`);
    } else if (paymentIntent && paymentIntent.status === "processing") {
      setMessage("Payment is still processing.");
    } else if (paymentIntent && paymentIntent.status === "requires_action") {
      setMessage("Payment requires additional authentication.");
    } else {
      setMessage("Unexpected state");
    }

    setIsProcessing(false);
  };

  return (
    <div className="payment-container">
      <AccountNav />
      <div className="payment-grid-cotainer">
        <div className="payment-header">
          <h1>Book an appointment</h1>
          <form>
            <label>
              <input type="text" name="name" placeholder="First Name" />
            </label>
            <label>
              <input type="text" name="name" placeholder="Last Name" />
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                label="Select appointment date"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </LocalizationProvider>
            {selectedDate && (
              <div>
                <p>Selected Date: {dayjs(selectedDate).format("YYYY-MM-DD")}</p>
              </div>
            )}
          </form>
        </div>
        <div className="payment-form-container">
          <form className="payment-form-sizing" onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={isProcessing} className="payment-button">
              <span>{isProcessing ? "Processing ..." : "Pay now"}</span>
            </button>
            {message && <div>{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CheckOut;
