import { useState } from "react";
import BackButton from "../components/BackButton";
import Spinner from "../components/Spinner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleSendMessage = () => {
    // Validation
    if (!/^[A-Za-z\s]+$/.test(name)) {
      enqueueSnackbar("Please enter letters only for Name 🖋️", {
        variant: "error",
      });
      return;
    }
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      enqueueSnackbar("Please enter a valid email address 📧", {
        variant: "error",
      });
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      enqueueSnackbar("Please enter a valid 10-digit phone number 📞", {
        variant: "error",
      });
      return;
    }

    if (message.trim().length < 10) {
      enqueueSnackbar("Message must be at least 10 characters long 💬", {
        variant: "error",
      });
      return;
    }

    if (!category){
      enqueueSnackbar("Please select a category for your inquiry 🎯", {
        variant: "error",
      });
      return;
    }

    const data = new FormData();
    data.append("name", name);
    data.append("email", email);
    data.append("phone", phone);
    data.append("message", message);
    data.append("category", category);
    if (photo) data.append("photo", photo);

    setLoading(true);
    axios
      .post("http://localhost:4000/contact", data)
      .then(() => {
        setLoading(false);
        enqueueSnackbar("Message Sent Successfully! 🌟", {
          variant: "success",
        });
        navigate("/inquiry");
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar("Error sending message 😔", { variant: "error" });
        console.log(error);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white p-6">
      <BackButton />
      <h1 className="text-4xl font-bold text-center my-6 text-[#5F6FFF]">
        Get in Touch with Us
      </h1>

      {loading && <Spinner />}

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col md:flex-row gap-8">
        {/* Contact Form */}
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-semibold text-[#5F6FFF] mb-4">
            Contact Form 
          </h2>

          {/* Name Input */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Full Name 
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5F6FFF] focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Email 
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5F6FFF] focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Phone Number 
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5F6FFF] focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>

          {/*Drop down options for inquiries*/}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Select a Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5F6FFF] focus:border-transparent"
              >
                <option value="">-- Choose a category --</option>
                <option value="Booking Issues">Booking Issues</option>
                <option value="Payment or Bank Slip Issues">Payment or Bank Slip Issues</option>
                <option value="Therapist-Related Concern">Therapist-Related Concern</option>
                <option value="Technical Error / Bug">Technical Error / Bug</option>
                <option value="Feedback or Suggestions">Feedback or Suggestions</option>
                <option value="Workshop Inquiries">Workshop Inquiries</option>
                <option value="Account or Profile Issues">Account or Profile Issues</option>
                <option value="Other / General Inquiry">Other / General Inquiry</option>
              </select>
          </div>


          {/* Message Textarea */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Your Message 
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-[#5F6FFF] focus:border-transparent"
              placeholder="Tell us how we can help you..."
            />
          </div>

          {/* Photo Upload (Optional) */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Add a Photo (Optional) 
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#5F6FFF] file:text-white hover:file:bg-[#4b56cc]"
            />
          </div>

          {/* Send Message Button */}
          <button
            onClick={handleSendMessage}
            className="w-full py-3 bg-[#5F6FFF] text-white rounded-lg hover:bg-[#4b56cc] transition-colors font-semibold"
          >
            Send Message 
          </button>
        </div>

        {/* Contact Information */}
        <div className="flex-1 bg-[#5F6FFF] text-white rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Contact Info 📍</h2>
          <div className="space-y-4">
            <p>
              <span className="font-medium">Phone:</span> +94 (077) 123-4567 
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              feelsfix@gmail.com 
            </p>
            <p>
              <span className="font-medium">Address:</span> Lot 12/3, Diyagama
              E.P.Z., Wiyagama, Diyagama K65/0 
            </p>
          </div>

          <h2 className="text-2xl font-semibold mt-6 mb-4">
            Business Hours ⏰
          </h2>
          <div className="space-y-2">
            <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
            <p>Saturday: 10:00 AM - 4:00 PM</p>
            <p>Sunday: Closed </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
