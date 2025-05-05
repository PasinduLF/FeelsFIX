import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import Spinner from "../components/Spinner";

const ShowContact = () => {
  const [contact, setContact] = useState({});
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:4000/contact/${id}`) // Updated endpoint
      .then((response) => {
        setContact(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <BackButton />

        {/* Header */}
        <h1 className="text-4xl font-bold text-[#5F6FFF] text-center my-8">
          Contact Message Details 📩
        </h1>

        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* ID */}
            <div className="flex items-center border-b pb-4">
              <span className="text-lg font-medium text-gray-600 w-32">ID</span>
              <span className="text-gray-800">{contact._id}</span>
            </div>

            {/* Name */}
            <div className="flex items-center border-b pb-4">
              <span className="text-lg font-medium text-gray-600 w-32">
                Name 
              </span>
              <span className="text-gray-800 font-semibold">{contact.name}</span>
            </div>

            {/* Email */}
            <div className="flex items-center border-b pb-4">
              <span className="text-lg font-medium text-gray-600 w-32">
                Email 
              </span>
              <span className="text-gray-800">{contact.email}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center border-b pb-4">
              <span className="text-lg font-medium text-gray-600 w-32">
                Phone 
              </span>
              <span className="text-gray-800">{contact.phone}</span>
            </div>

            {/* Category */}
            <div className="flex items-center border-b pb-4">
              <span className="text-lg font-medium text-gray-600 w-32">
                Category
              </span>
              <span className="text-gray-800">{contact.category}</span>
            </div>

            {/* Message */}
            <div className="flex flex-col border-b pb-4">
              <span className="text-lg font-medium text-gray-600 mb-2">
                Message 
              </span>
              <p className="text-gray-800 leading-relaxed">{contact.message}</p>
            </div>

            

            {/* Timestamps */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <span className="text-lg font-medium text-gray-600 w-32">
                  Created 
                </span>
                <span className="text-gray-700">
                  {new Date(contact.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-medium text-gray-600 w-32">
                  Updated 
                </span>
                <span className="text-gray-700">
                  {new Date(contact.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowContact;