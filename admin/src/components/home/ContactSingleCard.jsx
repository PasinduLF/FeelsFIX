import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa"; // Changed to heart icon for therapy theme
import { BiUserCircle, BiShow } from "react-icons/bi";
import { AiOutlineEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineDelete } from "react-icons/md";
import { useState } from "react";
import ContactModal from "./ContactModal"; // Updated to use contact modal
import PropTypes from "prop-types";

const ContactSingleCard = ({ contact }) => {
  // Changed from review to contact
  const [showModal, setShowModal] = useState(false);

  ContactSingleCard.propTypes = {
    contact: PropTypes.array.isRequired,
  };

  return (
    <div className="border-2 border-purple-300 rounded-2xl px-6 py-5 m-4 relative bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-purple-400">
      {/* Card Header with Name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="px-4 py-2 bg-purple-100 text-[#5F6FFF] font-semibold rounded-full text-lg shadow-sm">
            {contact.name} 🖋️
          </h2>
        </div>
        <FaHeart className="text-[#5F6FFF] text-2xl animate-pulse" />
      </div>

      {/* Photo Display */}
      <div className="mb-5">
        {contact.photo ? (
          <img
            src={`/images/${contact.photo}`}     // Updated path
            alt={`${contact.name}'s message`}
            className="w-full h-48 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 italic shadow-inner">
            No Photo Available 📸
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-x-2">
          <BiUserCircle className="text-[#5F6FFF] text-2xl" />
          <p className="text-gray-700 text-sm truncate">{contact.email} 📧</p>
        </div>
        <div className="flex items-center gap-x-2">
          <span className="text-[#5F6FFF] text-xl">📞</span>
          <p className="text-gray-700 text-sm truncate">{contact.phone}</p>
        </div>
        <div className="flex items-start gap-x-2">
          <span className="text-[#5F6FFF] text-xl">💬</span>
          <p className="text-gray-800 text-sm line-clamp-2">
            {contact.message}
          </p>
        </div>
        <div className="flex items-center gap-x-2">
          <span className="text-[#5F6FFF] text-xl">🏷️</span>
          <p className="text-gray-700 text-sm truncate">{contact.category || "No Category"}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-x-5 mt-6 p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <BiShow
          className="text-2xl text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200"
          onClick={() => setShowModal(true)}
          title="View Details"
        />
        <Link to={`/contact/details/${contact._id}`}>
          <BsInfoCircle
            className="text-2xl text-[#5F6FFF] hover:text-[#4b56cc] transition-colors duration-200"
            title="More Info"
          />
        </Link>
        <Link to={`/contact/delete/${contact._id}`}>
          <MdOutlineDelete
            className="text-2xl text-red-600 hover:text-red-800 transition-colors duration-200"
            title="Delete"
          />
        </Link>
      </div>

      {/* Modal */}
      {showModal && (
        <ContactModal contact={contact} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default ContactSingleCard;