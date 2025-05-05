import { AiOutlineClose } from "react-icons/ai";
import { MdEmail } from "react-icons/md";
import { BiUserCircle } from "react-icons/bi";
import { BsChatText } from "react-icons/bs"; // Kept for message
import { MdAttachFile } from "react-icons/md"; // Kept for photo
import { FaPhone } from "react-icons/fa"; // New icon for phone
import PropTypes from 'prop-types';

// eslint-disable-next-line react/prop-types
const ContactModal = ({ contact, onClose }) => {

  ContactModal.propTypes = {
    contact: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      category: PropTypes.string,     // optional, because you used || fallback
      message: PropTypes.string.isRequired,
      photo: PropTypes.string,         // optional, because you check if it exists
    }).isRequired,
    onClose: PropTypes.func.isRequired,
  };
  
  return (
    <div
      className="fixed bg-black bg-opacity-70 top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-[700px] max-w-full max-h-[90vh] bg-white rounded-2xl p-6 flex flex-col relative shadow-2xl overflow-y-auto"
      >
        {/* Close Button */}
        <AiOutlineClose
          className="absolute right-6 top-6 text-3xl text-red-600 hover:text-red-800 cursor-pointer transition-colors duration-200"
          onClick={onClose}
        />

        {/* ID Header */}
        <h2 className="w-fit px-4 py-2 bg-purple-100 text-[#5F6FFF] font-semibold rounded-full mb-4">
          Message #{contact._id.slice(-6)} 📩{" "}
          {/* Show last 6 chars of ID for brevity */}
        </h2>

        {/* Content */}
        <div className="space-y-5">
          {/* Name */}
          <div className="flex items-center gap-x-3">
            <BiUserCircle className="text-[#5F6FFF] text-3xl" />
            <div className="flex-1">
              <span className="text-gray-600 font-medium">Name 🖋️</span>
              <p className="text-lg text-gray-800 font-semibold">
                {contact.name}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-x-3">
            <MdEmail className="text-[#5F6FFF] text-3xl" />
            <div className="flex-1">
              <span className="text-gray-600 font-medium">Email 📧</span>
              <p className="text-lg text-gray-800">{contact.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-x-3">
            <FaPhone className="text-[#5F6FFF] text-3xl" />
            <div className="flex-1">
              <span className="text-gray-600 font-medium">Phone 📞</span>
              <p className="text-lg text-gray-800">{contact.phone}</p>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-x-3">
              <span className="text-[#5F6FFF] text-3xl">🏷️</span>
            <div className="flex-1">
              <span className="text-gray-600 font-medium">Category 🏷️</span>
              <p className="text-lg text-gray-800">{contact.category || "No category specified"}</p>
            </div>
          </div>

          {/* Message */}
          <div className="flex items-start gap-x-3">
            <BsChatText className="text-[#5F6FFF] text-3xl" />
            <div className="flex-1">
              <span className="text-gray-600 font-medium">Message 💬</span>
              <p className="text-gray-800 leading-relaxed">{contact.message}</p>
            </div>
          </div>

          {/* Photo */}
          <div className="flex items-start gap-x-3">
            <MdAttachFile className="text-[#5F6FFF] text-3xl" />
            <div className="flex-1">
              <span className="text-gray-600 font-medium">Photo 📸</span>
              {contact.photo ? (
                <img
                  src={`../public/images/${contact.photo}`}
                  alt={`${contact.name}'s message`}
                  className="mt-2 w-full max-w-sm h-auto rounded-lg shadow-md"
                />
              ) : (
                <p className="text-gray-500 italic mt-1">No photo attached</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
