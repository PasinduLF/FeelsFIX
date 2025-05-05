import { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import Spinner from "../components/Spinner";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";

const EditContact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState(""); 
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:4000/contact/${id}`) // Updated endpoint
      .then((response) => {
        setName(response.data.name);
        setEmail(response.data.email);
        setPhone(response.data.phone);
        setMessage(response.data.message);
        setCategory(response.data.category);
        setPhoto(response.data.photo); // Store existing photo reference
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar("An error occurred while fetching contact data 😔", {
          variant: "error",
        });
        console.log(error);
      });
  }, [id, enqueueSnackbar]);

  const handleEditContact = () => {
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
    if (!/^\+?[0-9]\d{1,14}$/.test(phone)) {
      enqueueSnackbar("Please enter a valid phone number 📞", {
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
    if (!category) {  // Ensure category is selected
      enqueueSnackbar("Please select a category 📂", {
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
    if (photo && typeof photo !== "string") data.append("photo", photo); // Only append if new file

    setLoading(true);
    axios
      .put(`http://localhost:4000/contact/${id}`, data)
      .then(() => {
        setLoading(false);
        enqueueSnackbar("Contact Message Updated Successfully! 🌟", {
          variant: "success",
        });
        navigate("/inquiry");
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar("Error Updating Contact Message 😔", {
          variant: "error",
        });
        console.log(error);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white p-6">
      <div className="max-w-2xl mx-auto">
        <BackButton />

        {/* Header */}
        <h1 className="text-4xl font-bold text-[#5F6FFF] text-center my-8">
          Edit Contact Message 📝
        </h1>

        {loading && <Spinner />}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Name */}
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

          {/* Email */}
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

          {/* Phone */}
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

          {/* Category */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5F6FFF] focus:border-transparent"
            >
              <option value="">Select a Category</option>
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

          {/* Message */}
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

          {/* Photo */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Photo (Optional) 
            </label>
            {photo && typeof photo === "string" && (
              <div className="mb-4">
                <img
                  src={`../public/images/${photo}`} // Adjusted to use the photo directly
                  alt="Current contact"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">Current photo</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#5F6FFF] file:text-white hover:file:bg-[#4b56cc]"
            />
          </div>

          {/* Update Button */}
          <button
            onClick={handleEditContact}
            className="w-full py-3 bg-[#5F6FFF] text-white rounded-lg hover:bg-[#4b56cc] transition-colors font-semibold shadow-md"
          >
            Update Message 
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditContact;
