import { useContext, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import Spinner from "../components/Spinner";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import { AppContext } from "../context/AppContext";

const DeleteContact = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { backendUrl } = useContext(AppContext);
  const apiBase = useMemo(() => backendUrl ? backendUrl.replace(/\/$/, '') : '', [backendUrl]);

  const handleDeleteContact = () => {
    setLoading(true);
    if (!apiBase) {
      enqueueSnackbar("Backend is not configured. Please try again later.", { variant: "error" });
      setLoading(false);
      return;
    }
    axios
      .delete(`${apiBase}/contact/${id}`)
      .then(() => {
        setLoading(false);
        enqueueSnackbar("Contact Message Deleted Successfully! 🗑️", {
          variant: "success",
        });
        navigate("/inquiry"); // Navigate back to the main page
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar("Error Deleting Contact Message 😔", {
          variant: "error",
        });
        console.log(error);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white p-6">
      <div className="max-w-md mx-auto">
        <BackButton />

        {/* Header */}
        <h1 className="text-3xl font-bold text-[#5F6FFF] mt-6 mb-8 text-center">
          Delete Contact Message 📩
        </h1>

        {loading && <Spinner />}

        {/* Confirmation Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Are you sure you want to delete this contact message? 
          </h3>

          {/* Warning Icon */}
          <div className="text-[#5F6FFF] text-4xl mb-6"></div>

          {/* Buttons */}
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 py-3 bg-[#5F6FFF] text-white rounded-lg font-semibold hover:bg-[#4b56cc] transition-colors duration-300 shadow-md"
              onClick={handleDeleteContact}
            >
              Yes, Delete It 
            </button>
            <button
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-300 shadow-md"
              onClick={() => navigate("/inquiry")}
            >
              Cancel 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteContact;
