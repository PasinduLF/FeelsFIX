import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../../components/Spinner";
import { Link } from "react-router-dom";
import { MdOutlineAddBox } from "react-icons/md";
import ContactTable from "../../components/home/ContactTable";
import ContactCard from "../../components/home/ContactCard"; 


const Inquiry = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showType, setShowType] = useState("table");

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:4000/contact")
      .then((response) => {
        setContacts(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white p-6">
      <div className="max-w-7xl mx-auto">
        

        {/* Header Section */}
        <div className="flex justify-between items-center mt-6 mb-10">
          <h1 className="text-4xl font-extrabold text-[#5F6FFF] bg-purple-50 px-6 py-3 rounded-full shadow-md">
            FeelsFIX Contact Dashboard 
          </h1>

          <div className="flex items-center gap-x-6">
            {/* View Toggle Buttons */}
            <div className="flex gap-x-3">
              <button
                className={`px-5 py-2 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 shadow-md ${
                  showType === "table"
                    ? "bg-[#5F6FFF] text-white scale-105"
                    : "bg-white text-[#5F6FFF] hover:bg-purple-100 border border-purple-300"
                }`}
                onClick={() => setShowType("table")}
              >
                Table View 📋
              </button>
              <button
                className={`px-5 py-2 rounded-full font-semibold text-sm uppercase tracking-wide transition-all duration-300 shadow-md ${
                  showType === "card"
                    ? "bg-[#5F6FFF] text-white scale-105"
                    : "bg-white text-[#5F6FFF] hover:bg-purple-100 border border-purple-300"
                }`}
                onClick={() => setShowType("card")}
              >
                Card View 🖼️
              </button>
            </div>

            
           
          </div>
        </div>

        {/* Contact Count */}
        <div className="mb-8 bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Total Messages:{" "}
            <span className="text-[#5F6FFF] font-bold text-2xl">
              {contacts.length}
            </span>
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()} 
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Spinner />
        ) : showType === "table" ? (
          <ContactTable contacts={contacts} />
        ) : (
          <ContactCard contacts={contacts} />
        )}
      </div>
    </div>
  );
};

export default Inquiry;
